/**
 * This file defines the default database settings used on local development environments.
 */

// var uri = 'mongodb://localhost/sel';

var config = {
    uri: 'mongodb://localhost/sel',
    // true to build quadtree index at startup
    // NOTE: this index building process can take a long time.
    buildQuadtreeIndex: false,
    // mongoose connect options
    options: {
        // on prod, autoIndex should be false
        // TODO: make sure this is having the desired effect
        autoIndex: true
    }
};

module.exports = config;
