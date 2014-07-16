var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Facility = new Schema({
    name: {
        type: String,
        required: true
    },
    href: String,
    uuid: {
        type: String,
        required: true
    },
    active: Boolean,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    coordinates: { 
        type: [Number], 
        index: '2dsphere'
    },
    properties: {
        type: {
            type: String
        },
        sector: {
            type: String
        },
        visits: Number
    }
});

exports.FacilityModel = mongoose.model('Facility', Facility);
