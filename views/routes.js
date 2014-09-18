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

    query.exec(
        function(err, sites) {
            if (err) {
                replies.mongoErrorReply(res, err)
            } else {
                replies.jsonReply(res, sites)
            }
    });

    console.log(">>> Complete!");
    return next();
}

var site = function (req, res, next) {

    console.log("\n>>> Search for site with id: " + req.params[0]);

    database.SiteModel.findById(req.params[0], function(err, site) {
        if (err) {
            return mongoErrorReply(res, err)
        }

        if (site != null && site.length > 0) {
            replies.jsonReply(res, site)
        } else {
            replies.mongoEmptyReturn(res)
        }

    });

    console.log(">>> Complete!");
    return next()
}

var update = function (req, res, next) {
    console.log("\n>>> Updating site with id: " + req.params[0]);

    parser.parseBody(req.body);
    if (!body) {
        replies.apiBadRequest();
        return next();
    }
    
    database.SiteModel.updateById(req.params[0], req.body, function(err, site) {
        if (err) {
            return mongoErrorReply(res, err)
        }
        if (site != null && site.length > 0) {
            // TODO: both the url and the object should be returned
            replies.jsonReply(res, site)
        } else {
            replies.mongoEmptyReturn(res)
        }

    });
}
// exports
exports.respond = respond
exports.sites = sites
exports.site = site
