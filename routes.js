var FacilityModel = require('./models/facility').FacilityModel,
    csv = require('ya-csv'),
    uuid = require('node-uuid');

exports.populate = function(req, res, next) {
    var facs = [];
    for (var i = 0; i < 100; i++) {
        // 40.809, -73.9597
        var lat = 40.8 + 0.1 * (Math.random() - Math.random()),
            lng = -73.9 + 0.1 * (Math.random() - Math.random());
        facs[i] = new FacilityModel({
            "name": "Facility " + i,
            "type": "Health",
            "location": {
                "lat": lat,
                "lng": lng
            },
            "checkins": Math.floor(Math.random() * 100)
        }).save();
    };
    res.send("Populated.");
};

exports.kenya = function(req, res, next) {
    var reader = csv.createCsvFileReader('data/Health_Facilities.csv');
    reader.setColumnNames(['facility_number', 'name', 'hmis', 'province', 'district', 'division', 'location', 'sub_location', 'spatial_reference_method', 'type', 'agency', 'geolocation']);
    reader.addListener('data', function(data) {
        // supposing there are so named columns in the source file
        // console.log(data);

        if (data.name !== '' && data.geolocation !== '') {
        	var geoRegex = /\(([0-9.-]+),\s+([0-9.-]+)\)/;
        	var geo = data.geolocation.match(geoRegex);
        	console.log(geo, data.type);

        	if (geo) {
        		// console.log(geo[1], geo[2]);
	        	var fac = new FacilityModel({
		            "name": data.name,
                    "uuid": uuid.v1(),
                    "active": true,
                    "coordinates": [geo[1], geo[2]],
                    "properties" : {
                        "type": "health",
                        // "type": data.type,
                        "checkins": Math.floor(Math.random() * 10)
                    }
		        }).save(function(err) {
                    console.log(err);
                });
        	}
        }
    });
};

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
                "$centerSphere": [[ lat, lng], rad / earthRad]
            }
        }
    }).exec(function(err, facs) {
        if (err) console.log(err);
        res.send(facs);
    });
};
