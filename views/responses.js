// dependancies
var restify = require('restify');

// local includes
var log = require('./../log/logger.js').log;

// response_style
var jsonReply = function(res, site, code) {
    code = code || 200;
    res.writeHead(code, {
        'Content-Type': 'application/json; charset=utf-8'});
    res.write(JSON.stringify(site));
    res.end();
    
    //log.info("JSON reply sent", {"code": code});
}    


// errors
var internalErrorReply = function(res, err) {
    res.send( new restify.RestError({
        statusCode: 500, 
        restCode: "500 Internal Server Error", 
        message: JSON.stringify(err)
    }));

    //log.info("DB ERROR reply sent", {"code": 500});
};

var apiBadRequest = function(res, data) {
    var msg = data || "Requested operation is not valid."
    res.send( new restify.RestError({
        statusCode: 400, 
        restCode: "400 Bad Request", 
        message:  msg
    }));
    
    //log.info("API BAD REQ reply sent", {"code": 400});
};

var apiUnauthorized = function(res, user, data) {
    var msg = data || "User: " + user + ", not found or incorrect password.";
    res.send( new restify.RestError({
        statusCode: 401, 
        restCode: "401 Unauthorized", 
        message: msg 
    }));
    
    //log.info("API UNAUTH reply sent", {"code": 401});
};

var apiForbidden = function(res, user, data) {
    var msg = data ||  "User: " + user + 
        ", does not have permissions for this request.";
    res.send( new restify.RestError({
        statusCode: 403, 
        restCode: "403 Forbidden", 
        message: msg
    }));
    
    //log.info("API FORBIDDEN reply sent", {"code": 403});
};

var dbEmptyReturn = function(res, data) {
    var msg = data || "Resource was not found.";
    res.send( new restify.RestError({
        statusCode: 404, 
        restCode: "404 Not Found",
        message: msg
    }));
    
     //log.info("DB EMPTY reply sent", {"code": 404});
};


var apiNotAllowed = function(res, data) {
    var msg = data || "Operation not allowed on this resource.";
    res.send( new restify.RestError({
        statusCode: 405, 
        restCode: "405 Not Allowed",
        message: msg
    }));
    
     //log.info("NOT ALLOWED reply sent", {"code": 405});
};


// 409 Conflict (somehow causing collision in db or other conflicts?)

var dbMissingData = function(res, data) {
    // data is unused
    var msg = data || "Resource has been removed";
    res.send( new restify.RestError({
        statusCode: 410, 
        restCode: "410 Gone", 
        message: msg 
    }));
    
     //log.info("DB MISSING DATA reply sent", {"code": 410});
};


// exports
exports.jsonReply = jsonReply;

// errors
exports.apiBadRequest = apiBadRequest;
exports.internalErrorReply = internalErrorReply;
exports.dbEmptyReturn = dbEmptyReturn;
exports.apiUnauthorized = apiUnauthorized;
exports.apiForbidden = apiForbidden;
exports.dbMissingData = dbMissingData;
