console.log('LOADING STAGING CONFIG');

var config = {};

config.prePath = '/api/v0';
config.host = 'staging.revisit.global';
config.port = '';
config.site = "http://" + config.host;
config.site += config.port ? ":" + config.port : '';
config.site += config.prePath + "/" + "facilities/";

config.USE_AUTH = false;

config.log_root = '/var/log/' + exports.app_name + '/';

module.exports = config;