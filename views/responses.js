// dependancies
var restify = require('restify')

// new restify.InvalidArgumentError(JSON.stringify(err.errors));
// new restify.RestError({statusCode: 400, restCode: "Not Implemented", message: "Flag method not yet implemented."});


// response_style
var jsonReply = function(res, json) {
    // TODO: parse the id fields out in the string?
    res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8'});
    res.write(JSON.stringify(json))
    res.end()
}    

var editUUID = function(site) {
    if (!site.uuid) {
        return;
    }
    site.uuid = site._id;
    site._id = null;
    delete site._id; // for w.e reason this doesnt work
}

// errors
var mongoErrorReply = function(res, err) {
    res.send(404, 'Mongo Error:', JSON.stringify(err))
}

var mongoEmptyReturn = function(res, data) {
    res.send(404, 'Resource Not Found')
}

var apiBadRequest = function(res, data) {
    res.send(400, 'Bad Request');
}

// exports
exports.jsonReply = jsonReply

exports.editUUID = editUUID

exports.apiBadRequest = apiBadRequest
exports.mongoErrorReply = mongoErrorReply
exports.mongoEmptyReturn = mongoEmptyReturn
