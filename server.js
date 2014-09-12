// dependancies 
var restify = require('restify');

// local includes
var routes = require('./views/routes.js');

// server
var server = restify.createServer();

server.use(restify.fullResponse())
server.use(restify.bodyParser());

server.pre(restify.pre.userAgentConnection());

server.listen(8080, function() {
      console.log('%s listening at %s', server.name, server.url);
});

// paths
server.get('/hello/:name', routes.respond);


server.get("/names", routes.names);

