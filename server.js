var restify = require('restify'),
    routes = require('./routes'),
    mongoose = require('mongoose'),
    server = restify.createServer({
        name: 'Facilitator',
        version: '0.1.1'
    }),
    prePath = '/api/v1';

mongoose.connect('mongodb://localhost/sel');

server
    .use(restify.CORS())
    .use(restify.fullResponse())
    .use(restify.bodyParser())
    .use(restify.queryParser());

// get a list of all facilities
server.get(prePath+'/facilities', routes.facilities);

// get a list of all facilities within radius (rad) of lat, lng
server.get(prePath+'/facilities/near/:lat/:lng/:rad', routes.near);

// get a list of all facilities within box
server.get(prePath+'/facilities/within/:swlat/:swlng/:nelat/:nelng/', routes.within);

server.get(prePath+'/facilities/within/:swlat/:swlng/:nelat/:nelng/:sector', routes.within);

// get a single facility by id
server.get(prePath+'/facilities/:id', routes.facility);

// add a new facility
server.post(prePath+'/facilities', routes.newFacility);

// update a facility
server.put(prePath+'/facilities/:id', routes.updateFacility);

// delete a facility
server.del(prePath+'/facilities/:id', routes.deleteFacility);

// flag a facility
server.put(prePath+'/facilities/flag/:id', routes.flagFacility);


// Start the server.
server.listen(3000, function() {
    console.log('%s listening at %s', server.name, server.url);
});