// dependancies 
var mongoose = require('mongoose');

// local deps
var log = require('./logger.js').log;
var conf = require('./../config/db/db_config');
var SiteModel = require('../domain/model/site.js');

// db 
var connect = function() {
    mongoose.connect(conf.uri, conf.options);
	
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection err:'));
    db.once('open', function() {
        log.info('Connected To Mongo Database at ' + conf.uri);
    });

    return db;
};

// init index
SiteModel.initTree()
    .then(function() {
        log.info("Complete quadtree index");
    });

exports.connect = connect;
