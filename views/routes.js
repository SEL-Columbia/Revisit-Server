// local includes
var database = require('../models/dbcontroller.js')

// response_style
function json_reply(res) {
    res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8'});
}    

// views
var respond = function (req, res, next) {
      res.send('hello ' + req.params.name);
      return next();
}

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

// exports
exports.respond = respond
exports.names = names
