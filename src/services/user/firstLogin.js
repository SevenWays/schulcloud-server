const moment = require('moment');
const { Configuration } = require('@hpi-schul-cloud/commons');
const constants = require('../../utils/constants');
const { passwordsMatch } = require('../../utils/passwordHelpers'); // fixmer this should be removed

const getAutomaticConsent = () => ({
	form: 'digital',
	source: 'automatic-consent',
	privacyConsent: true,
	dateOfPrivacyConsent: Date.now(),
	termsOfUseConsent: true,
	dateOfTermsOfUseConsent: Date.now(),
});

/**
 * Parse a given string as ISO date or timestamp.
 * If a timestamp is provided only the date part is taken into account.
 * The returned date object's time will be always at 00:00.
 * @param {string} dateString
 * @returns {Date}
 * @throws if the date is invalid
 */
const parseDate = (dateString) => {
	const date = moment.utc(dateString, 'YYYY-MM-DD');
	if (!date.isValid()) {
		throw new Error('Bitte einen validen Geburtstag auswählen.');
	}
	return date.toDate();
};

const firstLogin = async (data, params, app) => {
	if (!passwordsMatch(data['password-1'], data['password-2'])) {
		return Promise.reject(new Error('Die neuen Passwörter stimmen nicht überein.'));
	}

	const { accountId } = params.authentication.payload;
	const accountUpdate = {};
	let accountPromise = Promise.resolve();
	const userUpdate = {};
	let consentPromise = Promise.resolve();
	let updateConsentUsingVersions = Promise.resolve();
	const user = await app.service('users').get(params.account.userId);

	if (data['password-1']) {
		accountUpdate.password_verification = data.password_verification || data['password-2'];
		accountUpdate.password = data['password-1'];
		accountPromise = await app.service('accounts').patch(accountId, accountUpdate, params);
	}

	if (data.studentBirthdate) {
		userUpdate.birthday = parseDate(data.studentBirthdate);
	}

	if (data['student-email']) {
		if (!constants.expressions.email.test(data['student-email'])) {
			return Promise.reject(new Error('Bitte eine valide E-Mail-Adresse eingeben.'));
		}
		userUpdate.email = data['student-email'];
	}

	const preferences = user.preferences || {};
	preferences.firstLogin = true;
	userUpdate.preferences = preferences;
	userUpdate.forcePasswordChange = false;

	const userPromise = app.service('users').patch(user._id, userUpdate, { account: params.account });

	// Update consents
	let consentUpdate = {};

	const consentSkipCondition = Configuration.get('SKIP_CONDITIONS_CONSENT');
	if (consentSkipCondition !== '') {
		// If one of the user's roles is included in one of the groups defined as
		// skip condition, an automatic digital consent is given
		const roleMapping = {
			employee: ['administrator', 'teacher'],
			student: ['student'],
		};
		const userRoles = await app.service('roles').find({
			query: { _id: { $in: user.roles }, $select: ['name'] },
			paginate: false,
		});
		for (const [condition, allowedRoles] of Object.entries(roleMapping)) {
			if (consentSkipCondition.includes(condition)) {
				for (const role of userRoles) {
					if (allowedRoles.includes(role.name)) {
						consentUpdate = {
							userId: user._id,
							userConsent: getAutomaticConsent(),
							parentConsents: [getAutomaticConsent()],
						};
						break;
					}
				}
			}
		}
	}

	if (data.privacyConsent || data.termsOfUseConsent) {
		consentUpdate.userId = user._id;
		consentUpdate.userConsent = {
			form: 'digital',
			privacyConsent: data.privacyConsent,
			termsOfUseConsent: data.termsOfUseConsent,
		};
	}

	if (data.termsOfUseConsentVersion || data.privacyConsentVersion) {
		const updateConsentDates = (consent) => {
			if (data.privacyConsentVersion) {
				consent.privacyConsent = true;
				consent.dateOfPrivacyConsent = Date.now();
			}
			if (data.termsOfUseConsentVersion) {
				consent.termsOfUseConsent = true;
				consent.dateOfTermsOfUseConsent = Date.now();
			}
			return consent;
		};

		updateConsentUsingVersions = app
			.service('consents')
			.find({ query: { userId: user._id } })
			.then((consents) => {
				if (consents.total !== 1) {
					throw new Error('user consent not found!');
				}
				const consent = consents.data[0];
				// update userConsent if exist otherwise the parentConsent should be updated
				let updatedConsent = {
					form: 'update',
				};
				const updateConsentType = consent.userConsent ? 'userConsent' : 'parentConsents';
				if (updateConsentType === 'userConsent') {
					updatedConsent = { ...updatedConsent, ...consent[updateConsentType] };
					updatedConsent = updateConsentDates(updatedConsent);
					return app.service('usersModel').patch(user._id, {
						$set: {
							'consent.userConsent': updatedConsent,
						},
					});
				}
				if (updateConsentType === 'parentConsents' && (!consent.parentConsents || !consent.parentConsents.length)) {
					throw new Error('no parent or user consent found');
				}
				updatedConsent = { ...updatedConsent, ...consent.parentConsents[0] };
				updatedConsent = updateConsentDates(updatedConsent);
				return app.service('usersModel').patch(user._id, {
					$set: {
						'consent.parentConsents': [updatedConsent],
					},
				});
			});
	}

	if (data.parent_privacyConsent || data.parent_termsOfUseConsent) {
		consentUpdate.userId = user._id;
		consentUpdate.parentConsents = [
			{
				form: 'digital',
				privacyConsent: data.parent_privacyConsent,
				termsOfUseConsent: data.parent_termsOfUseConsent,
			},
		];
	}
	if (consentUpdate.userId) consentPromise = app.service('consents').create(consentUpdate);

	return Promise.all([accountPromise, userPromise, consentPromise, updateConsentUsingVersions])
		.then((result) => Promise.resolve(result))
		.catch((err) => Promise.reject(err));
};

module.exports = function setup(app) {
	class firstLoginService {
		create(data, params) {
			return firstLogin(data, params, app);
		}
	}

	return firstLoginService;
};
