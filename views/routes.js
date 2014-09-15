// local includes
var database = require('../models/dbcontroller.js')

// response_style
function json_reply(res) {
    res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8'});
}    


// views

// echo
var respond = function (req, res, next) {
      res.send('hello ' + req.params.name);
      return next();
}

// list testdb
var names = function (req, res, next) {
    database.NamesModel.findAll( function(err, names) {
        if (err) {
            return console.error(err)
        }

        console.log(">>> " + names)
        json_reply(res)
        res.write(JSON.stringify(names))
        res.end()
    });
    return next();
}

var sites = function (req, res, next) {
    database.SiteModel.findAll( function(err, sites) {
        if (err) {
            return console.error(err)
        }

        console.log(">>> " + sites)
        json_reply(res)
        res.write(JSON.stringify(sites))
        res.end()
    });

    return next();
}

// exports
exports.respond = respond
exports.names = names
exports.sites = sites
