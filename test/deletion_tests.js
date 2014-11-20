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
                SiteModel.findOne({'coordinates': [-73.9570783, 40.7645704]}, 
                function(err, site) {
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
        it('should return 99 facilties when one is deleted', function(done) {
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

                    request(server)
                        .get(conf.prePath + "/facilities.json?limit=off")
                        .expect('Content-Type', /json/)
                        .expect(200) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }
        
                            res.body.facilities.should.have.length(99);
                            done();
                        });
                });
        });

        it('should return 99 facilties when one is deleted', function(done) {
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

                    request(server)
                        .get(conf.prePath + "/facilities.json?limit=off&showDeleted")
                        .expect('Content-Type', /json/)
                        .expect(200) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }
        
                            res.body.facilities.should.have.length(100);
                            done();
                        });
                });
        });

    });

    describe('#getFacility', function(done) {
        it('should return not return a deleted facilty', function(done) {
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
     
                    request(server)
                        .get(conf.prePath + "/facilities/" + the_uuid + ".json")
                        .expect('Content-Type', /json/)
                        .expect(404) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }

                            res.body.should.be.ok;
                            res.body.code.should.match("404 Not Found");
                            done();
                        });
                });
        });

        it('should return not history for this one facilty', function(done) {
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
     
                    request(server)
                        .get(conf.prePath + "/facilities/" + the_uuid + ".json?history")
                        .expect('Content-Type', /json/)
                        .expect(404) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }

                            res.body.should.be.ok;
                            res.body.code.should.match("404 Not Found");
                            done();
                        });
                });
        });

        it('should return a deleted facilty', function(done) {
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
     
                    request(server)
                        .get(conf.prePath + "/facilities/" + the_uuid + ".json?showDeleted")
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
        });

        it('should return history for this one deleted facilty', function(done) {
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
     
                    request(server)
                        .get(conf.prePath + "/facilities/" + the_uuid + ".json?history&showDeleted")
                        .expect('Content-Type', /json/)
                        .expect(200) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }

                            res.body.should.be.ok;
                            res.body.history.should.have.length(1);
                            done();
                        });
                });
        });
    });

    describe('#updateFacility', function(done) {
        it('should not update a deleted facility to a random number string', 
        function(done) {

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
             
                    var new_name = "" + Math.random();
                    request(server)
                        .put(conf.prePath + "/facilities/" + the_uuid + ".json")
                        .send({"name": new_name})
                        .expect('Content-Type', /json/)
                        .expect(404) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }

                            res.body.should.be.ok;
                            res.body.code.should.match("404 Not Found");
                            done();
                        });
                });
        });

        it('should update a deleted facility to a random number string', 
        function(done) {

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
             
                    var new_name = "" + Math.random();
                    request(server)
                        .put(conf.prePath + "/facilities/" + the_uuid + ".json?showDeleted")
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
        });
    });

    describe('#geoQueries', function(done) {

        it('should return facilties within box defined by x,y and x",y" with one missing', 
        function(done) {

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
     
                    request(server)
                        .get(conf.prePath + "/facilities.json"
                                +"?within=90,-180,0,0")
                        .expect('Content-Type', /json/)        
                        .expect(200) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }


                            res.body.facilities.should.be.ok;
                            res.body.facilities.should.have.lengthOf(25);
                            res.body.limit.should.equal(25);
                            res.body.offset.should.equal(0);
                            res.body.total.should.equal(99);
                            done();
                        });
                });
        });

        it('should return facilities within 1mi with one missing', function(done) {
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
     
                    request(server)
                        .get(conf.prePath + "/facilities.json"
                                + "?near=40.7645704,-73.9570783&rad=1&units=mi")
                        .expect('Content-Type', /json/)
                        .expect('Content-Type', /json/)
                        .expect(200) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }
        
                            res.body.facilities.should.be.ok;
                            res.body.facilities.should.have.lengthOf(11);
                            res.body.limit.should.equal(11);
                            res.body.offset.should.equal(0);
                            res.body.total.should.equal(11);
                            done();
                        });
        
                });
        });

        it('should return facilties within box defined by x,y and x",y" with NONE missing', 
        function(done) {

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
     
                    request(server)
                        .get(conf.prePath + "/facilities.json"
                                +"?within=90,-180,0,0&showDeleted")
                        .expect('Content-Type', /json/)        
                        .expect(200) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }


                            res.body.facilities.should.be.ok;
                            res.body.facilities.should.have.lengthOf(25);
                            res.body.limit.should.equal(25);
                            res.body.offset.should.equal(0);
                            res.body.total.should.equal(100);
                            done();
                        });
                });
        });

        it('should return facilities within 1mi with NONE missing', function(done) {
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
     
                    request(server)
                        .get(conf.prePath + "/facilities.json"
                                + "?near=40.7645704,-73.9570783&rad=1&units=mi&showDeleted")
                        .expect('Content-Type', /json/)
                        .expect('Content-Type', /json/)
                        .expect(200) 
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }
        
                            res.body.facilities.should.be.ok;
                            res.body.facilities.should.have.lengthOf(12);
                            res.body.limit.should.equal(12);
                            res.body.offset.should.equal(0);
                            res.body.total.should.equal(12);
                            done();
                        });
        
                });
        });

    });
});
