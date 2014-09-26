// myapp
exports.app_name = "Facility Registry api";
exports.version = '0.0.1';
exports.USE_AUTH = false;
exports.prePath = '/api/v0';
exports.host = "localhost";
exports.port = '3000';
exports.site = "http://" + exports.host 
             + ":"       + exports.port
             +           exports.prePath
             + "/"       + "facilities/";

exports.photoPath = "http://" + exports.host
                  + "/sites/photos/";
//var conf = require('./config/config.js');
