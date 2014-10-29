// local includes
var replies = require('./../views/responses.js');
var dbcontroller = require('./../models/dbcontroller.js');
var conf = require('./../config/app/config.js');

function authenticate(req, res, next) {

    var any_user_path = new RegExp(conf.prePath + "/users.*$");
    function login(req, callback) {
        req.log.info("Basic auth verification", {
            "user": res.username,
            "auth": req.authorization
        });

        if (req.username === 'anonymous' || typeof req.authorization.basic === 'undefined') {
            req.log.info("Basic auth failed");
            callback(false, "No basic auth information provided"); 
            return;
        }

        dbcontroller.UserModel.login(req.username, 
                req.authorization.basic.password, 
                function(success, role) {
                    callback(success, "", role);
                } 
        );
    }

    // if auth is disabled, even user endpoints will be visible
    if (!conf.useAuth()) {
        return next();
    }

    // Branch for requests dealing with user endpoints
    if (conf.blockUsers() && any_user_path.test(req.url)) {
        login(req, function(logged, msg, role) {
            if(!logged) {
                req.log.info("User end point not auth'd");
                return replies.apiForbidden(res, req.username);
            }

            if(role !== "admin") {
                req.log.info("User end point not auth'd");
                return replies.apiForbidden(res, req.username);
            }

            return next();
        });

        return;
    }

    // Branch for level of authentication required
    if (conf.allowGet() && req.method === 'GET') {
        return next();
    }

    if (conf.allowPost() && req.method === 'POST') {
        return next();
    }

    if (conf.allowPut() && req.method === 'PUT') {
        return next();
    }

    // Delete should always be authenticated 
    login(req, function(logged, msg) {
        if (!logged) {
            req.log.info("Basic auth failed");
            return replies.apiUnauthorized(res, req.username, msg);
        }

        req.log.info("Basic auth passed");
        return next();

    });

}

exports.authenticate = authenticate;
