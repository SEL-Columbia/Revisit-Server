// dependancies
var restify = require('restify')

// local includes
var database = require('../models/dbcontroller.js')
var replies = requires('./responses.js');

var near = function(req, res, next) {
    console.log("\nParams >>>", req.query, req.params);

    var lat = req.params['lat'],
    var lng = req.params['lng'],
    var rad = req.params['rad'] || 10,
    var units = req.query['units'] || 'mi',
    var earthRad = 3959; // miles
    if (units === 'km') {
        earthRad = 6371;
    }

    SiteModel.findNear(lng, lat, rad, earthRad, function(err, sites) {
        if (err) {
            replies.mongoErrorReply(res, err);
        } else {
            replies.jsonReply(res, sites)
        }
        return next(); 

    });       
}

// exports
exports.near = near
