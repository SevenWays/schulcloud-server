import { SyncError } from '../../../errors/applicationErrors';

const _ = require('lodash');
const { getChannel } = require('../../../utils/rabbitmq');
const logger = require('../../../logger');
const { UserRepo, ClassRepo, SchoolRepo } = require('../repo');

const { BadRequest } = require('../../../errors');

const { LDAP_SYNC_ACTIONS, LDAP_SYNC_CHANNEL_NAME } = require('./LDAPSyncer');

class LDAPSyncerConsumer {
	async executeMessage(incomingMessage) {
		const content = JSON.parse(incomingMessage.content.toString());
		switch (content.action) {
			case LDAP_SYNC_ACTIONS.SYNC_SCHOOL: {
				return this.schoolAction(content.data);
			}

			case LDAP_SYNC_ACTIONS.SYNC_USER: {
				return this.userAction(content.data);
			}

			case LDAP_SYNC_ACTIONS.SYNC_CLASSES: {
				return this.classAction(content.data);
			}

			default: {
				// message can't be processed
				throw new BadRequest(`${content.action} is not valid message action`);
			}
		}
	}

	async schoolAction(schoolData = {}) {
		try {
			const school = await SchoolRepo.findSchoolByLdapIdAndSystem(schoolData.ldapSchoolIdentifier, schoolData.systems);

			if (school !== null) {
				if (school.name !== schoolData.name) {
					await SchoolRepo.updateSchoolName(school._id, schoolData.name);
				}
			} else {
				await SchoolRepo.createSchool(schoolData);
			}
		} catch (err) {
			throw new SyncError(LDAP_SYNC_ACTIONS.SYNC_SCHOOL, schoolData.syncId, err);
		}
	}

	async userAction({ user, account, syncId } = {}) {
		try {
			const school = await SchoolRepo.findSchoolByLdapIdAndSystem(user.schoolDn, user.systemId);
			if (school !== null) {
				const foundUser = await UserRepo.findByLdapIdAndSchool(user.ldapId, school._id);
				if (foundUser !== null) {
					await this.updateUserAndAccount(foundUser, user, account);
				} else {
					await this.createUserAndAccount(user, account, school._id);
				}
			}
		} catch (err) {
			throw new SyncError(LDAP_SYNC_ACTIONS.SYNC_USER, syncId, err);
		}
	}

	async updateUserAndAccount(foundUser, user, account) {
		const updateObject = {};
		if (user.firstName !== foundUser.firstName) {
			updateObject.firstName = user.firstName || ' ';
		}
		if (user.lastName !== foundUser.lastName) {
			updateObject.lastName = user.lastName;
		}
		// Updating SchoolId will cause an issue. We need to discuss about it
		if (user.email !== foundUser.email) {
			updateObject.email = user.email;
		}
		if (user.ldapDn !== foundUser.ldapDn) {
			updateObject.ldapDn = user.ldapDn;
		}
		// Role
		const userRoles = foundUser.roles && foundUser.roles.map((r) => r.name);
		if (!_.isEqual(userRoles, user.roles)) {
			updateObject.roles = user.roles;
		}
		if (!_.isEmpty(updateObject)) {
			return UserRepo.updateUserAndAccount(foundUser._id, updateObject, account);
		}
		return true;
	}

	async createUserAndAccount(idmUser, account, schoolId) {
		idmUser.schoolId = schoolId;
		return UserRepo.createUserAndAccount(idmUser, account);
	}

	async classAction(classData = {}) {
		try {
			const school = await SchoolRepo.findSchoolByLdapIdAndSystem(classData.schoolDn, classData.systemId);

			if (school !== null) {
				const existingClass = await ClassRepo.findClassByYearAndLdapDn(school.currentYear, classData.ldapDN);
				if (existingClass !== null) {
					if (existingClass.name !== classData.name) {
						await ClassRepo.updateClassName(existingClass._id, classData.name);
					}
				} else {
					const newClass = {
						name: classData.name,
						schoolId: school._id,
						nameFormat: 'static',
						ldapDN: classData.ldapDN,
						year: school.currentYear,
					};
					await ClassRepo.createClass(newClass);
				}
			}
		} catch (err) {
			throw new SyncError(LDAP_SYNC_ACTIONS.SYNC_CLASSES, classData.syncId, err);
		}
	}
}

const setupConsumer = () => {
	const syncQueue = getChannel(LDAP_SYNC_CHANNEL_NAME, { durable: true });
	const consumer = new LDAPSyncerConsumer();

	const handleMessage = (incomingMessage) =>
		consumer
			.executeMessage(incomingMessage)
			.then(() => true)
			.catch((err) => {
				logger.error(err);
				return false;
			})
			.finally(() => syncQueue.ackMessage(incomingMessage));

	return syncQueue.consumeQueue(handleMessage, { noAck: false });
};

module.exports = {
	consumer: setupConsumer,
	LDAPSyncerConsumer,
};
