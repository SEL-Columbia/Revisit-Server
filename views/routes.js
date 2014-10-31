// dependancies
var async = require('async');
var fs = require('fs');

// local includes
var database = require('../models/dbcontroller.js');
var parser = require('../controller/parser.js');
var customID = require('../controller/customID.js');
var facilityBuilder = require('../controller/facilityBuilder.js');
var replies = require('./responses.js');

// echo
var respond = function (req, res, next) {
      res.send('hello ' + req.params.name);
      return next();
};


// check if a site is empty in JSON form (it can never be empty otherwise)
var isEmpty = function(sites, hidden_str) {
    if (sites === null || sites === undefined || sites.length <= 0) {
        return true;
    }

    var a_site = JSON.stringify(sites[0].toJSON({ hide: hidden_str, transform: true}));
    if (a_site === "{}") { 
        return true;
    }

    return false;
}

// check if only a single site was returned in query
var isOnlySite = function(sites) {
    if (sites !== null && sites.length == 1) {
        return true;
    }
    return false;
}

// views
var sites = function (req, res, next) {
    req.log.info("GET all facilities REQUEST", {"req": req.params});
    
    // parse query
    query = parser.parseParams(req.params, database.SiteModel);
    query.exec(function(err, sites) {

        if (err) {
            req.log.error(err);
            return replies.internalErrorReply(res, err);
        }

        // get hidden field before parseing
        var hidden_str = parser.parseForVirts(req.params);

        // I need to prevent projections to do count
        delete req.params.allProperties;
        delete req.params.fields;
        delete req.params.sortAsc;
        delete req.params.sortDesc;

        count_query = parser.parseParams(req.params, database.SiteModel); 
        count_query.limit(0).skip(0).count().exec(function(err, count) {

            if (err) {
                req.log.error(err);
                return replies.internalErrorReply(res, err);
            }

            if (isEmpty(sites, hidden_str)) {
                return replies.nothingFoundReply(res);
            }

            
            var off = parseInt(req.params.offset) || 0;
            var extras = {"length": sites.length, "offset": off, "total": count};

            facilityBuilder
                .buildFacility(sites, hidden_str)
                .addExtras(extras);

            replies.jsonReply(res, facilityBuilder.toObject(), 200);

        });
    });

    return next();
};

var site = function (req, res, next) {
    req.log.info("GET a facility REQUEST", {"req": req.params});

    database.SiteModel.findById(req.params[0], function(err, sites) {
        if (err) {
            req.log.error(err);
            return replies.internalErrorReply(res, err);
        }

        if (!isOnlySite(sites)) {
            return replies.nothingFoundReply(res);
        }

        replies.jsonReply(res, sites[0]);

    });

    return next();
};

var update = function (req, res, next) {
    req.log.info("PUT update facility REQUEST", {"req": req.params});

    var id = req.params[0];
    delete req.params[0];

    // parser wipes bad fields
    var success = parser.parseBody(req.params);

    if (!success && (Object.keys(req.params).length < 2)) {
        // No longer shutdown updates for having a few bad fields
        return replies.apiBadRequest(res, 
            "Refer to API for allowed update fields.");
    }
    
    database.SiteModel.updateById(id, req.params, function(err, site) {
        if (err) {
            // findbyid raises an error when id is not found, diff then actual err
            req.log.error(err);
            return replies.nothingFoundReply(res);
        }

        replies.jsonReply(res, site);
    });

    return next();
};

var add = function ( req, res, next) {
    req.log.info("POST add facility REQUEST", {"req": req.params});

    // keep the _id if they provide one
    var custom_id = customID(req.params.uuid);
    
    // enforces certain fields are not in body
    var success = parser.parseBody(req.params);

    // store it
    if (custom_id) {
        req.params._id = custom_id;
    }

    var site = new database.SiteModel(req.params);

    // check if site passes mongoose validation
    site.validate(function (err) {
        if (err) {
            req.log.error(err);
            return replies.apiBadRequest(res,
                "Refer to API for required fields.");
        }

        // write to db
        site.save(function(err, site) {
            if (err) {
                req.log.error(err);

                // _id collided
                if (err.code = 11000 && err.name !== "ValidationError") {
                    return replies.conflictReply(res, err);
                }
               
                return replies.internalErrorReply(res, err);
            }
            // respond with newly added site
            replies.jsonReply(res, site, 201);

        });

    });

    return next();
};

var bulk = function( req, res, next) {
    req.log.info("POST add MULTIPLE facility REQUEST (from json)", {"req": req.params});

    // body can be undefined ... strange this is the only place where its possible
    if (!req.body) {
        return replies.apiBadRequest(res);
    }

    // expects content type to be json
    var facilities = req.body.facilities;
    var debug = req.params.debug;

    if (!facilities) {
        return replies.apiBadRequest(res);
    }

    var num_inserted = 0;
    var num_failed = 0;
    var num_supplied = facilities.length;
    var errors = [];

    // define function to be mapped
    var fac_validator = function(facility, callback) {
        // keep the _id if they provide one
        var custom_id = customID(facility.uuid);
        
        // enforces certain fields are not in body
        //var success = parser.parseBody(facility);
        delete facility._id; // we only want to wipe one field in bulk upload.

        // store it
        if (custom_id !== false) {
            facility._id = custom_id;
        }

        //XXX: Sort out way to detect id collisions?
        
        var fac_model = new database.SiteModel(facility);
        fac_model.validate(function (err) {
            if (err) {
                // update error obj with facility, then record
                err["facility"] = facility
                errors[num_failed++] = err;
                facility = null; // nulify facility if err'd
            }

            callback(null, facility);

        });
    }   

    // apply fac_validator to all facilities, build result array
    async.map(facilities, fac_validator, function(err, result) {
        // those that failed to validate were nullifyed
        // XXX: shouldnt async provide a way to only return non error'd objs?
        result = result.filter(function(obj) { return obj !== null });

        // handle special case of all data failing to validate
        if (result.length === 0) {
            var response =  {   
                               "recieved": num_supplied, 
                               "inserted": num_inserted, 
                               "failed": num_failed
                            };

            // only return error's array when requested
            if (debug === "true") { 
                response["errors"] = errors;
            }

            return replies.jsonReply(res, response, 200);
        }

        // At this point a subset of the data will be recorded
        // bulk insert
        database.SiteModel.collection.insert(result, function(err, sites) {
            if (err) {
                req.log.error(err);
                if (err.code = 11000) {
                    return replies.conflictReply(res, err);
                } else {
                    return replies.internalErrorReply(res, err);
                }
            }

            num_inserted = sites.length;
            var response = {    
                            "recieved": num_supplied, 
                            "inserted": num_inserted, 
                            "failed": num_failed
                           };

            if (debug === "true") { 
                response["errors"] = errors;
            }

            replies.jsonReply(res, response, 201);


        });
    });

    return next();
};

var bulkFile = function( req, res, next) {
    req.log.info("POST add MULTIPLE facility REQUEST (from file)", {"req": req.files});

    // body can be undefined ... strange this is the only place where its possible
    if (!req.files || typeof req.files.facilities === 'undefined') {
        return replies.apiBadRequest(res);
    }

    // read file, validate, pass to bulk insert
    fs.readFile(req.files.facilities.path, 'utf8', function(err, facility_string) {
        if (err) {
            req.log.err(err);
            return replies.internalErrorReply(res, err);
        }

        if (!facility_string || facility_string.length === 0) {
            return replies.apiBadRequest(res);
        }

        try { // JSON parse is a headache

            var facility_object = JSON.parse(facility_string);
            req.body = {};
            req.body.facilities = facility_object.facilities;
            return bulk(req, res, next);

        } catch(err) { 
            // assume that jsonparse failed due to user error
            return replies.apiBadRequest(res, "JSON is malformed.");
        }
    });
    
    return next();

};

var del = function (req, res, next) {
    req.log.info("DEL delete facility REQUEST", {"req": req.params});
    var id = req.params[0];

    database.SiteModel.deleteById(id, function(err, nRemoved, writeStatus) {
        if (err) {
            req.log.error(err);
            return replies.internalErrorReply(res, err);
        }

        if (nRemoved === 0) {
            return replies.nothingFoundReply(res);
        }
        
        replies.jsonReply(res, {"id": id, "message": "Resource deleted"});

    });

    return next();
};

// exports
exports.respond = respond;
exports.sites = sites;
exports.site = site;
exports.update = update;
exports.add = add;
exports.bulk = bulk;
exports.bulkFile = bulkFile;
exports.del = del;

