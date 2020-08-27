const service = require('feathers-mongoose');
const Pseudonym = require('./model');
const hooks = require('./hooks');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

module.exports = function () {
	const app = this;
	const options = {
		Model: Pseudonym,
		paginate: {
			default: 1000,
			max: 1000,
		},
		lean: false,
	};

	app.use('/pseudonym', service(options));
	app.use('/pseudonym/api', staticContent(path.join(__dirname, '/docs')));

	const pseudonymService = app.service('/pseudonym');
	pseudonymService.hooks(hooks);
};
