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
    console.log(req.params);
    
    // parse query
    var site = {};

    site.allProperites = req.params.allProperties; // true or false 
    site.sortAsc = req.params.sortAsc; // sort asc by property
    site.sortDesc = req.params.sortDesc; // sort dsc by propery

    site.limit = req.params.limit; // int default 25 (can also be string off) 
    if (site.limit == null) {
        site.limit = 5; // should be 25
    } else if (site.limit == "off") {
        site.limit = -1;
    } 

    site.offset = req.params.offset; // int default 0
    if (site.offset == null) {
        site.offset = 0;
    } 

    site.fields = req.params.fields; // comma seperate list of fields with : lookup support

    console.log(site)
    database.SiteModel.findLimit( site.limit, site.offset,
        function(err, sites) {
            if (err) {
                return console.error(err)
            }

            console.log(">>> " + sites.length)
            //console.log(">>> " + "not dumping sheeit")
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
