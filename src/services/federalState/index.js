const service = require('feathers-mongoose');
const federalState = require('./model');
const hooks = require('./hooks');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

module.exports = function () {
	const app = this;

	const options = {
		Model: federalState,
		paginate: {
			default: 20,
			max: 25,
		},
		lean: true,
	};

	app.use('/federalStates', service(options));
	const federalStateService = app.service('/federalStates');
	federalStateService.hooks(hooks);

	app.use('/federalStates/api', staticContent(path.join(__dirname, '/docs')));
};
