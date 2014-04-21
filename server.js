var http = require('http');
var express = require('express');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restify = require('express-restify-mongoose')

mongoose.connect('mongodb://localhost/sel');

var Facility = new Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    location: {
        lat: Number,
        lng: Number
    },
    checkins: Number
});
var FacilityModel = mongoose.model('Facility', Facility);


var app = express();

function cors(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
};

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    restify.serve(app, FacilityModel, {middleware: cors});
});


app.get('/populate', function(req, res, next) {
    var facs = [];
    for (var i = 0; i < 100; i++) {
        // 40.809, -73.9597
        var lat = 40.8 + 0.1*(Math.random() - Math.random()),
            lng = -73.9 +  0.1*(Math.random() - Math.random());
        facs[i] = new FacilityModel({
            "name": "Facility " + i,
            "type": "Health",
            "location": {
                "lat": lat,
                "lng": lng
            },
            "checkins": Math.floor(Math.random()*100)
        }).save();
    };
    res.send("Populated.");
});

http.createServer(app).listen(3000, function() {
    console.log("Express server listening on port 3000");
});


/**

curl -X POST -H "Content-Type: application/json" -d '{"name":"Facility 1","type":"Health"}' http://localhost:3000/api/v1/Facilities

*/
