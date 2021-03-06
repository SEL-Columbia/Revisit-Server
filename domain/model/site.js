// dependancies
var mongoose = require('mongoose'),
    rollback = require('mongoose-rollback'),
    quadtree = require('mongoose-quadtree');

// local deps
var conf = require('./../../config/app/config.js'),
    log = require('../../core/logger').log;

var Schema = mongoose.Schema;

var Properties = new Schema({
    type: {
        type: String
    },
    sector: {
        type: String,
        required: true,
        index: true
    },
    visits: {
        type: Number,
        index: true
    },
    photoEndpoint: String,
    photoUrls: [String]
}, {
    _id: false,
    strict: false
});

var SiteModel = new Schema({
    name: {
        type: String,
        required: true,
        index: true
    },

    _deleted: {
        type: Boolean,
        default: false,
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
        type: [Number],
        required: true
    },
    identifiers: [{
        agency: {
            type: String
        },

        context: {
            type: String
        },

        id: {
            type: String
        }
    }],
    properties: Properties
},
    // remove the unnecessary 'id' virtual field that mongoose adds
    {
        id: false
    }
);

// Using 2d instead of 2dsphere based on performance in loadtests
SiteModel.index({
    coordinates: '2d',
    'properties.sector': 1
});

// Add text index to name & id -- could potentially add text index to entire db
// (though if we're going to do that, it might be worthwhile using ElasticSearch)
SiteModel.index({
    name: 'text'
});

// Compound index on createdAt and updatedAt
SiteModel.index({
    'createdAt': 1,
    'updatedAt': 1
});

//SiteModel.plugin(rollback,  {index: true, collectionName: 'facilities', conn: dbconf.uri });
SiteModel.plugin(rollback, {
    index: true,
    collectionName: 'facilities'
});

SiteModel.plugin(quadtree, {
    index: true,
    threshold: 2000,
    seperation: 0.2,
    compress: true,
    collectionName: 'facilities'
});


// Create virtual for UUID from ID
SiteModel.virtual('uuid').get(function() {
    if (this._id)
        return this._id.toHexString();
});

// Create virtual for HREF from ID
SiteModel.virtual('href').get(function() {
    if (this._id)
        return conf.site + this._id.toHexString() + '.json';
});

// Configure toObject
SiteModel.set('toObject', {
    virtuals: true
});

// Configure toJSON output
SiteModel.set('toJSON', {
    transform: function(doc, ret, options) {
        var obj = doc.toObject();

        // hide field is currently the only way to remove virtual fields
        if (options.hide) {
            options.hide.split(',').forEach(function(prop) {
                delete obj[prop];
            });
        }

        // remove properties _id
        // delete obj.properties._id;

        delete obj._id;
        delete obj.__v;
        delete obj._deleted; //XXX: will need to be shown if asked? maybe?
        return obj;
    }
});

//NOTE: callback model removed in favour of exec model.
//Although both seem compatiable ...  its less confusing if not shown imo
SiteModel.statics.findLimit = function(lim, off, showDeleted) {
    var deleted = {
        $or: [{
            _deleted: {
                $exists: false
            }
        }, {
            _deleted: false
        }]
    };
    if (showDeleted) {
        deleted = null;
    }
    return this.find(deleted).skip(off).limit(lim);
};

SiteModel.statics.findAll = function(showDeleted) {
    var deleted = {
        $or: [{
            _deleted: {
                $exists: false
            }
        }, {
            _deleted: false
        }]
    };
    if (showDeleted) {
        deleted = null;
    }
    return this.find(deleted);
};

SiteModel.statics.findById = function(id, showDeleted) {
    if (showDeleted) {
        return this.find({
            _id: id
        });
    }

    return this.find({
        _id: id,
        $or: [{
            _deleted: {
                $exists: false
            }
        }, {
            _deleted: false
        }]
    });
};

SiteModel.statics.search = function(searchTerm) {
    return this.find({
        '$text': {
            '$search': searchTerm
        }
    });
};

SiteModel.statics.findNear = function(lng, lat, rad, earthRad, showDeleted) {

    if (showDeleted) {

        return this.find({
            'coordinates': {
                '$geoWithin': {
                    '$centerSphere': [
                        [lng, lat], rad / earthRad
                    ]
                }
            }
        });
    }

    return this.find({
        'coordinates': {
            '$geoWithin': {
                '$centerSphere': [
                    [lng, lat], rad / earthRad
                ]
            }
        },

        $or: [{
            _deleted: {
                $exists: false
            }
        }, {
            _deleted: false
        }]

    });
};

SiteModel.statics.findWithin = function(swlat, swlng, nelat, nelng, showDeleted) {

    if (showDeleted) {
        return this.find({
            'coordinates': {
                '$geoWithin': {
                    '$box': [
                        [swlng, swlat],
                        [nelng, nelat]
                    ]
                }
            }
        });
    }

    return this.find({
        'coordinates': {
            '$geoWithin': {
                '$box': [
                    [swlng, swlat],
                    [nelng, nelat]
                ]
            }
        },

        $or: [{
            _deleted: {
                $exists: false
            }
        }, {
            _deleted: false
        }]

    });
};

/* These two require callbacks to be passed in due to their extra steps */
SiteModel.statics.updateById = function(id, site, updateDeleted, callback) {
    this.findOne({
        '_id': id
    }, function(err, model) {
        if (err) {
            return callback(err, null);
        }

        if (model._deleted && !updateDeleted) {
            err = new Error();
            err.message = 'Does not exist';
            err.name = 'Already Deleted';
            return callback(err, null);
        }

        Object.keys(site).forEach(function(key) {
            model[key] = site[key];
        });

        model.save(callback);

    });
};

SiteModel.statics.deleteById = function(id, callback) {

    this.findOne({
        '_id': id
    }, function(err, model) {
        if (err) {
            return callback(err, null);
        }

        if (model._deleted) {
            err = new Error();
            err.message = 'Does not exist';
            err.name = 'Already Deleted';
            return callback(err, null);
        }

        model._deleted = true;
        model.save(callback);

    });


    //return this.remove({
    //    '_id': id
    //}).exec(callback);
};


// Avoid recompilation
if (mongoose.models.SiteModel) {
    SiteModel = mongoose.model('SiteModel');
} else {
    SiteModel = mongoose.model('SiteModel', SiteModel, 'facilities');
}

module.exports = SiteModel;
