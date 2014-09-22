// dependancies
var restify = require('restify')

// response_style
var jsonReply = function(res, json, code) {
    // TODO: parse the id fields out in the string?
    code = code || 200;
    res.writeHead(code, {
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
var dbErrorReply = function(res, err) {
    res.send( new restify.RestError({
        statusCode: 500, 
        restCode: "Database Error", 
        message: JSON.stringify(err)
    }));
}

var apiBadRequest = function(res, data) {
    // data is unused
    res.send( new restify.RestError({
        statusCode: 400, 
        restCode: "Bad Request", 
        message: "Requested operation is not valid."
    }));
}

var apiUnauthorized = function(res, user) {
    // data is unused
    res.send( new restify.RestError({
        statusCode: 401, 
        restCode: "Unauthorized", 
        message: "User: " + user + ", not found or incorrect password."
    }));
}

var apiForbidden = function(res, user) {
    // data is unused
    res.send( new restify.RestError({
        statusCode: 403, 
        restCode: "Forbidden", 
        message: "User: " + user + ", does not have permissions for this request."
    }));
}

var dbEmptyReturn = function(res, data) {
    // data is unused
     res.send( new restify.RestError({
        statusCode: 404, 
        restCode: "Not Found", 
        message: "Resource was not found."
    }));
}

// 405 Not allowed (ops that can never be done but are somehow exposed?)
// 409 Conflict (somehow causing collision in db or other conflicts?)

var dbMissingData = function(res, data) {
    // data is unused
     res.send( new restify.RestError({
        statusCode: 410, 
        restCode: "Gone", 
        message: "Resource has been removed"
    }));
}


// exports
exports.jsonReply = jsonReply

exports.editUUID = editUUID

exports.apiBadRequest = apiBadRequest
exports.dbErrorReply = dbErrorReply
exports.dbEmptyReturn = dbEmptyReturn
exports.apiUnauthorized = apiUnauthorized
exports.apiForbidden = apiForbidden
exports.dbMissingData = dbMissingData
