var FacilityModel = require('./models/facility').FacilityModel,
    csv = require('ya-csv'),
    uuid = require('node-uuid');

exports.facilities = function(req, res, next) {
    var facs = FacilityModel.find(function(err, facs) {
        if (err) console.log(err);
        res.send(facs);
    });
    // res.send(facs);
}

exports.facility = function(req, res, next) {
    var uuid = req.params.uuid;
    FacilityModel.find({
        uuid: uuid
    }, function(error, facility) {
        if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))

        if (facility) {
            res.send(facility)
        } else {
            res.send(404)
        }
    });
}

exports.geowithin = function(req, res, next) {
    // console.log(req.query); return;
    var lat = req.query['lat'],
        lng = req.query['lng'],
        rad = req.query['rad'] || 10,
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
