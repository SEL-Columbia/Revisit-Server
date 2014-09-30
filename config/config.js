// myapp
exports.app_name = "revisit-server";
exports.version = '0.1.0';
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

exports.NODE_ENV = process.env.NODE_ENV;

// If this is staging or production, log to /var/log/
exports.log_root = process.env.NODE_ENV === "staging" || process.env.NODE_ENV === "production" ? '/var/log/' + exports.app_name + '/': __dirname + '/log/';

console.log("log root: " + exports.log_root);