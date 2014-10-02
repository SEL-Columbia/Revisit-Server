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
    //log.debug("\n>>> Finding all sites params", req.params);
    req.log.info("GET all facilities REQUEST", {"req": req.params});
    
    // parse query

    // virt fields must be handled seperatly 
    var hidden = {};
    query = parser.parseParams(req.params, database.SiteModel, hidden);
    var hidden_str = Object.keys(hidden).join(',');

    query.exec(function(err, sites) {
        //log.info("GET all facilities REPLY", {"site": sites, "err": err})
        if (err) {
            //log.error(err);
            return replies.dbErrorReply(res, err);
        }

        if (sites !== null && sites.length > 0) {
            // check if a site is empty in JSON form (it can never be empty otherwise
            var a_site = JSON.stringify(sites[0].toJSON({ hide: hidden_str, transform: true}));
            if (a_site !== "{}") { 
                replies.jsonArrayReply(res, sites, 200, hidden_str)
            } else {
                replies.dbEmptyReturn(res)
            }
        } else {
            replies.dbEmptyReturn(res);
        }

    });

    //log.debug(">>> Complete!");
    return next();
};

var site = function (req, res, next) {
    //log.debug("\n>>> Search for site with id: " + req.params[0]);
    req.log.info("GET a facility REQUEST", {"req": req.params});

    database.SiteModel.findById(req.params[0], function(err, sites) {
        //log.info("GET a facility REPLY", {"site": sites, "err": err})
        if (err) {
            req.log.error(err);
            return replies.dbErrorReply(res, err);
        }

        if (sites !== null && sites.length == 1) {
            site = sites[0]; // should only be one
            replies.jsonReply(res, site);

        } else {
            // maybe handle the case where sites.length > 1 seperatly? 
            replies.dbEmptyReturn(res);
        }

    });

    //log.debug(">>> Complete!");
    return next();
};

var update = function (req, res, next) {

    req.log.info("PUT update facility REQUEST", {"req": req.params});

    var id = req.params[0];
    //log.debug("\n>>> Updating site with id: " + id, req.params);
    delete req.params[0];

    var success = parser.parseBody(req.params);
    //log.debug(">>> parsed:", req.params)
    if (!success) {
        replies.apiBadRequest(res, success);
        return;
    }
    
    database.SiteModel.updateById(id, req.params, function(err, site) {
        //log.info("PUT update facility REPLY", {"site": site, "err": err})
        if (err) {
            // findbyid raises an error when id is not found, diff then actual err
            req.log.error(err);
            return replies.dbEmptyReturn(res, site);
        }

        replies.jsonReply(res, site);
    });

    //log.debug(">>> Complete!");
    return next();
};

var add = function ( req, res, next) {
    
    req.log.info("POST add facility REQUEST", {"req": req.params});
    //log.debug("\n >>> Adding new site");
    //log.debug(req.params);

    var success = parser.parseBody(req.params);
    if (!success) {
        replies.apiBadRequest(res, success);
        return;
    }

    var site = new database.SiteModel(req.params);
    site.save(function(err, site) {
        //log.info("POST add facility REPLY", {"site": site, "err": err})
        if (err) {
            req.log.error(err);
            return replies.dbErrorReply(res, err);
        }

        replies.jsonReply(res, site, 201);

        });

    //log.debug(">>> Complete!");
    return next();
};

var del = function (req, res, next) {

    req.log.info("DEL delete facility REQUEST", {"req": req.params});
    var id = req.params[0];
    //log.debug("\n>>> Deleting site with id: " + id);

    database.SiteModel.deleteById(id, function(err, nRemoved, writeStatus) {
        //log.info("DEL delete facility REPLY", {"site": writeSet, "err": err})
        if (err) {
            req.log.error(err);
            return replies.dbErrorReply(res, err);
        }


        if (nRemoved === 0) {
            return replies.dbEmptyReturn(res);
        }
        
        replies.jsonReply(res, {"id": id, "message": "Resource deleted"});

    });

    //log.debug(">>> Complete!");
    return next();
};

// exports
exports.respond = respond;
exports.sites = sites;
exports.site = site;
exports.update = update ;
exports.add = add;
exports.del = del;

