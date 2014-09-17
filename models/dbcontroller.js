// dependancies 
var mongoose = require('mongoose');
var fs = require('fs');

// local deps
var SiteModel = require('./site.js').SiteModel;

// db 
var db_name = 'test';
mongoose.connect('mongodb://localhost/' + db_name);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection err:')); 
db.once('open', function callback() {
    console.log('Connected To Mongo Database');
    });

// users XXX: TEMP soloution, will put in db if neccassary
var user_conf = "./users.conf" 
var users = JSON.parse(fs.readFileSync(user_conf, "utf8"))
console.log(users);

var lookup = function(username, callback) {
    var err = false;
    pass = users[username];

    if (pass == null) {
       err = true;
    }

    callback(err, pass);
};

db.lookup = lookup;

// exports XXX: Intend to list all in use models here and then include this file
exports.SiteModel = SiteModel
exports.db = db;
