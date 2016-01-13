// dependancies
var mongoose = require('mongoose');

// local deps
var log = require('./logger.js').log,
    conf = require('./../config/db/db_config'),
    SiteModel = require('../domain/model/site');

// db
var connect = function() {
    console.log('db.connect');
    mongoose.connect(conf.uri, conf.options);

    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection err:'));
    db.once('open', function() {
        log.info('Connected To Mongo Database at ' + conf.uri);
    });

    return db;
};


// build the quadtree index
// XXX - This shouldn't be run automatically whenever the app starts up, since the index should be built as
// an independent process via bin/build-quadtree-index.js script. In order to force rebuilding the index,
// specify so in the db config.
if (conf.buildQuadtreeIndex) {
    log.info('-- BUILDING QUADTREE INDEX -- ');
    var ts = Date.now();
    SiteModel.initTree()
        .then(
            function() {
                log.info('Quadtree index built in ' + (Date.now() - ts) + 'ms');
            },
            function() {
                log.error('Error building quadtree index');
            });
}

exports.connect = connect;
