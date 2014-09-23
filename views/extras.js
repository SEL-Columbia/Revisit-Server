// dependancies
var restify = require('restify')
var fs = require('fs')
var mkdirp = require('mkdirp')

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
            return replies.mongoErrorReply(res, err)
        }

        if (sites != null && sites.length > 0) {
            sites.forEach(function(site) {
                replies.editUUID(site)
            });
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
            return replies.mongoErrorReply(res, err)
        }

        if (sites != null && sites.length > 0) {
            sites.forEach(function(site) {
                replies.editUUID(site)
            });
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
            return replies.mongoErrorReply(res, err)
        }

        if (sites != null && sites.length > 0) {
            sites.forEach(function(site) {
                replies.editUUID(site)
            });
            replies.jsonReply(res, sites)
        } else {
            replies.mongoEmptyReturn(res)
        }

        console.log(">>> Complete!");
        return next(); 
    });
};

//TODO: Refactor, does too much work 
exports.uploadPhoto = function (req, res, next) {
    var siteId = req.params.id || null;

    //console.log(req.files.photo);
    
    // if no sideId is included in request, error
    if (!siteId) {
        return next(new restify.MissingParameterError("The required siteId parameter is missing."));
    }

    // make sure the id is associated with a known Site
    database.SiteModel.findById(siteId, function (err, site) { 
        if (err) return next(new restify.ResourceNotFoundError(JSON.stringify(err)));

        // returns as an array
        site = site[0]

        // move the uploaded photo from the temp location (path property) to its final location
        fs.readFile(req.files.photo.path, function (err, data) {
    		if (err) {
    			console.log(err);
    		}

            // excuse the dir hack
            var rootPath = __dirname + "/../public/sites/photos",
                siteDir = siteId,
                filePath = req.files.photo.name,
                fullPath = rootPath + '/' + siteDir + '/' + filePath;

            // create the dir for the site
            mkdirp(rootPath + '/' + siteDir, function (err) {
                if (err) {
                    console.error(err);
                    return next(new restify.InternalError(JSON.stringify(err)));
                } else {
                    fs.writeFile(fullPath, data, function (err) {
                        console.log('writeFile callback');
            			if (err) {
            				console.log('write error: ' + err);
            				return next(new restify.InternalError(JSON.stringify(err)));
            			}

                        var url = 'http://' + req.header('Host') + '/sites/photos/' + siteDir + '/' +  filePath;

                        var index = -1; // cannot assume properties is defined
                        if (!site.properties) { 
                            site.properties = {}
                            site.properties.photoUrls = []
                        } else {
                            // check that this photo is new. we'll replace the tmp path with the url
                            // TODO: Ask Jon about this tmp thing, not sure how this can happen??
                            index = site.properties.photoUrls.indexOf('tmp/'+req.files.photo.name);

                        }

                        console.log(">>> photo ind:", index, site.properties.photoUrls.indexOf(url));
                        if (index != -1) { 
                            site.properties.photoUrls.splice(index, 1, url);
                        } else if (site.properties.photoUrls.indexOf(url) == -1) {
                            // must be new url
                            site.properties.photoUrls.push(url)
                        }

                        console.log('site photo url: ' + url);
			
                        site.save(function (err, updatedSite, numberAffected) {
                            if (err) {
                				console.log('save error: ' + err);
                				return next(new restify.InternalError(JSON.stringify(err)));
            				}
                            console.log('site saved, sending response');
				            // no error, send success
                            res.send(updatedSite);
                        });
                    });
                }
            });
        });
    });
}

// exports
exports.within = within
exports.withinSector = withinSector
exports.near = near
