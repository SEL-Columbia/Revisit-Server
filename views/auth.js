// dependancies
var restify = require('restify');

// local includes
var database = require('../models/dbcontroller.js');
var replies = require('./responses.js');

//TODO: NONE OF THESE ENDPOINTS SHOULD BE ALLOWED WITHOUT BEING AUTHORIZED!!!

function addUser(req, res, next) {
    console.log("New user:", req.params);
    database.UserModel.addUser(req.params.username, req.params.password,
        function(success) {
            console.log(">>> User created?: ", success);
            res.send("User Created? " + success);
        });

    return next();
}

function login(req, res, next) {
    console.log("User:", req.params);
    database.UserModel.login(req.params.username, req.params.password,
        function(success) {
            //console.log(">>> User logged in?: ",  success);
            if (!success) {
                return replies.apiBadRequest(res, "Something about password");
            } 

            res.send(req.params.username + " logged succesfully");
        });

    return next();
}

function getUsers(req, res, next) {
    console.log("Getting all Users");
    database.UserModel.getAllUsers(function(err, users) {
        if (err) {
            req.log.error(err);
            return replies.dbErrorReply(res, err);
        }

        replies.jsonReply(res, users)
    });
    
    return next();
}

function getUser(req, res, next) {
    console.log("Getting User:", req.params);
    if (!req.params.username)
        replies.apiBadRequest(res, "Not using this string yet");

    database.UserModel.getUser(req.params.username, function(err, users) {
        if (err) {
            req.log.error(err);
            return replies.dbErrorReply(res, err);
        }

        if (users !== null && users.length == 1) {
            user = users[0]; // should only be one
            replies.jsonReply(res, user);

        } else {
            replies.dbEmptyReturn(res);
        }
    });

    return next();
}

function updateAndVerify(req, res, next) {
    console.log("Updating User pass/role:", req.params);

    var pass = req.params.password;
    var user = req.params.username;
    var oldPass = req.params.oldPassword;

    if (!user || !pass || !oldPass)
        replies.apiBadRequest(res, "Not using this string yet");

    database.UserModel.login(user, oldPass, function(success) {
        if (!success) {
            return replies.apiBadRequest(res, "Something about password");
        }

        database.UserModel.updatePassword(user, pass, function(err, user) {

            if (err) {
                req.log.error(err);
                return replies.dbErrorReply(res, err);
            }

            if (!user) {
                // User not found (not possible cause of login above would catch it)
                return replies.apiBadRequest(res, "Not using this string yet");
            }

            replies.jsonReply(res, user);
        });

    });

    return next();
}

function updatePass(req, res, next) {
    console.log("Updating User pass:", req.params);

    var pass = req.params.password;
    var user = req.params.username;
    var oldPass = req.params.oldPassword;

    if (!user || !pass || !oldPass)
        replies.apiBadRequest(res, "Not using this string yet");

    database.UserModel.updatePassword(user, pass, function(err, user) {

        if (err) {
            req.log.error(err);
            return replies.dbErrorReply(res, err);
        }

        // User not found, would not err out 
        if (!user) {
            return replies.apiBadRequest(res, "Not using this string yet");
        }

        replies.jsonReply(res, user);
    });

    return next();
}

exports.addUser = addUser;
exports.login = login;
exports.getUser = getUser;
exports.getUsers = getUsers;
exports.updateAndVerify = updateAndVerify;
exports.updatePass = updatePass;
