var _ = require('lodash-node'),

	// an environment variable specifying the environment
	env = process.env.NODE_ENV,
	
	// if we have an environment specified, pull in its config
	env_config = env ? require('./'+env) : {},

	// the default config, populated below
	def_config = {};

// set defaults -- these will be overriden by duplicate settings in env_config
def_config.app_name = "revisit-server";
def_config.version = '0.1.0';
def_config.USE_AUTH = false;
def_config.prePath = '/api/v0';
def_config.host = "localhost";
def_config.port = '3000';

def_config.site = "http://" + def_config.host;
def_config.site += def_config.port ? ":" + def_config.port : '';
def_config.site += def_config.prePath + "/" + "facilities/";

def_config.photoPath = "http://" + def_config.host + "/sites/photos/";

def_config.log_root = __dirname + '/../log/';

// add defaults to env_config
_.defaults(env_config, def_config);

// export combined configuration for this environment
module.exports = env_config;