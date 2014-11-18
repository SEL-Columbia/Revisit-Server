process.env['NODE_ENV'] = 'testing';

var conf = require('./../config/app/config.js');
var assert = require('assert');
var request = require('supertest');
var should = require('should');
var _ = require('lodash-node');
var server = require('./../server.js').server;
var exec = require('child_process').exec;
var SiteModel = require('../domain/model/site');
var sites = require('./fixturez.js');

describe('Facility geolocation queries API routes', function(done) {

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

                // get an example uuid with specific coords
                SiteModel.findOne({'coordinates': [-73.9570783, 40.7645704]}, 
                function(err, site) {
                    if (err) throw (err);
                    the_uuid = site.uuid;
                    done();
                });
            });
        });
    });

    describe('#near', function() {
        it('should return facilties with 1km', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        + "?near=40.7645704,-73.9570783&rad=1")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(10);
                    res.body.limit.should.equal(10);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(10);
                    done();
                });
        });

        it('should return facilities within 1mi', function(done) {
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
                    res.body.facilities.should.have.lengthOf(12);
                    res.body.limit.should.equal(12);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(12);
                    done();
                });

        });

        it('should return 1 facilities within 0km', function(done) {
             request(server)
                .get(conf.prePath + "/facilities.json"
                        + "?near=40.7645704,-73.9570783")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(1);
                    res.body.limit.should.equal(1);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(1);
                    done();
                });
        });

        
        it('should return no facilities', function(done) {
             request(server)
                .get(conf.prePath + "/facilities.json"
                        + "?near=0,0&rad=0&units=km")
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

        it('should fail to search near facility', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        + "?near=40.7645704&rad=0&units=km")
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

        it('should return facilities within 1mi with offset 2', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        + "?near=40.7645704,-73.9570783&rad=1&units=mi&offset=2")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(10);
                    res.body.limit.should.equal(10);
                    res.body.offset.should.equal(2);
                    res.body.total.should.equal(12);
                    done();
                });

        });

        it('should return facilities within 1mi with offset 2, active=true and no virtfields', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        + "?near=40.7645704,-73.9570783&rad=1&units=mi&offset=2"
                        + "&fields=name,active&active=true")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.forEach(
                        function(facility) {
                            facility.should.have.property('name');
                            facility.should.have.property('active', true);
                            facility.should.not.have.properties(['href', 'uuid', 'createdAt', 'properties']);
                    });


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(10);
                    res.body.limit.should.equal(10);
                    res.body.offset.should.equal(2);
                    res.body.total.should.equal(12);
                    done();
                });

        });

        it('should return facilities within 1mi with limit 2', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        + "?near=40.7645704,-73.9570783&rad=1&units=mi&limit=2")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(2);
                    res.body.limit.should.equal(2);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(12);
                    done();
                });

        });

    });

    //TODO: combine sw lat/lng and ne lat/lng
    describe('#within', function() {
        it('should return facilties within box defined by x,y and x",y"', 
        function(done) {
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
                    res.body.total.should.equal(100);
                    done();
                });

        });

        it('should return no facilties within box a,b and a,b (point)', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        +"?within=40.7645704,-73.9570783,40.7645704,-73.9570783")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(1);
                    res.body.limit.should.equal(1);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(1);
                    done();
                });
        });

        it('should fail to search within box', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        +"?within=-73.9570783,40.7645704,-73.9570783")
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

        it('should return no facilities', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        +"?within=0,0,0,0")
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

        it('should return facilties within box defined by x,y and x",y" with offset=2', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        +"?within=90,-180,0,0&offset=2")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(25);
                    res.body.limit.should.equal(25);
                    res.body.offset.should.equal(2);
                    res.body.total.should.equal(100);
                    done();
                });

        });

        it('should return facilties within box defined by x,y and x",y" with offset=2, name and active fields, no virtfields and active=true', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        +"?within=90,-180,0,0&offset=2"
                        +"&fields=name,active&active=true")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.forEach(
                        function(facility) {
                            facility.should.have.property('name');
                            facility.should.have.property('active', true);
                            facility.should.not.have.properties(['href', 'uuid', 'createdAt', 'properties']);
                    });

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(25);
                    res.body.limit.should.equal(25);
                    res.body.offset.should.equal(2);
                    res.body.total.should.equal(100);
                    done();
                });

        });

        it('should return facilties within box defined by x,y and x",y" with limit=5', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        +"?within=90,-180,0,0&limit=5")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(5);
                    res.body.limit.should.equal(5);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(100);
                    done();
                });

        });

    });

    describe('#withinSector', function() {
        it('should return facilties within box x,y and x",y" and sector', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        +"?within=90,-180,0,0&properties:sector=health")
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
                    res.body.total.should.equal(56);

                    res.body.facilities.forEach(
                        function(facility) {
                            facility.properties.should.have.property('sector', 'health');
                    });


                    done();
                });
        });

        it('should return no facilties within box a,b and a,b (point) and sec', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        +"?within=40.7645704,-73.9570783,40.7645704,-73.9570783&properties:sector=health")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(1);
                    res.body.limit.should.equal(1);
                    res.body.offset.should.equal(0);
                    res.body.total.should.equal(1);

                    res.body.facilities.forEach(
                        function(facility) {
                            facility.properties.should.have.property('sector', 'health');
                    });

                    done();
                });
        });

        it('should return no facilities', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        +"?within=0,0,0,0&properties:sector=health")
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

        it('should fail to search within box', function(done) {
            request(server)
                .get(conf.prePath + "/facilities.json"
                        +"?within=-73.9570783,40.7645704&properties:sector=health")
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

//    describe('#uploadPhoto', function() {
//        it('should upload a photo to /public/sites/photos/$id/name and the server'
//                + ' should be added to the facility', 
//        function(done) {
//            assert(false);
//        });
//
//        it('should upload a photo to /public/sites/photos/$id/name with the'
//                + 'same name as previous entry and the server should NOT be added'
//                + ' to the facility as it already exists', 
//        function(done) {
//            assert(false);
//        });
//
//        it('should upload a photo to /public/sites/photos/$id/name and the server'
//                + ' should be added to the facility after creating the'
//                + ' properties field for the facility which did not have one', 
//        function(done) {
//            assert(false);
//        });
//
//        it('should not find the facility and not store the uploaded photo', 
//        function(done) {
//            assert(false);
//        });
//    });
//
});
