/**
 * This file defines the default database settings used on local development environments.
 */

// var uri = 'mongodb://localhost/sel';

var config = {
	uri: 'mongodb://localhost/test',
	options: {
		user: 'test',
		pass: 'test'
	}
};

module.exports = config;