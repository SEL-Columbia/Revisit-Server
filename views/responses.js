// dependancies
var restify = require('restify');

// local includes
var log = require('./../log/logger.js').log;

// response_style
var jsonArrayReply = function(res, sites, code, hidden, extras) {
    code = code || 200;
    res.writeHead(code, {
        'Content-Type': 'application/json; charset=utf-8'});
    // Match the facreg representation of facilities 
    res.write('{"facilities":[');
    var len = sites.length;
    sites.forEach(function(site, ind) {
        res.write(JSON.stringify(site.toJSON({hide: hidden, transform: true})));
        if (ind != len - 1) {
            res.write(", ");
        }
    });

    if (extras) {
        res.write(', "length": ' + extras.length)
        res.write(', "offset": ' + extras.offset)
        res.write(', "total": ' + extras.total)
    }

    res.write(']}');
    res.end()
    log.info("JSON ARRAY reply sent", {"code": code});
}    

var jsonReply = function(res, site, code) {
    code = code || 200;
    res.writeHead(code, {
        'Content-Type': 'application/json; charset=utf-8'});
    res.write(JSON.stringify(site));
    res.end()
    log.info("JSON reply sent", {"code": code});
}    


// errors
var dbErrorReply = function(res, err) {
    res.send( new restify.RestError({
        statusCode: 500, 
        restCode: "Internal Server Error", 
        message: JSON.stringify(err)
    }));

    //log.info("DB ERROR reply sent", {"code": 500});
};

var apiBadRequest = function(res, data) {
    // data is unused
    res.send( new restify.RestError({
        statusCode: 400, 
        restCode: "Bad Request", 
        message: "Requested operation is not valid."
    }));
    
    //log.info("API BAD REQ reply sent", {"code": 400});
};

var apiUnauthorized = function(res, user) {
    // data is unused
    res.send( new restify.RestError({
        statusCode: 401, 
        restCode: "Unauthorized", 
        message: "User: " + user + ", not found or incorrect password."
    }));
    
    //log.info("API UNAUTH reply sent", {"code": 401});
};

var apiForbidden = function(res, user) {
    // data is unused
    res.send( new restify.RestError({
        statusCode: 403, 
        restCode: "Forbidden", 
        message: "User: " + user + ", does not have permissions for this request."
    }));
    
    //log.info("API FORBIDDEN reply sent", {"code": 403});
};

var dbEmptyReturn = function(res, data) {
    // data is unused
     res.send( new restify.RestError({
        statusCode: 404, 
        restCode: "Not Found",
        message: "Resource was not found."
    }));
    
     //log.info("DB EMPTY reply sent", {"code": 404});
};

// 405 Not allowed (ops that can never be done but are somehow exposed?)
// 409 Conflict (somehow causing collision in db or other conflicts?)

var dbMissingData = function(res, data) {
    // data is unused
     res.send( new restify.RestError({
        statusCode: 410, 
        restCode: "Gone", 
        message: "Resource has been removed"
    }));
    
     //log.info("DB MISSING DATA reply sent", {"code": 410});
};


// exports

exports.jsonReply = jsonReply;
exports.jsonArrayReply = jsonArrayReply;

// errors
exports.apiBadRequest = apiBadRequest;
exports.dbErrorReply = dbErrorReply;
exports.dbEmptyReturn = dbEmptyReturn;
exports.apiUnauthorized = apiUnauthorized;
exports.apiForbidden = apiForbidden;
exports.dbMissingData = dbMissingData;
