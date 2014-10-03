// dependancies 
var restify = require('restify');

//var fs = require('fs');

// local includes
var routes = require('./views/routes.js');
var extras = require('./views/extras.js');
var auth = require('./views/auth.js');
var replies = require('./views/responses.js');
var db = require('./models/dbcontroller.js').connect();
var conf = require('./config/config.js');
var log = require('./log/logger.js').log;

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
server.pre(restify.pre.sanitizePath());
server.pre(restify.pre.userAgentConnection());

server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser()); // basic auth
server.use(restify.queryParser());         // gets
server.use(restify.bodyParser());          // sets up body field
server.use(restify.gzipResponse());        // compressed response
server.use(restify.throttle({
            burst: 100,
            rate: 50,
            ip: true,
            //username: true, // can throttle on basic auth username
            overrides: {
                '192.168.1.1': {
                    rate: 0,        // unlimited
                    burst: 0
                }

                //'admin' : { Cant have both ip and user set for throttling 
                //    rate: 0,
                //    burst: 0
                //}
            }
}));

// adds child logger to each request in order to track requests
server.use(restify.requestLogger({
    // properties: {}
}));

// From db
if (conf.USE_AUTH) {
    server.use(function authenticate(req, res, next) {
        log.info("Basic auth verification", {"user": res.username, "auth": req.authorization});
        if (req.username === 'anonymous' || typeof req.authorization.basic === 'undefined') {
            log.info("Basic auth failed");
            return replies.apiUnauthorized(res,"No basic auth information provided");
        }
    
        db.user.login(req.username, req.authorization.basic.password, function(success) {
            if (!success) {
                log.info("Basic auth failed");
                return replies.apiUnauthorized(res, req.username);
            }
            
            log.debug(">>> User success!");
            log.info("Basic auth passed");
            return next();
        });
    });

}

server.on('after', restify.auditLogger({
  log: log
}));

server.listen(conf.port, function() {
     log.info('%s listening at %s', server.name, server.url);
     log.debug('%s listening at %s', server.name, server.url);
});


// main
server.get(conf.prePath + "/facilities.json", routes.sites); // all sites
server.post(conf.prePath + "/facilities.json", routes.add); // new site
server.get(/\/api\/v0\/facilities\/([0-9a-fA-F]{24})\.json/, routes.site); // site by id
server.del(/\/api\/v0\/facilities\/([0-9a-fA-F]{24})\.json/, routes.del); // delete by id
server.put(/\/api\/v0\/facilities\/([0-9a-fA-F]{24})\.json/, routes.update); // update site by id

// photos
server.post(conf.prePath+'/facilities/:id/photos', extras.uploadPhoto);
server.get(/\/sites\/photos\/?.*/, restify.serveStatic({
  directory: './public'
}));

// extras
server.get(conf.prePath+'/facilities/near/:lat/:lng/:rad', extras.near); // search near coord
server.get(conf.prePath+'/facilities/near/:lat/:lng/:rad/:units', extras.near); // search near coord
server.get(conf.prePath+'/facilities/within/:swlat/:swlng/:nelat/:nelng/', extras.within); // search within box
server.get(conf.prePath+'/facilities/within/:swlat/:swlng/:nelat/:nelng/:sector', extras.withinSector); // search within box and sector

// users
server.post(conf.prePath+'/users/add/', auth.addUser); // just for testing, should be in admin console
server.post(conf.prePath+'/users/login/', auth.login); // just for testing, done during basic auth

// echo
server.get('/hello/:name/', routes.respond);
