var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var SiteModel = new Schema({
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
        visits: Number,
        photoEndpoint: String,
        photoUrls: [String]
    }
});

SiteModel.statics.findLimit = function(lim, off, callback) {
    return this.find({}).skip(off).limit(lim).exec(callback);
};

SiteModel.statics.findAll = function(callback) {
    return this.find({}, callback);
};

exports.SiteModel = mongoose.model('SiteModel', SiteModel, 'facilities');