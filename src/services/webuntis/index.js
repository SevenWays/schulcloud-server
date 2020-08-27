const { webuntisMetadataService, webuntisMetadataServiceHooks } = require('./services/webuntisMetadata');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

/* In addition to setting up the service code, the service has to be included in src/index.js. */

module.exports = (app) => {
	app.use('/webuntisMetadata', webuntisMetadataService);
	app.service('/webuntisMetadata').hooks(webuntisMetadataServiceHooks);

	app.use('/webuntisMetadata/api', staticContent(path.join(__dirname, '/docs')));
};
