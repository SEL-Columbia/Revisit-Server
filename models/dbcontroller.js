// dependancies 
var mongoose = require('mongoose');

// local deps
var SiteModel = require('./site.js').SiteModel;
var UserModel = require('./user.js').UserModel;

// db 
var connect = function(db_loc) {
    var db_location = db_loc || 'localhost/sel';
    mongoose.connect('mongodb://' + db_location);
    
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection err:')); 
    db.once('open', function() {
        console.log('Connected To Mongo Database at '+'mongodb://'+db_location);
    });

    db.user = UserModel;

    return db;
}

exports.SiteModel = SiteModel;
exports.UserModel = UserModel;
exports.connect = connect;
