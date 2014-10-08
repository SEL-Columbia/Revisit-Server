// dependancies 
var mongoose = require('mongoose');

// local deps
var SiteModel = require('./site.js').SiteModel;
var UserModel = require('./user.js').UserModel;
var log = require('./../log/logger.js').log;
var conf = require('./../config/db/db_config');

// db 
var connect = function(db_loc) {
    // var db_location = db_loc || 'localhost/sel';
    // log.info(conf);
    mongoose.connect('mongodb://revisit:password@localhost:27017/sel');
// mongoose.connect('mongodb://localhost/sel', {
//         user: 'revisit',
//         pass: 'password',
//         auth: {
//         	authdb: 'sel'
//         }
//     });

    var db = mongoose.connection;
    // var db = mongoose.createConnection('mongodb://test:test@localhost/sel');
    db.on('error', console.error.bind(console, 'connection err:'));
    db.once('open', function() {
        log.info('Connected To Mongo Database at ' + conf.uri);
    });

    db.user = UserModel;

    return db;
};

exports.SiteModel = SiteModel;
exports.UserModel = UserModel;
exports.connect = connect;
