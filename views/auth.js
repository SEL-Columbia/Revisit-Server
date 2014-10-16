// dependancies
var restify = require('restify');

// local includes
var database = require('../models/dbcontroller.js');
var replies = require('./responses.js');


function addUser(req, res, next) {
    console.log("New user:", req.params);
    database.UserModel.addUser(req.params.user, req.params.pass,
        function(success) {
            console.log(">>> User created?: ", success);
            res.send("User Created? " + success);
        });

    return next();
}

function login(req, res, next) {
    console.log("User:", req.params);
    database.UserModel.login(req.params.user, req.params.pass,
        function(success) {
            //console.log(">>> User logged in?: ",  success);
            res.send("User logged in? " + success);
        });

    return next();
}

exports.addUser = addUser;
exports.login = login;
