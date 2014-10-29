// dependancies 
var restify = require('restify');

// local includes
var routes = require('./views/routes.js');
var extras = require('./views/extras.js');
var users = require('./views/users.js');
var replies = require('./views/responses.js');
var dbcontroller = require('./models/dbcontroller.js');
var db = dbcontroller.connect();
var conf = require('./config/app/config.js');
var log = require('./log/logger.js').log;
var authenticate = require('./controller/authentication.js').authenticate;

// server
var server = restify.createServer({
    name: conf.app_name,
    log: log,
    //https support (should use proper ssl cert)
    //key: fs.readFileSync('/etc/ssl/self-signed/server.key'),
    //certificate: fs.readFileSync('/etc/ssl/self-signed/server.crt'),
    version: conf.version
});

// server modules
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

server.on('after', restify.auditLogger({
    log: log
}));

// Overwrite default error msgs for internal errors and missing endpoints
server.on('uncaughtException', function (req, res, route, err) {
    replies.internalErrorReply(res, err);
});

server.on('NotFound', function (req, res, cb) {
    replies.nothingFoundReply(res, req.url + " was not found.");
});

server.listen(conf.port, function() {
    log.info('%s listening at %s', server.name, server.url);
    log.debug('%s listening at %s', server.name, server.url);

    if (process.getgid() === 0) {
        // process.setgid('nobody');
        process.setuid('nobody');
    }
});

// Gotta create an regexp object when working with string variables
var id_path = new RegExp(conf.prePath + "/facilities/(\\w{24})\.json$");
var user_path = new RegExp(conf.prePath + "/users/(\\w+)\.json$");

// main
server.get(conf.prePath + "/facilities.json", routes.sites); // all sites
server.post(conf.prePath + "/facilities.json", routes.add); // new site
server.post(conf.prePath + "/facilities/bulk.json", routes.bulk); // new site
server.post(conf.prePath + "/facilities/bulk", routes.bulkFile); // new site
server.get(id_path, routes.site); // site by id
server.del(id_path, routes.del); // delete by id
server.put(id_path, routes.update); // update site by id

// photos
server.post(conf.prePath + '/facilities/:id/photos', extras.uploadPhoto);
server.get(/\/sites\/photos\/?.*/, restify.serveStatic({
    directory: './public'
}));

// extras
server.get(new RegExp(conf.prePath +
    "/facilities/near/(\\w{24})\.json\$"), extras.nearID); // near site by id with units
server.get(conf.prePath + '/facilities/near.json', extras.near); // search near coord
server.get(conf.prePath + '/facilities/within.json', extras.within); // search within box and/or sector

// users
server.get(conf.prePath + '/users.json', users.getUsers); // dumps user collection 
server.post(conf.prePath + '/users.json', users.addUser); // post name, pass, [role] 
server.get(user_path, users.getUser); // dumps user 
//server.put(conf.prePath + '/users/:username', users.updateAndVerify); // logs in then updates user 
server.put(user_path, users.updatePass); // logs in then updates user 
server.del(user_path, users.removeUser); // logs in then updates user 

server.post(conf.prePath + '/users/login/', users.login); // just for testing, done during basic auth

exports.server = server;
exports.db = db;

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
