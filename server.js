// start the server as a daemon
// eveything above this will be exectued twice
require('daemon')();

// dependancies 
var restify = require('restify');


// local includes
var routes = require('./views/routes.js');
var extras = require('./views/extras.js');
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
//server.pre(restify.pre.sanitizePath());
server.pre(restify.pre.userAgentConnection());

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
                }

                //'admin' : { Cant have both ip and user set for throttling 
                //    rate: 0,
                //    burst: 0
                //}
            }
}));

// server.use(function authenticate(req, res, next) {
//     console.log("\nAttempting Login ...")
//     db.lookup(req.username, function (err, password) {
//         if (err) {
//             console.log(">>> Failed to find user.");
//             return next(new restify.NotFoundError('user not found'));
//         }

//         // temp dont intend to keep passwords as plain string
//         if (password !== req.authorization.basic.password) {
//             console.log(">>> Failed to auth user pass.");
//             return next(new restify.NotAuthorizedError());
//         }
      
//         console.log(">>> User success!");
//         return next();

//      });
// });


server.listen(3000, function() {
      console.log('%s listening at %s', server.name, server.url);
});

// paths
var prePath = '/api/v0';
server.get('/hello/:name/', routes.respond);

// actually useful paths
server.get(prePath + "/facilities.json", routes.sites);
server.get(/\/api\/v0\/facilities\/(\d+)\.json/, routes.site);
server.get(prePath+'/facilities/near/:lat/:lng/:rad', extras.near);

server.get(prePath+'/facilities/within/:swlat/:swlng/:nelat/:nelng/', extras.within);
server.get(prePath+'/facilities/within/:swlat/:swlng/:nelat/:nelng/:sector', extras.withinSector);
