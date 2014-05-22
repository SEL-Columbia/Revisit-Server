var FacilityModel = require('./models/facility').FacilityModel,
    restify = require('restify');

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
        units = req.params['units'] || 'mi',
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
    var fac = JSON.parse(req.body),
        id = fac._id,
        query = {};

    // At the moment, we require an _id here, not uuid since mongoose expects this for the findByIdAndUpdate method
    fac.updatedAt = Date();

    FacilityModel.findByIdAndUpdate(id, {$set: fac}, function (err, facility) {
      if (err) return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));
      res.send(facility);
    });

    // FacilityModel.findOne(query, function(err, facility) {
    //     console.log(err);
    //     if (err) return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));

    //     if (facility) {
    //         facility = fac;
    //         fac.save(function(err, fac) {
    //             console.log('save callback...', err, fac);
    //             if (err) {
    //                 console.log('!!!!!!!!! ERROR UPDATING !!!!!!!!!!', err);
    //                 return next(new restify.InvalidArgumentError(JSON.stringify(err.errors)));
    //             } else {
    //                 res.send(fac);
    //                 console.log(':):):):):) Success Updating :):):):):)', res);
    //                 next();            
    //             }
    //         });
    //         // res.send(facility)
    //     } else {
    //         res.send(404)
    //     }
    // });
    // return next(new restify.RestError({statusCode: 400, restCode: "Not Implemented", message: "Update method not yet implemented."}));
}

exports.deleteFacility = function (req, res, next) {
    return next(new restify.RestError({statusCode: 400, restCode: "Not Implemented", message: "Delete method not yet implemented."}));
}

exports.flagFacility = function (req, res, next) {
    return next(new restify.RestError({statusCode: 400, restCode: "Not Implemented", message: "Flag method not yet implemented."}));
}
