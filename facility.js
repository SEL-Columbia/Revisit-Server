var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Facility = new Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    location: {
        lat: Number,
        lng: Number
    },
    checkins: Number
});

exports.FacilityModel = mongoose.model('Facility', Facility);