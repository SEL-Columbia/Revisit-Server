// dependancies 
var mongoose = require('mongoose');
var fs = require('fs');

// local deps
var SiteModel = require('./site.js').SiteModel;
var UserModel = require('./user.js').UserModel;

// db 
var connect = function(db_loc) {
    var db_location = 'localhost';
    mongoose.connect('mongodb://' + db_location);
    
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection err:')); 
    db.once('open', function() {
        console.log('Connected To Mongo Database');
    });

    db.user = UserModel;

    return db;
}

// Refer to user.js for new login method

// login from conf file
//var user_conf = __dirname + "/../users.conf" 
//var users = JSON.parse(fs.readFileSync(user_conf, "utf8"))
//console.log(users);

//var lookup = function(username, callback) {
//    var err = false;
//    pass = users[username];
//
//    if (pass == null) {
//       err = true;
//    }
//
//    callback(err, pass);
//};

//db.lookup = lookup;


exports.SiteModel = SiteModel;
exports.UserModel = UserModel;
exports.connect = connect;
