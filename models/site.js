// dependancies
var mongoose = require('mongoose');

// local deps
var conf = require('./../config/config.js');

var Schema = mongoose.Schema;
var SiteModel = new Schema({
        name: {
            type: String,
            required: true,
            index: true
        },
        
        active: {
            type: Boolean,
            default: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now,
            index: true
        },
        coordinates: { 
            type: [Number]
        },
        properties: {
            type: {
                type: String
            },
            sector: {
                type: String,
                index: true
            },
            visits: {
                type: Number,
                index: true
            },
            photoEndpoint: String,
            photoUrls: [String]
        }
    }, 
    // remove the unnecessary 'id' virtual field that mongoose adds
    { 
        id: false,
    }
);

SiteModel.index({ coordinates: "2dsphere", 'properties.sector': 1 });

// Create virtual for UUID from ID
SiteModel.virtual('uuid').get(function(){
    if (this._id)
        return this._id.toHexString();
});

// Create virtual for HREF from ID
SiteModel.virtual('href').get(function(){
    if (this._id)
        return conf.site + this._id.toHexString() + ".json";
});

// Configure toObject
SiteModel.set('toObject', {
    virtuals: true
});

// Configure toJSON output
SiteModel.set('toJSON', {
    transform: function (doc, ret, options) {
        var obj = doc.toObject(); 
        
        // if hide field is currently the only way to remove virtual fields
        if (options.hide) {
            options.hide.split(',').forEach(function(prop) {
                delete obj[prop];
            });
        }

        delete obj._id;
        delete obj.__v;
        return obj
    }
});

SiteModel.statics.findLimit = function(lim, off, callback) {
    return this.find({}).skip(off).limit(lim).exec(callback);
};

SiteModel.statics.findAll = function(callback) {
    return this.find({}, callback);
};

SiteModel.statics.findById = function(id, callback) {
    return this.find({"_id" : id}, callback);
}

SiteModel.statics.findNear = function(lng, lat, rad, earthRad, callback) {
    return this.find({ "coordinates": 
                        {"$geoWithin": 
                            { "$centerSphere": 
                                [   
                                    [lng, lat], rad / earthRad 
                                ]
                            }
                        }
                     }, callback);
}

SiteModel.statics.findWithin = function(swlat, swlng, nelat, nelng, callback) {
    return this.find({"coordinates": 
                        {"$geoWithin": 
                            { "$box": 
                                [ 
                                    [swlng, swlat],
                                    [nelng, nelat]
                                ]
                            }
                        }
                    }, callback);
}

SiteModel.statics.findWithinSector = function(swlat, swlng, nelat, nelng, sector, callback) {
    return this.find(
             {"$and": 
                [{"coordinates": 
                        {"$geoWithin": 
                            { "$box": 
                                [ 
                                    [swlng, swlat],
                                    [nelng, nelat]
                                ]
                            }
                        }
                    },
                 {"properties.sector": sector}]
             }, callback);
}

SiteModel.statics.updateById = function(id, site, callback) {
    return this.findByIdAndUpdate(id, {"$set": site }, callback);
}

SiteModel.statics.deleteById = function(id, callback) {
    return this.remove({"_id": id }, true).exec(callback);
}
exports.SiteModel = mongoose.model('SiteModel', SiteModel, 'facilities');
