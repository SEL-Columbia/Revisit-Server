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
        replies.apiBadRequest(res, success);
        return;
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

    var success = parser.parseBody(req.params);
    if (!success) {
        replies.apiBadRequest(res, success);
        return;
    }

    var site = new database.SiteModel(req.params);
    site.save(function(err, site) {
        if (err) {
            req.log.error(err);
            return replies.dbErrorReply(res, err);
        }

        replies.jsonReply(res, site, 201);

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
exports.del = del;

