var assert = require('assert');
var request = require('supertest');
var should = require('should');
var db_controller = require('./../models/dbcontroller.js');

describe('API Routes', function(done) {
    var url = "http://localhost:3000/api/v0/";

    before(function(done) {
        //var db = db_controller.connect();
        done();
    });
    
    describe('#getFacilities', function(done) {
        it('should return 25 facilties', function(done) {
            request(url)
                .get("facilities.json")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.have.length(25);
                    done();
                });
        });

        it('should return 25 facilties starting from an offset', function(done) {
            assert(false);
        });

        it('should return max number of facilities', function(done) {
            assert(false);
        });
        
        it('should return facilities with name = "New York"', function(done) {
            assert(false);
        });
        
        it('should return facilities with only uuid, active, properties:sector' 
                + ' fields', function(done) {
            assert(false);
        });

        it('should return facilities with properties:sector = "health"', 
        function(done) {
            assert(false);
        });

        it('should return facilities with updatedAt > Jan 1 2013', function(done) {
            assert(false);
        });

        it('should return facilities with active=true', function(done) {
            assert(false);
        });

        it('should return facilities without their properties field', 
        function(done) {
            assert(false);
        });

        it('should return facilties sorted in ascending order by name', 
        function(done) {
            assert(false);
        });

        it('should return facilties sorted in descending order by name', 
        function(done) {
            assert(false);
        });

        it('should return facilties with name = "New York" OR name = "Toronto"',
        function(done) {
            assert(false);
        });

        // combo a few of them
        it('should return facilties sorted in descending order by uuid filtered'
                + ' by properties:sector = "health" and updatedAt > Jan 1 2013' 
                + ' with only  active,uuid,name,properties:sector fields', 
        function(done) {
            assert(false);
        });
  });

    describe('#getFacility', function(done) {
        it('should return one facilty', function(done) {
            assert(false);
        });
        it('should fail to find a facility with this id', function(done) {
            assert(false);
        });

    });

    describe('#updateFacility', function(done) {
        it('should update facility from name="New York" to name="Toronto"', 
        function(done) {
            assert(false);
        });
        it("should fail to update facility's createdAt field", function(done) {
            assert(false);
        });
        it('should fail to find any facilities with this id', function(done) {
            assert(false);
        });
        it('should fail to update facility with empty post', function(done) {
            assert(false);
        });
    });

    describe('#createFacility', function(done) {
        it('should create a facility with name="Toronto"', 
        function(done) {
            assert(false);
        });
        it('should fail to create a facility with createdAt field passed in', 
        function(done) {
            assert(false);
        });
        it('should fail to create empty facility', function(done) {
            assert(false);
        });
    });

    describe('#deleteFacility', function(done) {
        it('should delete the facility"', function(done) {
            assert(false);
        });
        it('should fail to delete the facility', function(done) {
            assert(false);
        });
    });
});
