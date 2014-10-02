var _ = require('lodash-node'),

	// an environment variable specifying the environment
	env = process.env.NODE_ENV,
	
	// if we have an environment specified, pull in its config
	env_config = env ? require('./'+env) : require('./default_config');

// export combined configuration for this environment
module.exports = env_config;