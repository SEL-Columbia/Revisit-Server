var restify = require('restify')

// local includes
var database = require('../models/dbcontroller.js')
var parser = require('../controller/parser.js')
var replies = require('./responses.js');

// TODO: Not defined here
var site_prefix = "localhost:3000/api/v0/facilities/"

// echo
var respond = function (req, res, next) {
      res.send('hello ' + req.params.name);
      return next();
}

// views
var sites = function (req, res, next) {
    console.log("\n>>> Finding all sites params", req.params);
    
    // parse query
    query = parser.parseParams(req.params, database.SiteModel)

    query.exec(function(err, sites) {
        if (err) {
            return replies.dbErrorReply(res, err)
        }

        if (sites != null && sites.length > 0) {
            sites.forEach(function(site) {
                replies.editUUID(site)
            });
            replies.jsonReply(res, sites)
        } else {
            replies.dbEmptyReturn(res)
        }

    });

    console.log(">>> Complete!");
    return next();
}

var site = function (req, res, next) {

    console.log("\n>>> Search for site with id: " + req.params[0]);

    database.SiteModel.findById(req.params[0], function(err, sites) {
        if (err) {
            return replies.dbErrorReply(res, err)
        }

        if (sites != null && sites.length == 1) {
            site = sites[0]; // should only be one
            replies.editUUID(site);
            replies.jsonReply(res, sites);

        } else {
            // maybe handle the case where sites.length > 1 seperatly? 
            replies.dbEmptyReturn(res)
        }

    });

    console.log(">>> Complete!");
    return next();
}

var update = function (req, res, next) {
    var id = req.params[0];
    console.log("\n>>> Updating site with id: " + id);
    delete req.params[0];
    console.log(req.params);

    var success = parser.parseBody(req.params);
    console.log(">>> parsed:", req.params)
    if (!success) {
        replies.apiBadRequest(res, success);
        return;
    }
    
    database.SiteModel.updateById(id, req.params, function(err, site) {
        if (err) {
            // findbyid raises an error when id is not found, diff then actual err
            return replies.dbEmptyReturn(res, site)
        }

        replies.editUUID(site);
        replies.jsonReply(res, site)
    });

    console.log(">>> Complete!");
    return next();
}

// Not exposed
// Update without blacklisting certain fields (i.e href can changed)
var internal_update = function (id, params, res) {

    database.SiteModel.updateById(id, params, function(err, site) {
        if (err) {
            // findbyid raises an error when id is not found, diff then actual err
            console.log(">>> Could not update newly added site?");
            return replies.dbErrorReply(res, err)
        }

        site.href = params["href"]
        replies.editUUID(site);
        replies.jsonReply(res, site, 201)

    })
}

var add = function ( req, res, next) {
    console.log("\n >>> Adding new site");
    console.log(req.params);

    var success = parser.parseBody(req.params);
    if (!success) {
        replies.apiBadRequest(res, success);
        return;
    }

    req.params['uuid'] = "temp"; // any filler will do, cant be null though
    
    var site = new database.SiteModel(req.params);
    site.save(function(err, site) {
        if (err) {
            return replies.dbErrorReply(res, err)
        }

        // record the _id and hide the version number
        var params = {};
        params.uuid = site._id;
        params.href = "http://" + site_prefix + params["uuid"] + ".json"; 

        console.log(">>>", params)
        internal_update(params["uuid"], params, res);

        });

    console.log(">>> Complete!");
    return next();
}

var del = function (req, res, next) {
    var id = req.params[0];
    console.log("\n>>> Deleting site with id: " + id);
    database.SiteModel.deleteById(id, function(err, writeSet) {
        if (err) {
            // findbyid raises an error when id is not found, diff then actual err
            return replies.dbEmptyReturn(res, writeSet)
        }

        replies.jsonReply(res, {"id": id, "message": "Resource deleted"})
    });

    console.log(">>> Complete!");
    return next();
}

// exports
exports.respond = respond
exports.sites = sites
exports.site = site
exports.update = update 
exports.add = add
exports.del = del

