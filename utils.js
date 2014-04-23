var nycclinic = require('./data/NYCCollege.json'),
	mongoose = require('mongoose'),
    FacilityModel = require('./models/facility').FacilityModel,
    uuid = require('node-uuid');

mongoose.connect('mongodb://localhost/sel');

function parseToFacility(pois) {
    // console.log(file);
    for (var i in pois) {
        var data = pois[i],
        	nameComma = data.display_name.indexOf(','),
        	name = data.display_name.substring(0,nameComma),
        	type = 'education'

        var fac = new FacilityModel({
            "name": name,
            "uuid": data.osm_id,
            "active": true,
            "coordinates": [data.lat, data.lon],
            "properties": {
                "type": type,
                "checkins": Math.floor(Math.random() * 10)
            }
        }).save(function(err) {
            console.log(err);
        });
    }
}

parseToFacility(nycclinic);
