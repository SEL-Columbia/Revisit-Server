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
    json_reply(res);
    console.log((database.names));
    res.end(JSON.stringify(database.names));
    return next();
}

// exports
exports.respond = respond
exports.names = names
