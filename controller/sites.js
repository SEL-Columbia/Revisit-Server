// dependencies
var async = require('async'),
    fs = require('fs'),
    restify = require('restify'),
    _ = require('lodash-node'),
    mkdirp = require('mkdirp');

// local includes
var SiteModel = require('../domain/model/site.js'),
    log = require('../core/logger.js').log,
    parser = require('../core/requestParser.js'),
    customID = require('../domain/customID.js'),
    responseBuilder = require('../core/responseBuilder.js'),
    responses = require('../view/responses.js');



/*
 * UTILITY METHODS
 */

// check if a site is empty in JSON form (it can never be empty otherwise)
function isEmpty(sites, hidden_str) {
    if (sites === null || sites === undefined || sites.length <= 0) {
        return true;
    }

    var a_site = JSON.stringify(sites[0].toJSON({
        hide: hidden_str,
        transform: true
    }));

    if (a_site === "{}") {
        return true;
    }

    return false;
}

// check if only a single site was returned in query
function isOnlySite(sites) {
    if (sites !== null && sites.length === 1) {
        return true;
    }
    return false;
}


// if block for query type field
function getQuery(req, showDeleted) {
    var query = SiteModel.findAll(showDeleted);

    var boundingBox = req.params.within;
    var coords = req.params.near;

    // near query defined?
    if (coords) {
        var latLng = coords.split(',');
        if (latLng.length !== 2)
            return null;

        req.params.lat = latLng[0];
        req.params.lng = latLng[1];
        query = near(req, showDeleted);
    }

    // within query defined?
    if (boundingBox) {
        var latLngBox = boundingBox.split(',');
        if (latLngBox.length !== 4)
            return null;

        req.params.nlat = latLngBox[0]; 
        req.params.wlng = latLngBox[1]; 
        req.params.slat = latLngBox[2]; 
        req.params.elng = latLngBox[3]; 

        query = within(req, showDeleted);
    }

    return query;
}

function near(req, showDeleted) {
    req.log.info("GET near facility REQUEST", {
        "req": req.params
    });

    var lat = req.params.lat;
    var lng = req.params.lng;

    if (typeof lat === 'undefined' || typeof lng === 'undefined') {
        return;
    }

    var rad = req.params.rad || 0;
    var units = req.params.units || 'km';

    var earthRad = 6371; // km
    if (units === 'mi') {
        earthRad = 3959;
    }

    if (isNaN(rad) || parseInt(rad) < 0 || isNaN(lng) || isNaN(lat)) {
        return;
    }

    // query obj 
    return SiteModel.findNear(lng, lat, rad, earthRad, showDeleted);
}

function within(req, showDeleted) {
    req.log.info("GET within facility REQUEST", {
        "req": req.params
    });

    var slat = req.params.slat;
    var wlng = req.params.wlng;
    var nlat = req.params.nlat;
    var elng = req.params.elng;

    if (isNaN(slat) || isNaN(wlng) || isNaN(elng) || isNaN(nlat)) {
        return;
    }

    return SiteModel.findWithin(slat, wlng, nlat, elng, showDeleted);
}

/*
 ** ROUTES
 * SITES -> Return facilities (formatted by query params)
 * ADD -> Add new facility
 * UPDATE -> Update exisiting facility
 * DELETE -> Remove exisiting facility
 * BULK/BULKFILE -> Upload many facilities
 **
 */
function sites(req, res, next) {
    req.log.info("GET all facilities REQUEST", {
        "req": req.params
    });

    var showDeleted = typeof req.params.showDeleted === 'string';
    var query = getQuery(req, showDeleted);

    if (!query) {
        responses.apiBadRequest(res, "Please refer to the wiki for a guide on Revisit's API");
        return;
    }

    // parse query
    query = parser.parseParams(req.params, query);
    query.exec(function(err, sites) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        // get hidden field before parseing
        var hidden_str = parser.parseForVirts(req.params);

        // I need to prevent projections to do count
        var og_query = getQuery(req, showDeleted);
        // TODO: find pretty way clear these fields (new info: can chain .find() queries);
        delete req.params.allProperties;
        delete req.params.fields;
        delete req.params.sortAsc;
        delete req.params.sortDesc;
        delete req.params.sortBy;
        // second query - slicing/project fields (count doesnt work with em);
        var count_query = parser.parseParams(req.params, og_query);
        count_query.limit(0).skip(0).count().exec(function(err, count) {
            if (err) {
                req.log.error(err);
                return responses.internalErrorReply(res, err);
            }

            if (isEmpty(sites, hidden_str)) {
                // never 404?
                sites = [];
                //return responses.nothingFoundReply(res);
            }

            var extras = {},
                limit = sites.length,
                page,
                offset,
                totalPages;

            // if page param present and is an int, return pagination state
            if (req.params.page !== undefined && !isNaN(parseInt(req.params.page))) {
                extras.page = parseInt(req.params.page);
                extras.per_page = parseInt(req.params.per_page) || parseInt(req.params.limit);
                extras.total_entries = count;
                extras.total_pages = Math.ceil(count / extras.per_page);
            } else {
                // page NOT set, return limit/offset state
                extras.offset = parseInt(req.params.offset) || 0;
                extras.limit = limit;
                extras.total = count;
            }

            var responseBody = responseBuilder
                .buildResponse(sites, hidden_str, 'facilities')
                .addExtras(extras)
                .toObject();

            responses.jsonReply(res, responseBody, 200);

        });
    });

    return next();
}

function site(req, res, next) {
    req.log.info("GET a facility REQUEST", {
        "req": req.params
    });

    var rollback = req.params.rollback;
    var revert = req.params.revert;
    var history = req.params.history;
    var showDeleted = typeof req.params.showDeleted === 'string';

    SiteModel.findById(req.params[0], showDeleted).exec(function(err, sites) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        if (!isOnlySite(sites)) {
            return responses.nothingFoundReply(res);
        }

        var site = sites[0];
        // history
        if (typeof history === 'string') {
            site.history(0, 100, function(err, result) {
                var extras = {
                    limit : result.length,
                    version : site._version
                };

                var responseBody = responseBuilder
                    .buildResponse(result, null, 'history')
                    .addExtras(extras)
                    .toObject();

                responses.jsonReply(res, responseBody, 200);

            });

        // rollback
        //} else if (rollback && !isNaN(rollback)) {
        //    rollback = parseInt(rollback); 
        //    site.rollback(rollback, function(err, history) {
        //        responses.jsonReply(res, site);
        //    });
        //// revert 
        //} else if (revert && !isNaN(revert)) {
        //    revert = parseInt(revert); 
        //    site.revert(revert, function(err, history) {
        //        responses.jsonReply(res, site);
        //    });
        } else {
            responses.jsonReply(res, site);
        }

    });

    return next();
}

function update(req, res, next) {
    req.log.info("PUT update facility REQUEST", {
        "req": req.params
    });

    var updateDeleted = typeof req.params.showDeleted === 'string';
    var id = req.params[0];
    delete req.params[0];

    // parser wipes bad fields
    var success = parser.parseBody(req.params);

    if (!success && (Object.keys(req.params).length < 2)) {
        // No longer shutdown updates for having a few bad fields
        return responses.apiBadRequest(res,
            "Refer to API for allowed update fields.");
    }

    SiteModel.updateById(id, req.params, updateDeleted, function(err, site) {
        if (err) {
            // findbyid raises an error when id is not found, diff then actual err
            req.log.error(err);
            return responses.nothingFoundReply(res);
        }

        responses.jsonReply(res, site);
    });

    return next();
}

function add(req, res, next) {
    req.log.info("POST add facility REQUEST", {
        "req": req.params
    });

    // branching on bulk now 
    if (typeof req.params.bulk === 'string') {
        // JSON post
        if (req.body && req.body.facilities) {
            bulk(req,res,next);
        
        // File upload
        } else if (req.files)  {
            bulkFile(req, res, next);

        //Trigger happy api user
        } else {
            responses.apiBadRequest(res,
                "Refer to API for required fields.");
        }

        return;
    }

    // keep the _id if they provide one
    var custom_id = customID(req.params.uuid);

    // enforces certain fields are not in body
    var success = parser.parseBody(req.params);

    // store it
    if (custom_id) {
        req.params._id = custom_id;
    }

    var site = new SiteModel(req.params);

    // check if site passes mongoose validation
    site.validate(function(err) {
        if (err) {
            req.log.error(err);
            return responses.apiBadRequest(res,
                "Refer to API for required fields.");
        }

        // write to db
        site.save(function(err, site) {
            if (err) {
                req.log.error(err);

                // _id collided
                if (err.code === 11000) {
                    return responses.conflictReply(res, err);
                }

                return responses.internalErrorReply(res, err);
            }
            // respond with newly added site
            responses.jsonReply(res, site, 201);

        });

    });

    return next();
}

function bulk(req, res, next) {
    req.log.info("POST add MULTIPLE facility REQUEST (from json)", {
        "req": req.params,
        "req.body": req.body
    });

    // body can be undefined ... strange this is the only place where its possible
    if (!req.body) {
        return responses.apiBadRequest(res);
    }

    // expects content type to be json
    var facilities = req.body.facilities;
    var debug = req.params.debug;

    if (!facilities) {
        return responses.apiBadRequest(res);
    }

    if (typeof facilities === 'string') {
        // Not a JSON array, check if parsable
        try {
            facilities = JSON.parse(facilities);
        } catch (err) {
            return responses.apiBadRequest(res);
        }
    }

    var num_inserted = 0;
    var num_failed = 0;
    var num_supplied = facilities.length;
    var errors = [];


    var bulkIns = SiteModel.collection.initializeUnorderedBulkOp();
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

        var fac_model = new SiteModel(facility);
        fac_model.validate(function(err) {
            if (err) {
                // update error obj with facility, then record
                err.facility = facility;
                errors[num_failed++] = err;
                facility = null; // nulify facility if err'd
                callback(null, null);
                return;
            }

            bulkIns.insert(facility);
            callback(null, facility);

        });
    };


    // apply fac_validator to all facilities, build result array
    async.map(facilities, fac_validator, function(err, result) {
        // those that failed to validate were nullifyed
        // XXX: shouldnt async provide a way to only return non error'd objs?
        result = result.filter(function(obj) {
            return obj !== null;
        });

        var response = {
            "received": num_supplied,
            "inserted": num_inserted,
            "failed": num_failed
        };

        if (typeof debug === "string") {
            response.errors = errors;
        }

        // bulkIns crashes if nothing is added to op
        if (result.length === 0) {
            responses.jsonReply(res, response, 200);
            return next(); 
        }

        // At this point a subset of the data will be recorded
        bulkIns.execute(function(err, writeResult) {
            if (err) {
                // New to mongo 3, the err status gets duplicated here and in write errors
                if (!err.errmsg.includes("11000")) 
                    return responses.internalErrorReply(res, err);
            }

            if (writeResult.hasWriteErrors()) {
                var writeErrors = writeResult.getWriteErrors();
                req.log.error(writeErrors);
                //TODO: Error parsing is ridiculous, errmsg === message, op === facility?
                writeErrors.forEach(function(err) {
                    // handle id collisions seperatly, continue with regular
                    // output but record errors 
                    if (err.code === 11000) {
                        // Format it to how regular mongoose errors look
                        if (typeof debug === "string") {
                            var Err = new Error();
                            err = err.toJSON();
                            Err.message = "Duplicate key found";
                            Err.name = "DuplicateKeyError";
                            Err.errors = err.errmsg;
                            Err.facility = err.op;
                            response.errors.push(Err);
                        }

                    } else {
                        // can't recover from this, let em know
                        return responses.internalErrorReply(res, err);
                    }
                });
            } 

            response.inserted += writeResult.nInserted;
            response.failed += writeResult.getWriteErrorCount();
            responses.jsonReply(res, response, 201);

        });
    });

    return next();
}

function bulkFile(req, res, next) {
    req.log.info("POST add MULTIPLE facility REQUEST (from file)", {
        "req": req.files
    });

    // body can be undefined ... strange this is the only place where its possible
    if (!req.files || typeof req.files.facilities === 'undefined') {
        return responses.apiBadRequest(res);
    }    

    // read file, validate, pass to bulk insert
    fs.readFile(req.files.facilities.path, 'utf8', function(err, facility_string) {
        if (err) {
            req.log.err(err);
            return responses.internalErrorReply(res, err);
        }

        if (!facility_string || facility_string.length === 0) {
            return responses.apiBadRequest(res);
        }

        try { // JSON parse is a headache

            var facility_object = JSON.parse(facility_string);
            req.body = {};
            req.body.facilities = facility_object.facilities;
            return bulk(req, res, next);

        } catch (err) {
            // assume that jsonparse failed due to user error
            return responses.apiBadRequest(res, "JSON is malformed.");
        }
    });

    return next();

}

function del(req, res, next) {
    req.log.info("DEL delete facility REQUEST", {
        "req": req.params
    });

    var id = req.params[0];

    SiteModel.deleteById(id, function(err, site) {
        if (err) {
            // findbyid raises an error when id is not found, diff then actual err
            req.log.error(err);
            return responses.nothingFoundReply(res);
        }

        responses.jsonReply(res, {
            "id": id,
            "message": "Resource deleted"
        });

    });

    return next();
}

//TODO: Refactor, does too much work 
function uploadPhoto(req, res, next) {
    req.log.info("POST photo to facility REQUEST", {
        "req": req.params,
        "files": req.files
    });

    var siteId = req.params.id || null;
    // if no sideId is included in request, error
    if (!siteId) {
        return next(new restify.MissingParameterError("The required siteId parameter is missing."));
    }

    if (!req.files || typeof req.files.photo === 'undefined') {
        return next(new restify.MissingParameterError("The required photo parameter is missing."));
    }

    // make sure the id is associated with a known Site
    SiteModel.findById(siteId, function(err, site) {
        if (err) {
            req.log.error(err);
            return next(new restify.ResourceNotFoundError(JSON.stringify(err)));
        }

        // returns as an array
        site = site[0];

        // move the uploaded photo from the temp location (path property) to its final location
        fs.readFile(req.files.photo.path, function(err, data) {
            if (err) {
                req.log.err(err);
            }

            // excuse the dir hack
            var rootPath = __dirname + "/../public/sites/photos",
                siteDir = siteId,
                filePath = req.files.photo.name,
                fullPath = rootPath + '/' + siteDir + '/' + filePath;

            // create the dir for the site
            mkdirp(rootPath + '/' + siteDir, function(err) {
                if (err) {
                    req.log.err(err);
                    //log.error(err);
                    return next(new restify.InternalError(JSON.stringify(err)));
                } else {
                    fs.writeFile(fullPath, data, function(err) {
                        if (err) {
                            req.log.error(err);
                            return next(new restify.InternalError(JSON.stringify(err)));
                        }

                        var url = 'http://' + req.header('Host') + '/sites/photos/' + siteDir + '/' + filePath;

                        var index = -1; // cannot assume properties is defined
                        if (!site.properties) {
                            site.properties = {};
                            site.properties.photoUrls = [];
                        } else {
                            // check that this photo is new. we'll replace the tmp path with the url
                            // TODO: Ask Jon about this tmp thing, not sure how this can happen??
                            index = site.properties.photoUrls.indexOf('tmp/' + req.files.photo.name);

                        }

                        //log.debug(">>> photo ind:", index, site.properties.photoUrls.indexOf(url));
                        if (index != -1) {
                            site.properties.photoUrls.splice(index, 1, url);
                        } else if (site.properties.photoUrls.indexOf(url) == -1) {
                            // must be new url
                            site.properties.photoUrls.push(url);
                        }

                        //log.debug('site photo url: ' + url);

                        site.save(function(err, updatedSite, numberAffected) {
                            if (err) {
                                req.log.error(err);
                                return next(new restify.InternalError(JSON.stringify(err)));
                            }
                            //log.debug('site saved, sending response');
                            // no error, send success
                            res.send(updatedSite);
                        });
                    });
                }
            });
        });
    });
}

// exports
exports.sites = sites;
exports.site = site;
exports.update = update;
exports.add = add;
exports.bulk = bulk;
exports.bulkFile = bulkFile;
exports.del = del;

exports.uploadPhoto = uploadPhoto;
