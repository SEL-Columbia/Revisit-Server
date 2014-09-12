//dependancies
//var mongojs = require('mongojs');
var mongoose = require('mongoose');

// db 
var db_name = 'test';
var db_cols = ['testData'];
mongoose.connect('mongodb://localhost/sel');
//var db = mongojs(db_name, db_cols);

var names = function() {
}

// exports
exports.names = names




