// dependancies
var mongoose = require('mongoose');
var SHA2 = new (require('jshashes').SHA512)()

var Schema = mongoose.Schema;
var UserModel = new Schema({
        username: {
            type: String,
            index: {
                    unique: true
            },
            required: true
        },
        
        password: {
            type: String,
            required: true
        },

        salt: {
            type: String,
            required: true
        }
    } 
);

var genHash = function(pass, salt) {
    return SHA2.b64_hmac(pass, salt);
}

var genSalt = function() {
    // random str generator
    return "4"
}

UserModel.statics.login = function(username, pass, callback) {
    if (username && pass) {
        console.log(">>> Trying:", username, pass)
        this.findOne({"username": username}).exec(function(err, user) {
            //console.log("Querying:", user);
            if (err || !user) {
                console.log("User not found");
                callback(false);
                return;
            }

            var salt = user.salt;
            var hashed = user.password;
            var new_hash = genHash(pass, salt);
            console.log("Found: hash,salt,new", hashed, salt, new_hash);

            if (hashed != new_hash) {
                console.log("Incorrect password");
                callback(false);
                return;
            }

            console.log("Success!");
            callback(true);
            return;
        }); 

        return;
    }

    console.log("fields empty");
    callback(false);
    return;
}

UserModel.statics.addUser = function(username, pass, callback) {
    console.log("Adding User:", username)
    var salt = genSalt();
    var hash = genHash(pass, salt);
    console.log(hash, salt);
    var userObj = new this({username: username, password: hash, salt: salt});
    userObj.save(function(err, user) {
        if (err) {
            console.log(err);
            callback(false);
            return;
        } 
        console.log(user);
        console.log("Success!");
        callback(true);
    });

    return;
}

exports.UserModel = mongoose.model('UserModel', UserModel, 'authentication');
