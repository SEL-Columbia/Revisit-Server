/**
 * This file defines the default database settings used on local development environments.
 */

// var uri = 'mongodb://localhost/sel';

var config = {
	uri: 'mongodb://localhost/sel',
	options: {
		user: 'revisit',
		pass: 'password'
	}
};

module.exports = config;