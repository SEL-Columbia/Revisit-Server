var assert = require('assert');
var db_controller = require('./../models/dbcontroller.js');

describe('API Extra Routes', function() {
    var url = "localhost:3000/api/v0/facilities";
    before(function(done) {
        //var db = db_controller.connect();
        done();
    });
    
    describe('#near', function() {
        it('should return facilties with 100km', function(done) {
            assert(false);
        });

        it('should return facilities within 100mi', function(done) {
            assert(false);
        });

        it('should return facilities within default 10mi', function(done) {
            assert(false);
        });
        
        it('should return no facilities within 0km', function(done) {
            assert(false);
        });
        
        it('should return no facilities', function(done) {
            assert(false);
        });
    });

    describe('#within', function() {
        it('should return facilties within box defined by x,y and x",y"', 
        function(done) {
            assert(false);
        });

        it('should return no facilties within box a,b and a,b (point)', 
        function(done) {
            assert(false);
        });

        it('should return no facilities', function(done) {
            assert(false);
        });
    });

    describe('#withinSector', function() {
        it('should return facilties within box x,y and x",y" and sector', 
        function(done) {
            assert(false);
        });

        it('should return no facilties within box a,b and a,b (point) and sec', 
        function(done) {
            assert(false);
        });

        it('should return no facilities', function(done) {
            assert(false);
        });
    });

    describe('#uploadPhoto', function() {
        it('should upload a photo to /public/sites/photos/$id/name and the url'
                + ' should be added to the facility', 
        function(done) {
            assert(false);
        });

        it('should upload a photo to /public/sites/photos/$id/name with the'
                + 'same name as previous entry and the url should NOT be added'
                + ' to the facility as it already exists', 
        function(done) {
            assert(false);
        });

        it('should upload a photo to /public/sites/photos/$id/name and the url'
                + ' should be added to the facility after creating the'
                + ' properties field for the facility which did not have one', 
        function(done) {
            assert(false);
        });

        it('should not find the facility and not store the uploaded photo', 
        function(done) {
            assert(false);
        });
    });
});
