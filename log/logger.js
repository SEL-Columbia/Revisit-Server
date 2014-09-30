// local includes
var bunyan = require('bunyan');

var app_name = "Facility_Registry_api",
    root_path = "/var/log";

// logger 
var init = function() {
    var log = bunyan.createLogger({
        name: app_name,
        streams: [
            {
                level: 'info',
                stream: null,
                type: 'rotating-file',
                path: root_path + '/log/'+app_name+'.log',
                period: '1d',   // daily rotation
                count: 7        // keep 7 back copies
            },
            {
                level: 'error',
                path: root_path + '/log/'+app_name+'_err.log'  // log ERROR and above to a file
            },
            {
                level: 'debug',
                stream: process.stdout
            }
        ]
    });

    return log;
}

// note node.js caches required files. Init will be called once.
exports.log = init();
