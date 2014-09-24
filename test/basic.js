var assert = require('assert');
var db_controller = require('./../models/dbcontroller.js');

describe('API Routes', function() {
    var url = "localhost:3000/api/v0/facilities";
    before(function(done) {
        //var db = db_controller.connect();
        done();
    });
    
    describe('#getFacilities', function() {
        it('should return 25 facilties', function() {
            assert(false);
        });

        it('should return 25 facilties starting from an offset', function() {
            assert(false);
        });

        it('should return max number of facilities', function() {
            assert(false);
        });
        
        it('should return facilities with name = "New York"', function() {
            assert(false);
        });
        
        it('should return facilities with only uuid, active, properties:sector' 
                + ' fields', function() {
            assert(false);
        });

        it('should return facilities with properties:sector = "health"', 
        function() {
            assert(false);
        });

        it('should return facilities with updatedAt > Jan 1 2013', function() {
            assert(false);
        });

        it('should return facilities with active=true', function() {
            assert(false);
        });

        it('should return facilities without their properties field', 
        function() {
            assert(false);
        });

        it('should return facilties sorted in ascending order by name', 
        function() {
            assert(false);
        });

        it('should return facilties sorted in descending order by name', 
        function() {
            assert(false);
        });

        it('should return facilties with name = "New York" OR name = "Toronto"',
        function() {
            assert(false);
        });

        // combo a few of them
        it('should return facilties sorted in descending order by uuid filtered'
                + ' by properties:sector = "health" and updatedAt > Jan 1 2013' 
                + ' with only  active,uuid,name,properties:sector fields', 
        function() {
            assert(false);
        });
    });

    describe('#getFacility', function() {
        it('should return one facilties', function() {
            assert(false);
        });
        it('should fail to find a facility with this id', function() {
            assert(false);
        });

    });

    describe('#updateFacility', function() {
        it('should update facility from name="New York" to name="Toronto"', 
        function() {
            assert(false);
        });
        it('should fail to update facilitys createdAt field', function() {
            assert(false);
        });
        it('should fail to find any facilities with this id', function() {
            assert(false);
        });
        it('should fail to update facility with empty post', function() {
            assert(false);
        });
    });

    describe('#createFacility', function() {
        it('should create a facility with name="Toronto"', 
        function() {
            assert(false);
        });
        it('should fail to create a facility with createdAt field passed in', 
        function() {
            assert(false);
        });
        it('should fail to create empty facility', function() {
            assert(false);
        });
    });

    describe('#deleteFacility', function() {
        it('should delete the facility"', function() {
            assert(false);
        });
        it('should fail to delete the facility', function() {
            assert(false);
        });
    });
});
