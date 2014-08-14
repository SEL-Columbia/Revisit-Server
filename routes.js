var FacilityModel = require('./models/facility').FacilityModel,
    restify = require('restify'),
    fs = require('fs');

exports.facilities = function(req, res, next) {
    var facs = FacilityModel.find(function(err, facs) {
        if (err) console.log(err);
        res.send(facs);
    });
}

exports.facility = function(req, res, next) {
    var id = req.params.id,
        query = {};

    // check if valid ObjectID
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        query._id = id;
    } else {
        query.uuid = id;
    }

    console.log(query);
    FacilityModel.find(query, function(err, facility) {
        console.log(err);
        if (err) return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));

        if (facility) {
            res.send(facility)
        } else {
            res.send(404)
        }
    });
}

exports.near = function(req, res, next) {
    // console.log(req.query); return;
    var lat = req.params['lat'],
        lng = req.params['lng'],
        rad = req.params['rad'] || 10,
        units = req.query['units'] || 'mi',
        earthRad = 3959; // miles

    if (units === 'km') {
        earthRad = 6371;
    }

    FacilityModel.find({
        "coordinates": {
            "$geoWithin": {
                "$centerSphere": [
                    [lng, lat], rad / earthRad
                ]
            }
        }
    }).exec(function(err, facs) {
        if (err) console.log(err);
        res.send(facs);
    });
};

exports.within = function(req, res, next) {
    console.log(req.query.sector);
    var swlat = req.params['swlat'],
        swlng = req.params['swlng'],
        nelat = req.params['nelat'],
        nelng = req.params['nelng'],
        sector = req.query['sector'] || null,
        coordinatesQuery = {
            "coordinates": {
                "$geoWithin": {
                    "$box": [
                        [swlng, swlat],
                        [nelng, nelat]
                    ]
                }
            }
        },
        query = {};

    if (sector) {
        var properties = {
            "properties.sector": sector
        };
        query = {
            "$and": [
                coordinatesQuery,
                properties
            ]
        };
    } else {
        query = coordinatesQuery;
    }

    FacilityModel.find(query).exec(function(err, facs) {
        if (err) console.log(err);
        res.send(facs);
    });
};

exports.newFacility = function (req, res, next) {
    // TODO: validity checks
    // console.log(req.body);
    var fac = new FacilityModel(req.body);
    fac.save(function(err, fac) {
        console.log('save callback...', err, fac);
        if (err) {
            console.log('!!!!!!!!! ERROR !!!!!!!!!!', err);
            return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));
        } else {
            res.send(fac);
            console.log(':):):):):) Success :):):):):)', res);
            next();            
        }
    });
}

exports.updateFacility = function (req, res, next) {
    var fac = req.body,
        id = fac['_id'],
        query = {};

    // At the moment, we require an _id here, not uuid since mongoose expects this for the findByIdAndUpdate method
    fac.updatedAt = Date();

    FacilityModel.findByIdAndUpdate(id, {$set: fac}, function (err, facility) {
      if (err) return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));
      res.send(facility);
    });
}

exports.deleteFacility = function (req, res, next) {
    return next(new restify.RestError({statusCode: 400, restCode: "Not Implemented", message: "Delete method not yet implemented."}));
}

exports.flagFacility = function (req, res, next) {
    return next(new restify.RestError({statusCode: 400, restCode: "Not Implemented", message: "Flag method not yet implemented."}));
}

exports.uploadPhoto = function (req, res, next) {
    // console.log(req);
    
    var siteId = req.param('id') || null,
        site;

    // if no sideId is included in request, error
    if (!siteId) {
        return next(new restify.MissingParameterError("The required siteId parameter is missing."));
    }

    // make sure the id is associated with a known Site
    FacilityModel.findById(siteId, function (err, foundSite) { 
        if (err) return next(new restify.ResourceNotFoundError(JSON.stringify(err)));
        site = foundSite;

        // move the uploaded photo from the temp location (path property) to it's final location
        fs.readFile(req.files.photo.path, function (err, data) {
            var rootPath = "/home/ubuntu/facrest/public/photos/"; 
            var filePath = siteId + "/" + req.files.photo.name;
            var fullPath = rootPath + filePath;
                fs.writeFile(fullPath, data, function (err) {
                if (err) return next(new restify.InternalError(JSON.stringify(err)));

                var url = req.protocol + '://' + req.get('host') + '/photos/' + filePath;


                site.properties.photoUrls.push(url);
                site.save(function (err, site, numberAffected) {
                    if (err) return next(new restify.InternalError(JSON.stringify(err)));
                    // no error, send success
                    res.send(site);
                });
            });
        });
    });
}
