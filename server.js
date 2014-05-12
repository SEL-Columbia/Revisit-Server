var restify = require('restify'),
    routes = require('./routes'),
    server = restify.createServer({
        name: 'Facilitator',
        version: '0.1.1'
    });

server
    .use(restify.CORS())
    .use(restify.fullResponse())
    .use(restify.bodyParser());

server.get('/facilities', routes.facilities);

server.get('/facilities/:uuid', routes.facility);

server.listen(3000, function() {
    console.log('%s listening at %s', server.name, server.url);
});

/**

curl -X POST -H "Content-Type: application/json" -d '{"name":"Facility 1","type":"Health"}' http://localhost:3000/api/v1/Facilities

*/
