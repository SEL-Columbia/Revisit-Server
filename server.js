// dependancies 
var restify = require('restify');
//var fs = require('fs');

// local includes
var routes = require('./views/routes.js');
var db = require('./models/dbcontroller.js').db;

// server
var server = restify.createServer({
    name: 'Facility Registry api',
    //https support (should use proper ssl cert)
    //key: fs.readFileSync('/etc/ssl/self-signed/server.key'),
    //certificate: fs.readFileSync('/etc/ssl/self-signed/server.crt'),
    version: '0.0.1'
});

// server modules
server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser()); // basic auth
server.use(restify.queryParser());         // gets
server.use(restify.gzipResponse());        // compressed response
server.use(restify.bodyParser());          // ??? magically does content-type stuff 
server.use(restify.throttle({
            burst: 100,
            rate: 50,
            ip: true,
            //username: true, // can throttle on basic auth username
            overrides: {
                '192.168.1.1': {
                    rate: 0,        // unlimited
                    burst: 0
                },

                'admin' : {
                    rate: 0,
                    burst: 0
                }
            }
}));

server.use(function authenticate(req, res, next) {
    db.lookup(req.username, function (err, password) {
        if (err) {
            console.log(">>> Failed to find user.");
            return next(new restify.NotFoundError('user not found'));
        }

        // temp dont intend to keep passwords as plain string
        if (password !== req.authorization.basic.password) {
            console.log(">>> Failed to auth user pass.");
            return next(new restify.NotAuthorizedError());
        }
      
        console.log(">>> User success!");
        return next();

     });
});

server.pre(restify.pre.userAgentConnection());

server.listen(8080, function() {
      console.log('%s listening at %s', server.name, server.url);
});

// paths
var prePath = '/api/v0';
server.get('/hello/:name', routes.respond);
server.get(prePath + "/names", routes.names);

// actually useful paths
server.get(prePath + "/sites", routes.sites);
