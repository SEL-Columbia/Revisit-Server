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
    // facilityBuilder = require('../domain/facilityBuilder.js'),
    responseBuilder = require('../core/responseBuilder.js'),
    responses = require('../view/responses.js');



/**
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






/**
 * ROUTES
 */

function sites(req, res, next) {
    req.log.info("GET all facilities REQUEST", {
        "req": req.params
    });

    // parse query
    query = parser.parseParams(req.params, SiteModel);
    query.exec(function(err, sites) {

        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        // get hidden field before parseing
        var hidden_str = parser.parseForVirts(req.params);

        // I need to prevent projections to do count
        delete req.params.allProperties;
        delete req.params.fields;
        delete req.params.sortAsc;
        delete req.params.sortDesc;

        count_query = parser.parseParams(req.params, SiteModel);
        count_query.limit(0).skip(0).count().exec(function(err, count) {

            if (err) {
                req.log.error(err);
                return responses.internalErrorReply(res, err);
            }

            if (isEmpty(sites, hidden_str)) {
                return responses.nothingFoundReply(res);
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
                extras.total_pages = Math.floor(count / extras.per_page);
            } else {
                // page NOT set, return limit/offset state
                extras.offset = parseInt(req.params.offset) || 0;
                extras.limit = limit;
                extras.total = count;
            }

            // var extras = {"length": length, "offset": off, "page": page, "total": count};

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

    SiteModel.findById(req.params[0], function(err, sites) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        if (!isOnlySite(sites)) {
            return responses.nothingFoundReply(res);
        }

        if (req.params.hist === 'true') {
            sites[0].history(0, 100, function(err, result) {
                responses.jsonReply(res, result);
            })

            return;
        } 
        responses.jsonReply(res, sites[0]);

    });

    return next();
}

function update(req, res, next) {
    req.log.info("PUT update facility REQUEST", {
        "req": req.params
    });

    var id = req.params[0];
    delete req.params[0];

    // parser wipes bad fields
    var success = parser.parseBody(req.params);

    if (!success && (Object.keys(req.params).length < 2)) {
        // No longer shutdown updates for having a few bad fields
        return responses.apiBadRequest(res,
            "Refer to API for allowed update fields.");
    }

    SiteModel.updateById(id, req.params, function(err, site) {
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
                if (err.code === 11000 && err.name !== "ValidationError") {
                    return responses.conflictReply(res, err);
                }

                return responses.internalErrorReply(res, err);
            }
            // respond with newly added site
            responses.jsonReply(res, site, 201);

        });

    });

    // return next();
}

function bulk(req, res, next) {
    req.log.info("POST add MULTIPLE facility REQUEST (from json)", {
        "req": req.params
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

    var num_inserted = 0;
    var num_failed = 0;
    var num_supplied = facilities.length;
    var errors = [];

    var batchOnly = req.params.allOrNothing;

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

        //XXX: Sort out way to detect id collisions?

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

        // handle special case of all data failing to validate
        if ((result.length === 0)
            // handle batch or not commit
            || (batchOnly === "true" && result.length !== num_supplied)) {
            var response = {
                "recieved": num_supplied,
                "inserted": 0,
                "failed": num_failed
            };

            // only return error's array when requested
            if (debug === "true") {
                response.errors = errors;
            }

            return responses.jsonReply(res, response, 200);
        }

        // At this point a subset of the data will be recorded
        var writeResult = bulkIns.execute(function(err, writeResult) {
            if (writeResult.hasWriteErrors()) {
                var writeErrors = writeResult.getWriteErrors();
                req.log.error(writeErrors);
                writeErrors.forEach(function(err) {
                    // handle id collisions seperatly, continue with regular
                    // output but record errors 
                    if (err.code === 11000) {
                        errors.push(err.toJSON());
                        //return responses.conflictReply(res, err);
                    } else {
                        // can't recover from this, let em know
                        return responses.internalErrorReply(res, err);
                    }
                });
            } 

            var num_inserted = writeResult.nInserted;
            var num_errd = writeResult.getWriteErrorCount();


            var response = {
                "recieved": num_supplied,
                "inserted": num_inserted,
                "failed": num_failed + num_errd
            };

            if (debug === "true") {
                response.errors = errors;
            }

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

    SiteModel.deleteById(id, function(err, nRemoved, writeStatus) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        if (nRemoved === 0) {
            return responses.nothingFoundReply(res);
        }

        responses.jsonReply(res, {
            "id": id,
            "message": "Resource deleted"
        });

    });

    return next();
}


function near(req, res, next) {
    req.log.info("GET near facility REQUEST", {
        "req": req.params
    });

    var lat = req.params.lat;
    var lng = req.params.lng;

    if (typeof lat === 'undefined' || typeof lng === 'undefined') {
        return responses.apiBadRequest(res, "TODO: This message is not used");
    }

    var rad = req.params.rad || 0;
    var units = req.params.units || 'km';

    var earthRad = 6371; // km
    if (units === 'mi') {
        earthRad = 3959;
    }

    if (isNaN(rad) || parseInt(rad) < 0 || isNaN(lng) || isNaN(lat)) {
        return responses.apiBadRequest(res, "TODO: This message is not used!");
    }

    // query obj 
    var nearQuery = SiteModel.findNear(lng, lat, rad, earthRad);

    // determine if we have any limits to add
    parser.genLimitQuery({
        "limit": req.params.limit,
        "offset": req.params.offset
    }, nearQuery);

    nearQuery.exec(function(err, sites) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        nearQuery.limit(0).skip(0).count().exec(function(err, count) {
            if (err) {
                req.log.error(err);
                return responses.internalErrorReply(res, err);
            }

            if (isEmpty(sites)) {
                return responses.nothingFoundReply(res);
            }

            var off = parseInt(req.params.offset) || 0;
            var extras = {
                "length": sites.length,
                "offset": off,
                "total": count
            };

            var responseBody = responseBuilder
                .buildResponse(sites, null, 'facilities', extras)
                .toObject();

            responses.jsonReply(res, responseBody, 200);


        });
    });

    return next();

}

function nearID(req, res, next) {
    req.log.info("GET near facility with id REQUEST", {
        "req": req.params
    });

    SiteModel.findById(req.params[0], function(err, sites) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        if (!isOnlySite(sites)) {
            return responses.nothingFoundReply(res);

        } else {
            var site = sites[0]; // should only be one
            req.params.lng = site.coordinates[0];
            req.params.lat = site.coordinates[1];
            return near(req, res, next);
        }
    });
}


function within(req, res, next) {
    req.log.info("GET within facility REQUEST", {
        "req": req.params
    });

    var slat = req.params.slat;
    var wlng = req.params.wlng;
    var nlat = req.params.nlat;
    var elng = req.params.elng;

    //TODO: Remove withinSector and just merge it with this func
    if (req.params.sector) {
        return withinSector(req, res, next);
    }

    if (isNaN(slat) || isNaN(wlng) || isNaN(elng) || isNaN(nlat)) {
        return responses.apiBadRequest(res, "TODO: This message is not used!");
    }

    var withinQuery = SiteModel.findWithin(slat, wlng, nlat, elng);

    // determine if we have any limits to add
    parser.genLimitQuery({
        "limit": req.params.limit,
        "offset": req.params.offset
    }, withinQuery);

    withinQuery.exec(function(err, sites) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        withinQuery.limit(0).skip(0).count().exec(function(err, count) {
            if (err) {
                req.log.error(err);
                return responses.internalErrorReply(res, err);
            }

            if (isEmpty(sites)) {
                return responses.nothingFoundReply(res);
            }

            var off = parseInt(req.params.offset) || 0;
            var extras = {
                "length": sites.length,
                "offset": off,
                "total": count
            };

            var responseBody = responseBuilder
                .buildResponse(sites, null, 'facilities', extras)
                .toObject();

            responses.jsonReply(res, responseBody, 200);


        });
    });

    return next();

}

function withinSector(req, res, next) {
    req.log.info("GET within sector facility REQUEST", {
        "req": req.params
    });

    var slat = req.params.slat;
    var wlng = req.params.wlng;
    var nlat = req.params.nlat;
    var elng = req.params.elng;
    var sector = req.params.sector;

    if (isNaN(slat) || isNaN(wlng) || isNaN(elng) || isNaN(nlat)) {
        responses.apiBadRequest(res, "TODO: This message is not used!");
        return;
    }

    var withinSectorQuery = SiteModel.findWithinSector(slat, wlng, nlat, elng, sector);

    // determine if we have any limits to add
    parser.genLimitQuery({
        "limit": req.params.limit,
        "offset": req.params.offset
    }, withinSectorQuery);

    withinSectorQuery.exec(function(err, sites) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }


        withinSectorQuery.limit(0).skip(0).count().exec(function(err, count) {
            if (err) {
                req.log.error(err);
                return responses.internalErrorReply(res, err);
            }

            if (isEmpty(sites)) {
                return responses.nothingFoundReply(res);
            }

            var off = parseInt(req.params.offset) || 0;
            var extras = {
                "length": sites.length,
                "offset": off,
                "total": count
            };

            var responseBody = responseBuilder
                .buildResponse(sites, null, 'facilities', extras)
                .toObject();

            responses.jsonReply(res, responseBody, 200);

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

exports.within = within;
exports.withinSector = withinSector;
exports.near = near;
exports.nearID = nearID;
exports.uploadPhoto = uploadPhoto;
