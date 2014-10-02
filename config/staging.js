console.log('LOADING STAGING CONFIG');

var _ = require('lodash-node'),
	def_config = require('./default_config');

var config = {};

config.prePath = '/api/v0';
config.host = 'staging.revisit.global';
config.port = '';
config.site = "http://" + config.host;
config.site += config.port ? ":" + config.port : '';
config.site += config.prePath + "/" + "facilities/";

config.USE_AUTH = false;

config.log_root = '/var/log/' + def_config.app_name + '/';

// add default config to this env config
_.defaults(config, def_config);

module.exports = config;