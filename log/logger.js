var bunyan = require('bunyan');

// myapp
var app_name = "Facility Registry api";

// logger 
var log = bunyan.createLogger({
    name: app_name,
    streams: [
        {
            level: 'info',
            type: 'rotating-file',
            path: './log/'+app_name+'.log',
            period: '1d',   // daily rotation
            count: 7        // keep 7 back copies
        },
        {
            level: 'error',
            path: './'+app_name+'_err.log'  // log ERROR and above to a file
        },
        {
            level: 'debug',
            stream: process.stdout
        }
    ]
});

exports.log = log

