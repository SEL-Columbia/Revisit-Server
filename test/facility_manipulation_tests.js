process.env['NODE_ENV'] = 'testing';

var conf = require('./../config/app/config.js');
var assert = require('assert');
var request = require('supertest');
var should = require('should');
var _ = require('lodash-node');
var exec = require('child_process').exec;
var server = require('./../server.js').server;
var sites = require('./fixturez.js');
var SiteModel = require('../domain/model/site.js');
var ObjectId = require("mongoose").Types.ObjectId;

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

                    // wipe history model
                    SiteModel.wipeHistory(function(err) {
                        if (err) throw (err);
                        done();
                    });
                });
            });
        });
    });
    
    describe('#getFacilities', function(done) {
        it('should return 25 facilties by default', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json")
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

        it('should return 20 facilties, based on limit param', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?limit=20")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.have.length(20);
                    done();
                });
        });

        it('should return 20 facilties, and include limit, offset, and total values in response', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?limit=20")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.have.length(20);
                    res.body.limit.should.equal(20);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(100);
                    done();
                });
        });

        it('should return 10 facilties, based on per_page param', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?per_page=10")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.have.length(10);
                    done();
                });
        });

        it('should return 25 facilties, and inlcude page, per_page, total_entries, and total_pages, based on page param', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?page=2")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.have.length(25);
                    res.body.page.should.equal(2);
                    res.body.per_page.should.equal(25);
                    res.body.total_pages.should.equal(4);
                    res.body.total_entries.should.equal(100);

                    done();
                });
        });

        it('should return 10 facilties, starting from page 3, and inlcude page, per_page, total_entries, and total_pages, based on page and per_page params', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?page=3&per_page=10")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.have.length(10);
                    res.body.page.should.equal(3);
                    res.body.per_page.should.equal(10);
                    res.body.total_pages.should.equal(10);
                    res.body.total_entries.should.equal(100);

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
                            res.body.limit.should.equal(25);
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
                   res.body.limit.should.equal(100);
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

                    res.body.limit.should.equal(1);
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

                    res.body.limit.should.equal(25);
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

                    res.body.limit.should.equal(25);
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
                    
                    res.body.limit.should.equal(25);
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
                    
                    res.body.limit.should.equal(25);
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
                    
                   res.body.limit.should.equal(25);
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

                   res.body.limit.should.equal(25);
                   res.body.offset.should.equal(0);
                   res.body.total.should.equal(100);
                   done();
                });
        });

        it('should return facilities with their virtual fields', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                   res.body.facilities.forEach(
                        function(facility) {
                            facility.should.have.property('uuid');
                            facility.should.have.property('href');
                        });

                   res.body.limit.should.equal(25);
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
                   
                    res.body.limit.should.equal(25);
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

                    res.body.limit.should.equal(25);
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

                    res.body.limit.should.equal(2);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(2);
                    done();
                });

        });

        it('should return no facilties with name = "poop"',
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?name=poop")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    
                    res.body.limit.should.equal(0);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(0);
                    res.body.facilities.should.be.match([]);
                    done();
                });
        });

        it('should return no facilties with fields="poop"',
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json?fields=poop")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    
                    res.body.limit.should.equal(0);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(100);
                    res.body.facilities.should.be.match([]);
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

        it('should return history for this one facilty', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/" + the_uuid + ".json?hist")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.should.be.ok;
                    res.body.limit.should.match(res.body.history.length);
                    res.body.history[0].should.not.have.property("_id");
                    res.body.history[0].should.have.property("uuid");
                    res.body.history[0].uuid.should.match(the_uuid);
                    res.body.version.should.match(0);
                    done();
                });
        });

        //TODO: Revert testing? Rollback testing? Do we need to if module has own tests?
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

        it('should fail to include custom createdAt field passed in', 
        function(done) {
            var date = new Date(1999, 11, 30);
            request(server)
                .post(conf.prePath + "/facilities.json")
                .send({"name": "Toronto", "createdAt": date, "properties": {"sector": "test"}})
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.createdAt.toString().should.not.match(date.toString());
                    done();
                });
        });

        it('should include custom uuid field passed in', 
        function(done) {
            var uuid = "111111111111111111111111";
            request(server)
                .post(conf.prePath + "/facilities.json")
                .send({"name": "Toronto", "uuid": uuid, "properties": {"sector": "test"}})
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.uuid.should.match(uuid);
                    done();
                });
        });

        it('should fail to insert obj with colliding uuid passed in', 
        function(done) {
            var uuid = the_uuid;
            request(server)
                .post(conf.prePath + "/facilities.json")
                .send({"name": "Toronto", "uuid": uuid, "properties": {"sector": "test"}})
                .expect('Content-Type', /json/)
                .expect(409) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.code.should.match("409 Conflict");
                    done();
                });
        });

        it('should fail to insert with id from _id field passed in but should still create facility', 
        function(done) {
            var _id = "111111111111111111111111";
            request(server)
                .post(conf.prePath + "/facilities.json")
                .send({"name": "Toronto", "_id": _id, "properties": {"sector": "test"}})
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.name.should.match("Toronto");
                    res.body.uuid.should.not.match(_id); // uuid == _id internally so this is a fair check
                    done();
                });
        });


        it('should fail to create without sector field passed in', 
        function(done) {
            request(server)
                .post(conf.prePath + "/facilities.json")
                .send({"name": "Toronto"})
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
    
        it('should bulk upload three facilities', function(done) {
            request(server)
                .post(conf.prePath + "/facilities.json?bulk")
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
                    res.body.received.should.equal(3);
                    res.body.inserted.should.equal(3);
                    res.body.failed.should.equal(0);
                    res.body.should.not.have.property("errors");
                    done();
                });
        });

        it('should bulk upload two of three facilities', function(done) {
            request(server)
                .post(conf.prePath + "/facilities.json?bulk")
                .send({"facilities":[
                        {"name": "Toronto", "properties": {"sector": "test"}}, 
                        {"name": "Kyoto"}, 
                        {"name": "Brookyln", "properties": {"sector": "test"}}
                    ]})
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    } 
                    res.body.received.should.equal(3);
                    res.body.inserted.should.equal(2);
                    res.body.failed.should.equal(1);
                    res.body.should.not.have.property("errors");
                    done();
                });
        });

        it('should bulk upload two of three facilities with error info', function(done) {
            request(server)
                .post(conf.prePath + "/facilities.json?bulk&debug")
                .send({"facilities":[
                        {"name": "Toronto", "properties": {"sector": "test"}}, 
                        {"name": "Kyoto"}, 
                        {"name": "Brookyln", "properties": {"sector": "test"}}
                    ]})
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    } 
                    res.body.received.should.equal(3);
                    res.body.inserted.should.equal(2);
                    res.body.failed.should.equal(1);
                    res.body.should.have.property("errors");
                    res.body.errors.should.have.length(1);
                    done();
                });
        });

        it('should fail to upload empty post', function(done) {
            request(server)
                .post(conf.prePath + "/facilities.json?bulk")
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

        it('should fail to upload bad post', function(done) {
            request(server)
                .post(conf.prePath + "/facilities.json?bulk")
                .send("bad")
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
                .post(conf.prePath + "/facilities.json?bulk")
                .send({"facilities": []})
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.received.should.equal(0);
                    res.body.inserted.should.equal(0);
                    res.body.failed.should.equal(0);
                    done();
                });
        });

        it('should upload facilities with CUSTOM uuids', function(done) {
            var tid = "111111111111111111111111";
            var kid = "012345678912345678901234";
            var bid = "111111111111711171111111";
            request(server)
                .post(conf.prePath + "/facilities.json?bulk")
                .send({"facilities":[
                        {"uuid" : tid, "name": "Tdot", "properties": {"sector": "test"}}, 
                        {"uuid" : kid, "name": "Kyoto", "properties": {"sector": "test"}}, 
                        {"uuid" : bid, "name": "Bklyn", "properties": {"sector": "test"}},
                    ]})
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    SiteModel.find({name: {"$in" : ["Tdot", "Kyoto", "Bklyn"]}}, function(err, sites) {
                        sites.should.have.length(3);
                        sites.forEach(function(facility) {
                            assert([tid, kid, bid].indexOf(facility.uuid) > -1);
                        });
                        done();
                    });
                });
        });

        it('should fail to upload facility with colliding uuid', function(done) {
            var tid = "111111111111111111111111";
            var bid = "111111111111111111111111";
            var kid = "012345678912345678901234";
            var jid = "012345678912345678901234";
            request(server)
                .post(conf.prePath + "/facilities.json?bulk")
                .send({"facilities":[
                        {"uuid" : tid, "name": "Tdot", "properties": {"sector": "test"}}, 
                        {"uuid" : bid, "name": "Bklyn", "properties": {"sector": "test"}},
                        {"uuid" : jid, "name": "Kyoto", "properties": {"sector": "test"}},
                        {"uuid" : kid, "name": "sdf", "properties": {"sector": "test"}} 
                    ]})
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.received.should.equal(4);
                    res.body.inserted.should.equal(2);
                    res.body.failed.should.equal(2);

                    SiteModel.find({name: {"$in" : ["Tdot", "Kyoto", "Bklyn"]}}, function(err, sites) {
                        sites.should.have.length(2);
                        sites.forEach(function(facility) {
                            assert([tid, kid, bid].indexOf(facility.uuid) > -1);
                        });
                        done();
                    });
                });
        });

        it('should fail to upload facility with colliding uuid and set errors in debug mode', function(done) {
            var tid = "111111111111111111111111";
            var bid = "111111111111111111111111";
            var kid = "012345678912345678901234";
            var jid = "012345678912345678901234";
            request(server)
                .post(conf.prePath + "/facilities.json?bulk&debug")
                .send({"facilities":[
                        {"uuid" : tid, "name": "Tdot", "properties": {"sector": "test"}}, 
                        {"uuid" : bid, "name": "Bklyn", "properties": {"sector": "test"}},
                        {"uuid" : jid, "name": "Kyoto", "properties": {"sector": "test"}},
                        {"uuid" : kid, "name": "sdf", "properties": {"sector": "test"}} 
                    ]})
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.received.should.equal(4);
                    res.body.inserted.should.equal(2);
                    res.body.failed.should.equal(2);
                    res.body.errors.should.have.length(2);;
                    done();
                });
        });
    });

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
