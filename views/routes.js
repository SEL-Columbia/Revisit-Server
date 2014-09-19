var restify = require('restify')

// local includes
var database = require('../models/dbcontroller.js')
var parser = require('../controller/parser.js')
var replies = require('./responses.js');


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
            return replies.mongoErrorReply(res, err)
        }

        if (sites != null && sites.length > 0) {
            sites.forEach(function(site) {
                replies.editUUID(site)
            });
            replies.jsonReply(res, sites)
        } else {
            replies.mongoEmptyReturn(res)
        }

    });

    console.log(">>> Complete!");
    return next();
}

var site = function (req, res, next) {

    console.log("\n>>> Search for site with id: " + req.params[0]);

    database.SiteModel.findById(req.params[0], function(err, sites) {
        if (err) {
            return replies.mongoErrorReply(res, err)
        }

        if (sites != null && sites.length == 1) {
            site = sites[0]; // should only be one
            replies.editUUID(site);
            replies.jsonReply(res, sites);

        } else {
            // maybe handle the case where sites.length > 1 seperatly? 
            replies.mongoEmptyReturn(res)
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
        return next();
    }
    
    database.SiteModel.updateById(id, req.params, function(err, site) {
        if (err) {
            // findbyid raises an error when id is not found, diff then actual err
            return replies.mongoEmptyReturn(res, site)
        }

        replies.editUUID(site);
        replies.jsonReply(res, site)
    });

    console.log(">>> Complete!");
    return next();
}

var add = function ( req, res, next) {
    console.log("\n >>> Adding new site");
    console.log(req.params);

    var success = parser.parseBody(req.params);
    if (!success) {
        replies.apiBadRequest(res, success);
        return next();
    }

    req.params['uuid'] = "_id"; // any filler will do, cant be null though
    //req.params['href'] = "./api/v0/???.json" // gotta get uuid first ... this is a pain
    
    var site = new database.SiteModel(req.params);
    site.save(function(err, site) {
        if (err) {
            return replies.mongoErrorReply(res, err)
        }
        replies.editUUID(site);
        replies.jsonReply(res, site)
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
            return replies.mongoEmptyReturn(res, writeSet)
        }

        replies.jsonReply(res, {"_id": id, "message": "Resource deleted"})
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
