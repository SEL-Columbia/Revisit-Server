// dependencies
var mongoose = require('mongoose'),
    auth = require('../../util/util.js').auth,
    log = require('../../core/logger.js').log;

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
        },

        role: {
            type: String,
            default: "simple"
        }
    },
    
    { id: false }
);

UserModel.set('toJSON', {
    transform: function(doc, ret, options) {
        delete ret._id;
        delete ret.__v;
    }
});

UserModel.statics.login = function(username, pass, callback) {
    if (username && pass) {
        this.findOne({
            "username": username
        }).exec(function(err, user) {
            //console.log("Querying:", user);
            if (err || !user) {
                callback(false, "");
                return;
            }

            var salt = user.salt;
            var hashed = user.password;
            var new_hash = auth.genHash(pass, salt);

            if (hashed != new_hash) {
                callback(false, "");
                return;
            }

            callback(true, user.role);
            return;
        });

        return;
    }

    callback(false, "");
    return;
};

UserModel.statics.update = function(username, pass, role, callback) {
    // should verify that the requester can login as username before this is called

    var update = {};
    if (pass) {
        update.salt = auth.genSalt();
        update.password  = auth.genHash(pass, update.salt);
    }

    if (role) {
        update.role = role;
    }
    return this.findOneAndUpdate(
        {'username': username},
        update,
        { new : true }, 
        callback
    );

};

UserModel.statics.addUser = function(username, pass, role, callback) {
    var salt = auth.genSalt();
    var hash = auth.genHash(pass, salt);
    var userObj = new this({
        username: username,
        password: hash,
        role: role,
        salt: salt
    });

    userObj.save(function(err, user) {
        if (err) {
            callback(false);
            return;
        }
        callback(true);
    });

    return;
};

UserModel.statics.getAllUsers = function(callback) {
    //TODO: Hide salt/pass always?
    return this.find({}, callback);
};

UserModel.statics.getUser = function(username, callback) {
    return this.find({"username": username}, callback);
};

UserModel.statics.deleteByName = function(username, callback) {
    return this.remove({"username": username }).exec(callback);
};

// Avoid recompilation
var UserModel;
if (mongoose.models.UserModel) {
    UserModel = mongoose.model('UserModel');
} else {
    UserModel = mongoose.model('UserModel', UserModel, 'authentication');
}

module.exports = UserModel;
