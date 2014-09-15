var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var NamesModel = new Schema({
    name: {
        type: String,
        required: true
    }
});

NamesModel.statics.findAll = function(callback) {
    return this.find({}, callback);
};

exports.NamesModel = mongoose.model('NamesModel', NamesModel, 'testData');
