var restify = require('restify'),
    routes = require('./routes'),
    mongoose = require('mongoose'),
    server = restify.createServer({
        name: 'Revisit',
        version: '0.1.1'
    }),
    prePath = '/api/v1';

mongoose.connect('mongodb://localhost/sel');

server
    .use(restify.CORS())
    .use(restify.fullResponse())
    .use(restify.bodyParser())
    .use(restify.queryParser());

// get a list of all sites
server.get(prePath+'/sites', routes.sites);

// get a list of all sites within radius (rad) of lat, lng
server.get(prePath+'/sites/near/:lat/:lng/:rad', routes.near);

// get a list of all sites within box
server.get(prePath+'/sites/within/:swlat/:swlng/:nelat/:nelng/', routes.within);

server.get(prePath+'/sites/within/:swlat/:swlng/:nelat/:nelng/:sector', routes.within);

// get a single site by id
server.get(prePath+'/sites/:id', routes.site);

// add a new site
server.post(prePath+'/sites', routes.newSite);

// update a sites
server.put(prePath+'/sites/:id', routes.updateSite);

// delete a sites
server.del(prePath+'/sites/:id', routes.deleteSite);

// flag a sites
server.put(prePath+'/sites/flag/:id', routes.flagSite);

// add a new site photo
server.post(prePath+'/sites/:id/photos', routes.uploadPhoto);

// serve static images
server.get(/\/sites\/photos\/?.*/, restify.serveStatic({
  directory: './public'
}));

// Start the server.
server.listen(3000, function() {
    console.log('%s listening at %s', server.name, server.url);
});
