// dependencies
var restify = require('restify');

// local includes
var database = require('../core/db.js'),
    UserModel = require('../domain/model/user.js'),
    responses = require('../view/responses.js');

function addUser(req, res, next) {
    req.log.info("New user:", {"req": req.params}); //TODO: logging password??!?

    if (!req.params.username || !req.params.password) {
        return responses.apiBadRequest(res, 
            "Cannot create user:" + req.params.username);
    }

    // TODO: should role be configurable on creation? 
    UserModel.addUser(req.params.username, req.params.password, "simple",
        function(success) {
            if (!success) {
                req.log.error("Failed to create user");
                return responses.apiBadRequest(res, 
                        "Cannot create user:" + req.params.username);
            }

            //TODO: what is a proper json reply on success???
            responses.jsonReply(res, {"username": req.params.username, "created": true}, 201);
        });
    return next();
}

function login(req, res, next) {
    req.log.info("User:", {"req": req.params});
    UserModel.login(req.params.username, req.params.password,
        function(success) {
            req.log.error("Failed to login user");
            if (!success) {
                return responses.apiBadRequest(res, "username/password incorrect");
            } 

            responses.jsonReply(res, {"username": req.params.username, "login": true});
        });

    return next();
}

function getUsers(req, res, next) {
    req.log.info("Getting all Users");
    UserModel.getAllUsers(function(err, users) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        responses.jsonReply(res, {users: users, length: users.length});
    });
    
    return next();
}

function getUser(req, res, next) {
    req.log.info("Getting User:", {"req": req.params});
    req.params.username = req.params[0];
    if (!req.params.username)
        responses.apiBadRequest(res, "No username supplied.");

    UserModel.getUser(req.params.username, function(err, users) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        if (users !== null && users.length == 1) {
            user = users[0]; // should only be one
            responses.jsonReply(res, user);

        } else {
            responses.nothingFoundReply(res);
        }
    });

    return next();
}

// TODO:find endpoint for this guy: (need middle man function routing btwn the two)
function updateAndVerify(req, res, next) {
    req.log.info("Updating User pass/role:", {"req": req.params});

    req.params.username = req.params[0];
    var pass = req.params.password;
    var user = req.params.username;
    var role = req.params.role;
    var oldPass = req.params.oldPassword;

    // user must be there and either pass/oldpass or role must be there
    if (!user || (!(pass && oldPass) && !role) || !oldPass)
        return responses.apiBadRequest(res, "User update request malformed.");

    UserModel.login(user, oldPass, function(success) {
        if (!success) {
            return responses.apiBadRequest(res, "Login info malformed.");
        }

        UserModel.update(user, pass, role, function(err, user) {
            if (err) {
                req.log.error(err);
                return responses.internalErrorReply(res, err);
            }

            if (!user) {
                // User not found (not possible cause of login above would catch it)
                return responses.apiBadRequPassest(res, "Cannot login as user.");
            }

            responses.jsonReply(res, user);
        });
    });

    return next();
}

// super update, bypasses login requirement of above, not used currently
function updatePass(req, res, next) {
    req.log.info("Updating User pass:", {"req": req.params});

    req.params.username = req.params[0];
    var pass = req.params.password;
    var user = req.params.username;
    var role = req.params.role;

    if (!user || (!pass && !role))
        return responses.apiBadRequest(res, "User update request malformed.");

    UserModel.update(user, pass, role, function(err, user) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        // User not found, would not err out 
        if (!user) {
            return responses.apiBadRequest(res, "Login info malformed.");
        }

        responses.jsonReply(res, user);
    });

    return next();
}

function removeUser (req, res, next) {
    req.log.info("DEL on user", {"req": req.params});
    req.params.username = req.params[0];
    var username = req.params.username;

    UserModel.deleteByName(username, function(err, nRemoved, writeStatus) {
        if (err) {
            req.log.error(err);
            return responses.internalErrorReply(res, err);
        }

        if (nRemoved === 0) {
            return responses.nothingFoundReply(res);
        }
        
        responses.jsonReply(res, {"username": username, "deleted": true }); 

    });
}

exports.removeUser = removeUser;         
exports.addUser = addUser;
exports.login = login;
exports.getUser = getUser;
exports.getUsers = getUsers;
exports.updateAndVerify = updateAndVerify;
exports.updatePass = updatePass;
