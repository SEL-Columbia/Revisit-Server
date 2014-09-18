// dependancies
var restify = require('restify')

// response_style
var jsonReply = function(res, json) {
    res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8'});
    res.write(JSON.stringify(json))
    res.end()
}    

var mongoErrorReply = function(res, err) {
    res.send(404, 'Mongo Error:', err.errors)
}

var mongoEmptyReturn = function(res, data) {
    res.send(404, 'Resource Not Found')
}

var apiBadRequest = function(res, data) {
    res.send(400, 'Bad Request');
}

// exports
exports.jsonReply = jsonReply
exports.apiBadRequest = apiBadRequest
exports.mongoErrorReply = mongoErrorReply
exports.mongoEmptyReturn = mongoEmptyReturn
