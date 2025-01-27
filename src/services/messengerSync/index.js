const { Configuration } = require('@hpi-schul-cloud/commons');

const eventListener = require('./eventListener');
const producer = require('./producer');
const consumer = require('./consumer');
const { messengerSchoolSyncService, messengerSchoolSyncHooks } = require('./services/schoolSyncService');
const { messengerTokenService, messengerTokenHooks } = require('./services/messengerTokenService');

module.exports = (app) => {
	if (Configuration.get('FEATURE_MATRIX_MESSENGER_ENABLED')) {
		app.use('schools/:schoolId/messengerSync', messengerSchoolSyncService);
		app.service('schools/:schoolId/messengerSync').hooks(messengerSchoolSyncHooks);

		app.use('messengerToken', messengerTokenService);
		app.service('messengerToken').hooks(messengerTokenHooks);

		app.configure(eventListener);
		app.configure(producer.setup);
		app.configure(consumer);
	}
};
