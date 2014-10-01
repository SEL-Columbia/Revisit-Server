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

                    res.body.facilities.should.have.length(25);
                    done();
                });
        });

        it('should return 25 facilties starting from an offset',function(done) {
            request(url)
                .get("facilities.json?offset=0")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    var first_set = res.body;
                    first_set.facilities.should.have.length(25);
                    request(url)
                        .get("facilities.json?offset=25")
                        .expect('Content-Type', /json/)
                        .expect(200) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }
                            res.body.facilities.should.have.length(25);
                            // just checks if overlaps fully
                            res.body.facilities.should.not.containDeep(first_set.facilities);
                            //res.body.facilities.should.not.match(
                            //    function(it) {
                            //        return first_set.facilities.indexOf(it) > -1
                            //    });
                            done();
                        });
                });
        });

        it('should return max number of facilities', function(done) {
            request(url)
                .get("facilities.json?limit=off")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                   res.body.facilities.length.should.be.above(25);
                   done();
                });

        });
        
        it('should return facilities with name = Brooklyn Hospital Center', function(done) {
            request(url)
                .get("facilities.json?name=Brooklyn Hospital Center")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                   res.body.facilities.forEach(
                        function(facility) {
                            facility.should.have.property('name', 
                                    'Brooklyn Hospital Center');
                        });
                   done();
                });
        });
        
        it('should return facilities with only uuid, active, properties:sector' 
                + ' fields', function(done) {

            request(url)
                .get("facilities.json?fields=uuid,active,properties:sector")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                   // Not very readable ...
                   res.body.facilities.forEach(
                        function(facility) {
                            fac_keys = Object.keys(facility);
                            prop_keys = Object.keys(facility.properties);

                            fac_keys.should.be.equal = ['uuid', 'active', 'properties'];
                            prop_keys.should.be.equal = ['sector'];

                        });
                   done();
                });
        });

        it('should return facilities with properties:sector = "health"', 
        function(done) {
            request(url)
                .get("facilities.json?properties:sector=health")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                   res.body.facilities.forEach(
                        function(facility) {
                            facility.properties.should.have.property('sector', 'health');
                        });
                   done();
                });
        });

        it('should return facilities with updatedAt > Jan 1 2013', function(done) {
            request(url)
                .get("facilities.json?updatedSince=Jan 1 2013")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                   var minDate = new Date(2013, 0, 1);
                   res.body.facilities.forEach(
                        function(facility) {
                            (new Date(facility.updatedAt)).should.be.above(minDate);
                            //fac_date.should.be.above(minDate);
                        });
                   done();
                });
        });

        it('should return facilities with active=true', function(done) {
            request(url)
                .get("facilities.json?active=true")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                   res.body.facilities.forEach(
                        function(facility) {
                            facility.should.have.property('active', true);
                        });

                   done();
                });


        });

        it('should return facilities without their properties field', 
        function(done) {
            request(url)
                .get("facilities.json?allProperties=false")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                   res.body.facilities.forEach(
                        function(facility) {
                            facility.should.not.have.property('properties');
                        });

                   done();
                });
        });

        it('should return facilties sorted in ascending order by name', 
        function(done) {
            request(url)
                .get("facilities.json?fields=name&sortAsc=name")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    
                    var facilities = JSON.parse(JSON.stringify(res.body.facilities));
                    facilities.sort(function(a,b){
                       if (a.name < b.name) 
                           return -1;
                       if (a.name > b.name) 
                           return 1;

                       return 0;
                    });

                    res.body.facilities.should.containDeep(facilities);
                    done();
                });
        });

        it('should return facilties sorted in descending order by name', 
        function(done) {
            request(url)
                .get("facilities.json?fields=name&sortDesc=name")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    
                    var revfac = JSON.parse(JSON.stringify(res.body.facilities));
                    revfac.sort(function(a,b){
                       if (a.name > b.name) 
                           return -1;
                       if (a.name < b.name) 
                           return 1;

                       return 0;
                    });

                    res.body.facilities.should.containDeep(revfac);
                    done();
                });
        });

//        it('should return facilties with name = "New York" OR name = "Toronto"',
//        function(done) {
//            assert(false);
//        });
//
//        // combo a few of them
//        it('should return facilties sorted in descending order by uuid filtered'
//                + ' by properties:sector = "health" and updatedAt > Jan 1 2013' 
//                + ' with only  active,uuid,name,properties:sector fields', 
//        function(done) {
//            assert(false);
//        });
  });

//    describe('#getFacility', function(done) {
//        it('should return one facilty', function(done) {
//            assert(false);
//        });
//        it('should fail to find a facility with this id', function(done) {
//            assert(false);
//        });
//
//    });
//
//    describe('#updateFacility', function(done) {
//        it('should update facility from name="New York" to name="Toronto"', 
//        function(done) {
//            assert(false);
//        });
//        it("should fail to update facility's createdAt field", function(done) {
//            assert(false);
//        });
//        it('should fail to find any facilities with this id', function(done) {
//            assert(false);
//        });
//        it('should fail to update facility with empty post', function(done) {
//            assert(false);
//        });
//    });
//
//    describe('#createFacility', function(done) {
//        it('should create a facility with name="Toronto"', 
//        function(done) {
//            assert(false);
//        });
//        it('should fail to create a facility with createdAt field passed in', 
//        function(done) {
//            assert(false);
//        });
//        it('should fail to create empty facility', function(done) {
//            assert(false);
//        });
//    });
//
//    describe('#deleteFacility', function(done) {
//        it('should delete the facility"', function(done) {
//            assert(false);
//        });
//        it('should fail to delete the facility', function(done) {
//            assert(false);
//        });
//    });
});
