// dependancies 
var restify = require('restify');
var mongoose = require('mongoose');

// local includes
var routes = require('./views/routes.js');

// db SHOULD BE MOVED 
var db_name = 'test';
var db_cols = ['testData'];
mongoose.connect('mongodb://localhost/' + db_name);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection err:')); 
db.once('open', function callback() {
    console.log('Connected To Mongo Database');
    });

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

