// dependancies
var async = require('async');
var fs = require('fs');

// local includes
var database = require('../models/dbcontroller.js');
var parser = require('../controller/parser.js');
var replies = require('./responses.js');

// echo
var respond = function (req, res, next) {
      res.send('hello ' + req.params.name);
      return next();
};

// views
var sites = function (req, res, next) {
    req.log.info("GET all facilities REQUEST", {"req": req.params});
    
    // parse query
    var hidden = {}; // virt fields must be handled seperatly 
    query = parser.parseParams(req.params, database.SiteModel, hidden);
    var hidden_str = Object.keys(hidden).join(',');

    query.exec(function(err, sites) {

        if (err) {
            req.log.error(err);
            return replies.dbErrorReply(res, err);
        }

        // I need to prevent projections to do count
        delete req.params.allProperties;
        delete req.params.fields;
        delete req.params.sortAsc;
        delete req.params.sortDesc;

        count_query = parser.parseParams(req.params, database.SiteModel); 
        count_query.limit(0).skip(0).count().exec(function(err, count) {

            if (err) {
                req.log.error(err);
                return replies.dbErrorReply(res, err);
            }

            if (sites !== null && sites.length > 0) {
                // check if a site is empty in JSON form (it can never be empty otherwise
                var a_site = JSON.stringify(sites[0].toJSON({ hide: hidden_str, transform: true}));
                var off = req.params.offset || 0;
                var extras = {"length": sites.length, "offset": off, "total": count};
                if (a_site !== "{}") { 
                    replies.jsonArrayReply(res, sites, 200, hidden_str, extras);
                } else {
                    replies.dbEmptyReturn(res);
                }
            } else {
                replies.dbEmptyReturn(res);
            }

        });
    });

    return next();
};

var site = function (req, res, next) {
    req.log.info("GET a facility REQUEST", {"req": req.params});

    database.SiteModel.findById(req.params[0], function(err, sites) {
        if (err) {
            req.log.error(err);
            return replies.dbErrorReply(res, err);
        }

        if (sites !== null && sites.length == 1) {
            site = sites[0]; // should only be one
            replies.jsonReply(res, site);

        } else {
            replies.dbEmptyReturn(res);
        }

    });

    return next();
};

var update = function (req, res, next) {
    req.log.info("PUT update facility REQUEST", {"req": req.params});

    var id = req.params[0];
    delete req.params[0];

    var success = parser.parseBody(req.params);
    if (!success) {
        return replies.apiBadRequest(res, success);
    }
    
    database.SiteModel.updateById(id, req.params, function(err, site) {
        if (err) {
            // findbyid raises an error when id is not found, diff then actual err
            req.log.error(err);
            return replies.dbEmptyReturn(res, site);
        }

        replies.jsonReply(res, site);
    });

    return next();
};

var add = function ( req, res, next) {
    req.log.info("POST add facility REQUEST", {"req": req.params});

    // enforces certain fields are not in body
    var success = parser.parseBody(req.params);
    if (!success) {
        return replies.apiBadRequest(res, success);
    }


    // TODO: set up parser function for this in controller
    var name = req.params.name;
    var prop = req.params.properites;

    
    var site = new database.SiteModel(req.params);
    site.validate(function (err) {
        if (err) {
            req.log.error(err);
            return replies.apiBadRequest(res, success);
        }


        site.save(function(err, site) {
            if (err) {
                req.log.error(err);
                return replies.dbErrorReply(res, err.message);
            }

            replies.jsonReply(res, site, 201);

        });

    });

    return next();
};

var bulk = function( req, res, next) {
    req.log.info("POST add MULTIPLE facility REQUEST (from json)", {"req": req.params});

    // body can be undefined ... strange this is the only place where its possible
    if (!req.body) {
        return replies.apiBadRequest(res, "Should used this at some point");
    }

    // expects content type to be json
    var facilities = req.body.facilities;
    var debug = req.params.debug;

    if (!facilities) {
        return replies.apiBadRequest(res, "Should used this at some point");
    }

    var num_inserted = 0;
    var num_failed = 0;
    var num_supplied = facilities.length;
    var errors = [];

    var fac_saver = function(facility, callback) {
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

    async.map(facilities, fac_saver, function(err, result) {
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

            if (debug === "true") { 
                response["errors"] = errors;
            }

            return replies.jsonReply(res, response, 201);
        }

        // bulk insert
        database.SiteModel.collection.insert(result, function(err, sites) {
            if (err) {
                req.log.error(err);
                return replies.dbErrorReply(res, message);
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
        return replies.apiBadRequest(res, "Should used this at some point");
    }

    var debug = req.params.debug;
    fs.readFile(req.files.facilities.path, 'utf8', function(err, facility_string) {
        if (err) {
            req.log.err(err);
            return replies.dbErrorReply(res, "Could not read file?");
        }

        if (!facility_string || facility_string.length === 0) {
            return replies.apiBadRequest(res, "Should used this at some point");
        }

        try { // JSON parse is a headache

            var facility_object = JSON.parse(facility_string);
            req.body = {};
            req.body.facilities = facility_object.facilities;
            return bulk(req, res, next);

        } catch(err) { 
            return replies.apiBadRequest(res, "JSON is malformed");
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
            return replies.dbErrorReply(res, err);
        }

        if (nRemoved === 0) {
            return replies.dbEmptyReturn(res);
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

