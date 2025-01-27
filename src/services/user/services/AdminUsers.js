/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
const { authenticate } = require('@feathersjs/authentication').hooks;
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { Forbidden, BadRequest, GeneralError } = require('../../../errors');
const logger = require('../../../logger');
const { createMultiDocumentAggregation } = require('../utils/aggregations');
const { splitForSearchIndexes } = require('../../../utils/search');
const { hasSchoolPermission, blockDisposableEmail, transformToDataTransferObject } = require('../../../hooks');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { validateParams, parseRequestQuery } = require('../hooks/adminUsers.hooks');
const { sendRegistrationLink, protectImmutableAttributes } = require('../hooks/userService');

const { userModel } = require('../model');

const getCurrentUserInfo = (id) => userModel.findById(id).select('schoolId').lean().exec();

const getCurrentYear = (ref, schoolId) =>
	ref.app
		.service('schools')
		.get(schoolId, {
			query: { $select: ['currentYear'] },
		})
		.then(({ currentYear }) => currentYear.toString());

const setSearchParametesIfExist = (clientQuery, query) => {
	if (clientQuery.searchQuery && clientQuery.searchQuery.trim().length !== 0) {
		const amountOfSearchWords = clientQuery.searchQuery.split(' ').length;
		const searchQueryElements = splitForSearchIndexes(clientQuery.searchQuery.trim());
		query.searchQuery = `${clientQuery.searchQuery} ${searchQueryElements.join(' ')}`;
		// increase gate by searched word, to get better results
		query.searchFilterGate = searchQueryElements.length * 2 + amountOfSearchWords;
		// recreating sort here, to set searchQuery as first (main) parameter of sorting
		query.sort = {
			...query.sort,
			searchQuery: 1,
		};
	}
};

class AdminUsers {
	constructor(roleName) {
		this.roleName = roleName;
		this.docs = {};
	}

	async setRole() {
		if (!this.role) {
			const role = await this.app.service('roles').find({
				query: { name: this.roleName },
			});
			this.role = role.data[0];
		}
	}

	async find(params) {
		return this.getUsers(undefined, params);
	}

	async get(id, params) {
		return this.getUsers(id, params);
	}

	async getUsers(_id, params) {
		// integration test did not get the role in the setup
		// so here is a workaround set it at first call
		await this.setRole();

		try {
			const { query: clientQuery = {}, account } = params;
			const currentUserId = account.userId.toString();

			// fetch base data
			const { schoolId } = await getCurrentUserInfo(currentUserId);
			const schoolYearId = await getCurrentYear(this, schoolId);

			const query = {
				schoolId,
				roles: this.role._id,
				schoolYearId,
				sort: clientQuery.$sort || clientQuery.sort,
				select: [
					'consentStatus',
					'consent',
					'classes',
					'firstName',
					'lastName',
					'email',
					'createdAt',
					'importHash',
					'birthday',
					'preferences.registrationMailSend',
					'lastLoginSystemChange',
					'outdatedSince',
				],
				skip: clientQuery.$skip || clientQuery.skip,
				limit: clientQuery.$limit || clientQuery.limit,
			};
			if (_id) {
				query._id = _id;
			} else if (clientQuery.users) {
				query._id = clientQuery.users;
				// If the number of users exceeds 20, the underlying parsing library
				// will convert the array to an object with the index as the key.
				// To continue working with it, we convert it here back to the array form.
				// See the documentation for further infos: https://github.com/ljharb/qs#parsing-arrays
				if (typeof query._id === 'object') query._id = Object.values(query._id);
			}
			if (clientQuery.consentStatus) query.consentStatus = clientQuery.consentStatus;
			if (clientQuery.classes) query.classes = clientQuery.classes;
			if (clientQuery.firstName) query.firstName = clientQuery.firstName;
			if (clientQuery.lastName) query.lastName = clientQuery.lastName;
			setSearchParametesIfExist(clientQuery, query);

			const dateQueries = ['createdAt', 'outdatedSince', 'lastLoginSystemChange'];
			for (const dateQuery of dateQueries) {
				if (clientQuery[dateQuery]) {
					if (typeof clientQuery[dateQuery] === 'object') {
						for (const [key, value] of Object.entries(clientQuery[dateQuery])) {
							if (['$gt', '$gte', '$lt', '$lte'].includes(key)) {
								clientQuery[dateQuery][key] = new Date(value);
							}
						}
						query[dateQuery] = clientQuery[dateQuery];
					} else {
						query[dateQuery] = new Date(clientQuery[dateQuery]);
					}
				}
			}

			return new Promise((resolve, reject) =>
				userModel
					.aggregate(createMultiDocumentAggregation(query))
					.option({
						collation: { locale: 'de', caseLevel: true },
					})
					.exec((err, res) => {
						if (err) reject(err);
						else resolve(res[0] || {});
					})
			);
		} catch (err) {
			if ((err || {}).code === 403) {
				throw new Forbidden('You have not the permission to execute this.', err);
			}
			if (err && err.code >= 500) {
				const uuid = uuidv4();
				logger.error(uuid, err);
				if (Configuration.get('NODE_ENV') !== 'production') {
					throw err;
				}
				throw new GeneralError(uuid);
			}
			throw err;
		}
	}

	async create(_data, _params) {
		const currentUserId = _params.account.userId.toString();
		const { schoolId } = await getCurrentUserInfo(currentUserId);
		await this.checkIfExternallyManaged(schoolId);
		const { email } = _data;
		await this.checkMail(email);
		await this.setRole();
		return this.app.service('usersModel').create({
			..._data,
			schoolId,
			roles: [this.role._id],
		});
	}

	async update(_id, _data, _params) {
		// route should be blocked
		return this.patch(_id, _data, _params);
	}

	async patch(_id, _data, _params) {
		if (!_id) throw new BadRequest('id is required');
		await this.setRole();
		const params = await this.prepareParams(_id, _params);
		await this.checkIfExternallyManaged(params.query.schoolId);

		const { email, password, createAccount } = _data;
		await this.checkMail(email, _id);
		if (!createAccount) {
			await this.updateAccount(email, _id);
		}

		// _id is part of params and will be combined with the schoolId
		const createdUsers = await this.prepareRoleback(email, _id, () =>
			this.app.service('usersModel').patch(null, _data, params)
		);

		if (createdUsers.length === 0) throw new BadRequest('user could not be edit');

		const createdUser = createdUsers[0];
		if (createAccount) {
			await this.createAccount({
				username: createdUser.email,
				password,
				userId: createdUser._id.toString(),
				activated: true,
			});
		}
		return createdUser;
	}

	/**
	 * Should be used only in create in future, t
	 * he user itself should get a flag to define if it is from a external system
	 * @param {*} schoolId
	 */
	async checkIfExternallyManaged(schoolId) {
		const { isExternal } = await this.app.service('schools').get(schoolId);
		if (isExternal) {
			throw new Forbidden('Creating, editing, or removing students or teachers is only possible in the source system.');
		}
	}

	/**
	 * Create a params value for following request to filter and secure request
	 * - admins only allowed to change user on own school
	 * @param {Object} params - Feathersjs params
	 */
	async prepareParams(_id, params) {
		const currentUserId = params.account.userId.toString();
		const { schoolId } = await getCurrentUserInfo(currentUserId);

		return {
			query: {
				_id,
				roles: this.role._id,
				schoolId: schoolId.toString(),
			},
		};
	}

	/**
	 * request user and compare the email address.
	 * if possible it should be solved via unique index on database
	 * @param {string} email
	 * @param {string} userId
	 */
	async checkMail(email, userId) {
		if (email) {
			const user = await this.app.service('usersModel').find({ query: { email: email.toLowerCase() } });
			if (userId && user.total === 1 && equalIds(user.data[0]._id, userId)) return;
			if (user.total !== 0) {
				throw new BadRequest('Email already exists.');
			}
		}
	}

	/**
	 * Update the account email if email will be changed on user.
	 * IMPORTANT: Keep in mind to do a roleback if saving the user failed
	 * @param {*} email
	 * @param {*} userId
	 */
	async updateAccount(email, userId) {
		if (email) {
			email = email.toLowerCase();
			const account = await this.app.service('nest-account-service').findByUserId(userId.toString());
			if (account) {
				await this.app.service('nest-account-service').updateUsername(account.id, email);
			}
		}
	}

	async createAccount(account) {
		if (account.username) {
			await this.app.service('nest-account-uc').saveAccount(account);
		}
	}

	async prepareRoleback(email, userId, fu) {
		try {
			return await fu();
		} catch (err) {
			if (email) {
				const { email: oldMail } = await this.app.service('usersModel').get(userId);
				const account = await this.app.service('nest-account-service').findByUserIdOrFail(userId.toString());
				await this.app.service('nest-account-service').updateUsername(account.id, oldMail);
			}
			throw err;
		}
	}

	async setup(app) {
		this.app = app;
	}
}

const formatBirthdayOfUsers = ({ result: { data: users } }) => {
	users.forEach((user) => {
		if (user.birthday) user.birthday = moment(user.birthday).format('DD.MM.YYYY');
	});
};

const adminHookGenerator = (kind) => ({
	before: {
		all: [authenticate('jwt')],
		find: [hasSchoolPermission(`${kind}_LIST`)],
		get: [hasSchoolPermission(`${kind}_LIST`)],
		create: [hasSchoolPermission(`${kind}_CREATE`), blockDisposableEmail('email')],
		update: [hasSchoolPermission(`${kind}_EDIT`), protectImmutableAttributes, blockDisposableEmail('email')],
		patch: [hasSchoolPermission(`${kind}_EDIT`), protectImmutableAttributes, blockDisposableEmail('email')],
		remove: [hasSchoolPermission(`${kind}_DELETE`), parseRequestQuery, validateParams],
	},
	after: {
		all: [transformToDataTransferObject],
		find: [formatBirthdayOfUsers],
		create: [sendRegistrationLink],
	},
});

module.exports = {
	AdminUsers,
	adminHookGenerator,
};
