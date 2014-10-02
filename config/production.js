console.log('LOADING PRODUCTION CONFIG');

var config = {};

config.prePath = '/api/v0';
config.host = 'revisit.global';
config.port = '';
config.site = "http://" + def_config.host;
config.site += config.port ? ":" + def_config.port : '';
config.site += def_config.prePath + "/" + "facilities/";

def_config.USE_AUTH = false;

config.log_root = '/var/log/' + exports.app_name + '/';

module.exports = config;