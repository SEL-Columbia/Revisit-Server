var http = require('http'),
    express = require('express'),
    mongoose = require('mongoose'),
    restify = require('express-restify-mongoose'),
    // Schema = mongoose.Schema,
    routes = require('./routes'),
    FacilityModel = require('./facility').FacilityModel;

mongoose.connect('mongodb://localhost/sel');

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


app.get('/populate', routes.populate);

app.get('/kenya', routes.kenya);

http.createServer(app).listen(3000, function() {
    console.log("Express server listening on port 3000");
});


/**

curl -X POST -H "Content-Type: application/json" -d '{"name":"Facility 1","type":"Health"}' http://localhost:3000/api/v1/Facilities

*/
