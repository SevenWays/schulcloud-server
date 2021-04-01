const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { Configuration } = require('@hpi-schul-cloud/commons');
const request = require('request-promise-native');
const hmacSHA512 = require('crypto-js/hmac-sha512');
const { buildMatrixUserId, buildMatrixServerUri, expandContentIds } = require('../utils');

const { BadRequest, GeneralError } = require('../../../errors');

function obtainAccessToken(userId, deviceId, homeserverApiUri, secret) {
	const loginApiUrl = `${homeserverApiUri}/_matrix/client/r0/login`;

	const password = hmacSHA512(userId, secret).toString();

	const payload = {
		type: 'm.login.password',
		initial_device_display_name: 'hpi-schul-cloud (embed)',
		user: userId,
		device_id: deviceId,
		password,
	};

	const options = {
		uri: loginApiUrl,
		method: 'POST',
		body: payload,
		json: true,
	};
	return request(options).then((response) => {
		const homeserverUrl =
			response.well_known && response.well_known['m.homeserver'] && response.well_known['m.homeserver'].base_url
				? response.well_known['m.homeserver'].base_url
				: homeserverApiUri;

		const session = {
			userId,
			homeserverUrl,
			accessToken: response.access_token,
			deviceId: response.device_id,
			servername: response.home_server,
		};
		return session;
	});
}

class MessengerTokenService {
	constructor(options) {
		this.options = options || {};
	}

	async setup(app) {
		this.app = app;
	}

	/**
	 * syncs the rooms of all users on the school.
	 * @param {Object} data should contain a schoolId field
	 * @param {Object} params feathers params object.
	 */
	async create(data, params) {
		if (!Configuration.get('FEATURE_MATRIX_MESSENGER_ENABLED')) {
			throw new GeneralError('messenger not supported on this instance');
		}

		const scId = (params.account || {}).userId;
		if (!scId) throw new BadRequest('no user');

		// find mxId by users school
		const models = await expandContentIds({
			userId: scId
		});
		const mxId = models.mxId;
		const matrixId = buildMatrixUserId(mxId, scId.toString())

		const deviceId = `sc_${scId.toString()}`;
		const matrixUri = buildMatrixServerUri(mxId);
		const matrixSecret = Configuration.get('MATRIX_MESSENGER__SECRET');

		return obtainAccessToken(matrixId, deviceId, matrixUri, matrixSecret);
	}
}

const messengerTokenService = new MessengerTokenService({});

const messengerTokenHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [disallow()],
		get: [disallow()],
		create: [],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
	after: {},
};

module.exports = { messengerTokenService, messengerTokenHooks };
