process.env['NODE_ENV'] = 'testing';

var conf = require('./../config/app/config.js');
var assert = require('assert');
var request = require('supertest');
var should = require('should');
var _ = require('lodash-node');
var exec = require('child_process').exec;
var server = require('./../server.js').server;
var sites = require('./fixturez.js');
var SiteModel = require('../models/dbcontroller').SiteModel;

describe('Facility ADD/UPDATE/DELETE/GET API routes', function(done) {

    var the_uuid = null;
    before(function(done) {
       done(); 
    });

    beforeEach(function(done) {
        
        // wipe db
        SiteModel.find({}).remove(function(err, result) {
            // load db
            SiteModel.collection.insert(sites, function(err, result) {
                if (err) throw (err);

                // get an example uuid
                SiteModel.findOne({}, function(err, site) {
                if (err) throw (err);

                    the_uuid = site.uuid;
                    done();
                });
            });
        });
    });
    
    describe('#getFacilities', function(done) {
        it('should return 25 facilties', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.have.length(25);
                    res.body.length.should.equal(25);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(100);
                    done();
                });
        });

        it('should return 25 facilties starting from an offset',function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?offset=0")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    var first_set = res.body;
                    first_set.facilities.should.have.length(25);
                    request(server)
                        .get(conf.prePath + "/facilities.json?offset=25")
                        .expect('Content-Type', /json/)
                        .expect(200) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }
                            res.body.facilities.should.have.length(25);
                            // just checks if overlaps fully
                            res.body.facilities.should.not.containDeep(first_set.facilities);
                            res.body.length.should.equal(25);
                            res.body.offset.should.equal(25);
                            res.body.total.should.equal(100);
                            done();
                        });
                });
        });

        it('should return max number of facilities', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?limit=off")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                   res.body.facilities.should.have.length(100);
                   res.body.length.should.equal(100);
                   res.body.offset.should.equal(0);
                   res.body.total.should.equal(100);
                   done();
                });

        });
        
        it('should return facilities with name = Brooklyn Hospital Center', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?name=Brooklyn Hospital Center")
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

                    res.body.length.should.equal(1);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(1);
                    done();
                });
        });
        
        it('should return facilities with only uuid, active, properties:sector' 
                + ' fields', function(done) {

            request(server)
                .get(conf.prePath + "/facilities.json?fields=uuid,active,properties:sector")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    //TODO: Not very readable ...
                    res.body.facilities.forEach(
                        function(facility) {
                            
                            facility.should.have.properties(['uuid', 'active', 'properties']);
                            facility.properties.should.have.property('sector');
                            facility.should.not.have.properties(['name', 'createdAt', 'updatedAt', 'href']);

                        });

                    res.body.length.should.equal(25);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(100);
                    done();
                });
        });


        it('should return facilities with only the field name, no virtual fields should show up' 
                + ' fields', function(done) {

            request(server)
                .get(conf.prePath + "/facilities.json?fields=name")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.forEach(
                        function(facility) {
                            facility.should.have.property('name');
                            facility.should.not.have.properties(['href', 'uuid', 'createdAt', 'properties']);

                        });

                    res.body.length.should.equal(25);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(100);
                    done();
                });
        });


        it('should return facilities with properties:sector = "health"', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?properties:sector=health")
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
                    
                    res.body.length.should.equal(25);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(56);
                    done();
                });
        });

        it('should return facilities with updatedAt > Jan 1 2013', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?updatedSince=Jan 1 2013")
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
                    
                    res.body.length.should.equal(25);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(100);

                    done();
                });
        });

        it('should return facilities with active=true', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?active=true")
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
                    
                   res.body.length.should.equal(25);
                   res.body.offset.should.equal(0);
                   res.body.total.should.equal(100);

                   done();
                });


        });

        it('should return facilities without their properties field', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?allProperties=false")
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

                   res.body.length.should.equal(25);
                   res.body.offset.should.equal(0);
                   res.body.total.should.equal(100);
                   done();
                });
        });

        it('should return facilties sorted in ascending order by name', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?fields=name&sortAsc=name")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    
                    //TODO: not very readable 
                    // TODO - check string sort order via < >
                    // TODO: use a built in sort of somekind
                    var facilities = _.cloneDeep(res.body.facilities)
                    facilities.sort(function(a,b){
                       if (a.name < b.name) 
                           return -1;
                       if (a.name > b.name) 
                           return 1;

                       return 0;
                    });

                    for (i = 0; i < 25; i++) {
                        res.body.facilities[i].should.match(facilities[i])
                    }
                   
                    res.body.length.should.equal(25);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(100);

                    done();
                });
        });

        it('should return facilties sorted in descending order by name', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?fields=name&sortDesc=name")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    
                    //TODO: not very readable 
                    var facilities = _.cloneDeep(res.body.facilities)
                    facilities.sort(function(a,b){
                       if (a.name > b.name) 
                           return -1;
                       if (a.name < b.name) 
                           return 1;

                       return 0;
                    });

                    for (i = 0; i < 25; i++) {
                        res.body.facilities[i].should.be.match(facilities[i])
                    }

                    res.body.length.should.equal(25);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(100);

                    done();
                });
        });

        it('should return facilties with name = "Brooklyn Hospital Center" OR name = "Public School 34"',
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?name=Public School 34&name=Brooklyn Hospital Center&fields=name")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    
                    //TODO: This is disgusting 
                    var seen = [0, 0]
                    res.body.facilities.forEach(
                        function(facility) {
                            var name = facility.name;
                            if (name === 'Public School 34') {
                                seen[0] = 1;
                            } else if (name === 'Brooklyn Hospital Center') {
                                seen[1] = 1;
                            } else {
                                assert(false, "Name: " + name + " not expected.");
                            }
                        });

                    assert(seen[0] + seen[1] == 2, "Did not see both facility names.");

                    res.body.length.should.equal(2);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(2);
                    done();
                });

        });
  });

    describe('#getFacility', function(done) {
        it('should return one facilty', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/" + the_uuid + ".json")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.be.ok;
                    res.body.uuid.should.match(the_uuid);
                    done();
                });

        });
        it('should return fail to find a facilty if the url does not end in .json', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/" + the_uuid + ".jsonabcd")
                .expect('Content-Type', /json/)
                .expect(404) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.code.should.match("404 Not Found");
                    done();
                });

        });
        it('should fail to find a facility with this id', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/111111111111111111111111.json")
                .expect('Content-Type', /json/)
                .expect(404) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.code.should.match("404 Not Found");
                    done();
                });
        });

    });

    describe('#updateFacility', function(done) {
        it('should update facility to a random number string', 
        function(done) {
            var new_name = "" + Math.random();
            request(server)
                .put(conf.prePath + "/facilities/" + the_uuid + ".json")
                .send({"name": new_name})
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.be.ok;
                    res.body.uuid.should.match(the_uuid);
                    res.body.name.should.match(new_name);
                    done();
                });
        });
    
        it("should fail to update facility's createdAt field", function(done) {
            request(server)
                .put(conf.prePath + "/facilities/" + the_uuid + ".json")
                .send({"createdAt": new Date(2000, 0, 1)})
                .expect('Content-Type', /json/)
                .expect(400) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.code.should.match("400 Bad Request");
                    done();
                });

        });

        it("should fail to update facility's _id field but still update name", 
        function(done) {
            request(server)
                .put(conf.prePath + "/facilities/" + the_uuid + ".json")
                .send({"_id": the_uuid, "name": "hello"})
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.be.ok;
                    res.body.uuid.should.match(the_uuid);
                    res.body.name.should.match("hello");
                    done();
                });

        });

        it('should fail to update facility with empty post', function(done) {
            request(server)
                .put(conf.prePath + "/facilities/" + the_uuid + ".json")
                .send()
                .expect('Content-Type', /json/)
                .expect(400) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.code.should.match("400 Bad Request");
                    done();
                });
        });
    });

    describe('#createFacility', function(done) {
    
        it('should create a facility with name="Toronto"', function(done) {
            request(server)
                .post(conf.prePath + "/facilities.json")
                .send({"name": "Toronto", "properties": {"sector": "test"}})
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.name.should.match("Toronto");
                    deletion_uuid = res.body.uuid; // for deletion
                    done();
                });
        });

        it('should fail to create a facility with createdAt field passed in', 
        function(done) {
            request(server)
                .post(conf.prePath + "/facilities.json")
                .send({"name": "Toronto", "createdAt": new Date(1999, 11, 30)})
                .expect('Content-Type', /json/)
                .expect(400) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.code.should.match("400 Bad Request");
                    done();
                });
        });

        it('should fail to create empty facility', function(done) {
            request(server)
                .post(conf.prePath + "/facilities.json")
                .send()
                .expect('Content-Type', /json/)
                .expect(400) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.code.should.match("400 Bad Request");
                    done();
                });

        });
    });

    describe('#bulkCreateFacility', function(done) {
    
        it('should bulk upload two facilities', function(done) {
            request(server)
                .post(conf.prePath + "/facilities/bulk.json")
                .send({"facilities":[
                        {"name": "Toronto", "properties": {"sector": "test"}}, 
                        {"name": "Kyoto", "properties": {"sector": "test"}}, 
                        {"name": "Brookyln", "properties": {"sector": "test"}}
                    ]})
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    } 
                    res.body.recieved.should.equal(3);
                    res.body.inserted.should.equal(3);
                    res.body.failed.should.equal(0);
                    done();
                });
        });

        it('should fail to upload empty post', function(done) {
            request(server)
                .post(conf.prePath + "/facilities/bulk.json")
                .send()
                .expect('Content-Type', /json/)
                .expect(400) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.code.should.match("400 Bad Request");
                    done();
                });
        });

        it('should fail to upload facilities but not respond with an error', function(done) {
            request(server)
                .post(conf.prePath + "/facilities/bulk.json")
                .send({"facilities": []})
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.recieved.should.equal(0);
                    res.body.inserted.should.equal(0);
                    res.body.failed.should.equal(0);
                    done();
                });
        });

    });

    //TODO: More bulk tests for _id, href uuid etc.

    describe('#deleteFacility', function(done) {
        it('should delete the facility"', function(done) {

            request(server)
                .del(conf.prePath + "/facilities/" + the_uuid + ".json")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.id.should.match(the_uuid);
                    res.body.message.should.match("Resource deleted");
                    done();
                });
        });

        it('should fail to delete the facility', function(done) {
            // fixture readded this id so remove it again.
            request(server)
                .del(conf.prePath + "/facilities/" + the_uuid + ".json")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.id.should.match(the_uuid);
                    res.body.message.should.match("Resource deleted");

                    // now try to redelete
                    request(server)
                        .del(conf.prePath + "/facilities/" + the_uuid + ".json")
                        .expect('Content-Type', /json/)
                        .expect(404) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }
                            res.body.code.should.match("404 Not Found");
                            done();
                        });
                });
        });
    });
});
