// dependencies
var restify = require('restify');

// local includes
var routes = require('./controller/routes.js'),
    responses = require('./view/responses.js'),
    db = require('./core/db.js').connect(),
    conf = require('./config/app/config.js'),
    log = require('./core/logger.js').log,
    authenticate = require('./core/authentication.js').authenticate,
    unknownMethodHandler = require('./core/cors.js');

// Instantiate server
var server = restify.createServer({
    name: conf.app_name,
    log: log,
    //https support (should use proper ssl cert)
    //key: fs.readFileSync('/etc/ssl/self-signed/server.key'),
    //certificate: fs.readFileSync('/etc/ssl/self-signed/server.crt'),
    version: conf.version
});



/**
 * SERVER MIDDLEWARE
 */
server.pre(restify.CORS({
    origins: ['*'],
    headers: ['x-request-within']
})); // CORS support when requested only.
server.pre(restify.pre.sanitizePath());
server.pre(restify.pre.userAgentConnection());

//server.use(restify.fullResponse()); // Sets default headers
server.use(restify.acceptParser(server.acceptable)); // ???
server.use(restify.queryParser()); // query params pushed to query field (busted goes to params)
server.use(restify.bodyParser()); // body pushed into params field
server.use(restify.authorizationParser()); // basic auth
server.use(restify.gzipResponse()); // compressed response
server.use(restify.throttle({
    burst: 100,
    rate: 50,
    // ip: true,
    // we're using nginx as reverse proxy
    xff: true,
    //username: true, // can throttle on basic auth username
    overrides: {
        '127.0.0.1': {
            rate: 0, // unlimited
            burst: 0
        },
        // SEL IP
        '128.59.46.168': {
            rate: 0, // unlimited
            burst: 0
        }
    }
}));

// adds child logger to each request in order to track requests
server.use(restify.requestLogger({
    // properties: {}
}));

// auth code in controller, configurable in conf/app/*
server.use(authenticate);

/**
 * SERVER EVENTS
 */
server.on('after', restify.auditLogger({
    log: log
}));

// Overwrite default error msgs for internal errors and missing endpoints
server.on('uncaughtException', function (req, res, route, err) {
    responses.internalErrorReply(res, err);
});

server.on('NotFound', function (req, res, next) {
    responses.nothingFoundReply(res, req.url + " was not found.");
});

// Uses unknownMethodHandler (cors module)
server.on('MethodNotAllowed', unknownMethodHandler);

server.listen(conf.port, function() {
    log.info('%s listening at %s', server.name, server.url);
    log.debug('%s listening at %s', server.name, server.url);

    if (process.getgid() === 0) {
        // process.setgid('nobody');
        process.setuid('nobody');
    }
});


/**
 * SETUP ROUTES
 */

// Gotta create an regexp object when working with string variables
var id_path = new RegExp(conf.prePath + "/facilities/(\\w{24})\.json$");
var user_path = new RegExp(conf.prePath + "/users/(\\w+)\.json$");

// main
server.get(conf.prePath + "/facilities.json", routes.sites.sites); // all sites
server.post(conf.prePath + "/facilities.json", routes.sites.add); // new site

server.get(id_path, routes.sites.site); // site by id
server.del(id_path, routes.sites.del); // delete by id
server.put(id_path, routes.sites.update); // update site by id

// stats
server.get(conf.prePath + '/facilities/stats.json', routes.stats.stats); // search within box and/or sector

// photos
server.post(conf.prePath + '/facilities/:id/photos', routes.sites.uploadPhoto);
server.get(/\/sites\/photos\/?.*/, restify.serveStatic({
    directory: './public'
}));

// users
server.get(conf.prePath + '/users.json', routes.users.getUsers); // dumps user collection
server.post(conf.prePath + '/users.json', routes.users.addUser); // post name, pass, [role]
server.get(user_path, routes.users.getUser); // dumps user
//server.put(conf.prePath + '/users/:username', users.updateAndVerify); // logs in then updates user
server.put(user_path, routes.users.updatePass); // logs in then updates user
server.del(user_path, routes.users.removeUser); // logs in then updates user

server.post(conf.prePath + '/users/login/', routes.users.login); // just for testing, done during basic auth

exports.server = server;


/**
 * CLUSTERING HELPERS
 */

/**
 * Listen for SIGTERM signal, close the server if it's running.
 * @return {[type]} [description]
 */
process.on('SIGTERM', function() {
    if (server === undefined) return;
    server.close(function() {
        // Disconnect from cluster master
        process.disconnect && process.disconnect();
    });
});
