#!/usr/bin/env node

/**

This script builds the facility quadtree index.

*/

// connect the db
require('../core/db').connect();

var log = require('../core/logger').log,
    SiteModel = require('../domain/model/site');

var ts = Date.now();

SiteModel.initTree()
    .then(
        function() {
            log.info('Building quadtree index completed in ' + (Date.now() - ts) + 'ms');
            process.exit(0);
        },
        function() {
            log.error('Error building quadtree index');
            process.exit(1);
        });
