const service = require('feathers-mongoose');
const system = require('./model');
const hooks = require('./hooks');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

module.exports = function () {
	const app = this;

	const options = {
		Model: system,
		paginate: {
			default: 5,
			max: 25,
		},
		lean: true,
	};

	app.use('/systems', service(options));
	const systemService = app.service('/systems');
	systemService.hooks(hooks);

	app.use('/systems/api', staticContent(path.join(__dirname, '/docs')));
};
