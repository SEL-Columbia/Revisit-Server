// dependancies
var restify = require('restify')

// local includes
var database = require('../models/dbcontroller.js')
var replies = require('./responses.js');

var near = function(req, res, next) {
    console.log("\nParams >>>", req.query, req.params);

    var lat = req.params['lat'];
    var lng = req.params['lng'];
    var rad = req.params['rad'] || 10;
    var units = req.query['units'] || 'mi';
    var earthRad = 3959; // miles
    if (units === 'km') {
        earthRad = 6371;
    }

    database.SiteModel.findNear(lng, lat, rad, earthRad, function(err, sites) {
        if (err) {
            return mongoErrorReply(res, err)
        }

        if (sites != null && sites.length > 0) {
            replies.jsonReply(res, sites)
        } else {
            replies.mongoEmptyReturn(res)
        }

        console.log(">>> Complete!");
        return next(); 

    });       
}

var within = function(req, res, next) {

    console.log("\nWithin >>>", req.params);
    var swlat = req.params['swlat']
    var swlng = req.params['swlng']
    var nelat = req.params['nelat']
    var nelng = req.params['nelng']

    database.SiteModel.findWithin(swlat, swlng, nelat, nelng, function(err, sites) {
        if (err) {
            return mongoErrorReply(res, err)
        }

        if (sites != null && sites.length > 0) {
            replies.jsonReply(res, sites)
        } else {
            replies.mongoEmptyReturn(res)
        }

        console.log(">>> Complete!");
        return next(); 
    });
};

var withinSector = function(req, res, next) {

    console.log("\nWithin Sector >>>", req.params);
    var swlat = req.params['swlat']
    var swlng = req.params['swlng']
    var nelat = req.params['nelat']
    var nelng = req.params['nelng']
    var sector = req.query['sector']

    database.SiteModel.findWithinSector(swlat, swlng, nelat, nelng, sector, function(err, sites) {
        if (err) {
            return mongoErrorReply(res, err)
        }

        if (sites != null && sites.length > 0) {
            replies.jsonReply(res, sites)
        } else {
            replies.mongoEmptyReturn(res)
        }

        console.log(">>> Complete!");
        return next(); 
    });
};

// exports
exports.within = within
exports.withinSector = withinSector
exports.near = near
