var FacilityModel = require('./facility').FacilityModel,
    csv = require('ya-csv');

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
        	console.log(geo, data.geolocation);

        	if (geo) {
        		// console.log(geo[1], geo[2]);
	        	var fac = new FacilityModel({
		            "name": data.name,
		            "type": data.type,
		            "location": {
		                "lat": geo[1],
		                "lng": geo[2]
		            },
		            "checkins": Math.floor(Math.random() * 10)
		        }).save();
        	}
        }
    });
};
