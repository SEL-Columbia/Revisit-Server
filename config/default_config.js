var _ = require('lodash-node'),

	// the default config, populated below
	config = {};

// set defaults -- these will be overriden by duplicate settings in env_config
config.app_name = "revisit-server";
config.version = '0.1.0';
config.USE_AUTH = false;
config.prePath = '/api/v0';
config.host = "localhost";
config.port = '3000';

config.site = "http://" + config.host;
config.site += config.port ? ":" + config.port : '';
config.site += config.prePath + "/" + "facilities/";

config.photoPath = "http://" + config.host + "/sites/photos/";

config.log_root = __dirname + '/../log/';

// export combined configuration for this environment
module.exports = config;