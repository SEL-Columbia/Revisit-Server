process.env['NODE_ENV'] = 'testing';

var conf = require('./../config/app/config.js');
var assert = require('assert');
var request = require('supertest');
var should = require('should');
var _ = require('lodash-node');
var server = require('./../server.js').server;
var exec = require('child_process').exec;
var db_controller = require('./../models/dbcontroller.js');
var SiteModel = require('../models/dbcontroller').SiteModel;
var sites = require('./fixturez.js');

describe('API Extra Routes', function(done) {

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

    //TODO: switch slug and facilities
    describe('#near', function() {
        it('should return facilties with 1km', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/near.json"
                        + "?lat=40.7645704&lng=-73.9570783&rad=1")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(10);
                    done();
                });
        });

        it('should return facilities within 1mi', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/near.json"
                        + "?lat=40.7645704&lng=-73.9570783&rad=1&units=mi")
                .expect('Content-Type', /json/)
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(12);
                    done();
                });

        });

        it('should return 1 facilities within 0km', function(done) {
             request(server)
                .get(conf.prePath + "/facilities/near.json"
                        + "?lat=40.7645704&lng=-73.9570783")
                .expect('Content-Type', /json/)
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(1);
                    done();
                });
        });

        
        it('should return no facilities', function(done) {
             request(server)
                .get(conf.prePath + "/facilities/near.json"
                        + "?lat=0&lng=0&rad=0&units=km")
                .expect('Content-Type', /json/)
                .expect(404) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.code.should.match("Not Found");
                    done();
                });
        });

        it('should fail to search near facility', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/near.json"
                        + "?lat=40.7645704rad=0&units=km")
                .expect('Content-Type', /json/)
                .expect(400) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.code.should.match("Bad Request");
                    done();
                });
        });

    });

    describe('#nearID', function() {
        it('should return facilties with 1km', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/near/"+ the_uuid +".json?rad=1")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(10);
                    done();
                });
        });

        it('should return facilities within 1mi', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/near/"+ the_uuid +".json?rad=1&units=mi")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(12);
                    done();
                });

        });

        it('should return 1 facilities within 0km', function(done) {
             request(server)
                .get(conf.prePath + "/facilities/near/"+ the_uuid +".json")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(1);
                    res.body.facilities[0].uuid.should.match(the_uuid);
                    done();
                });
        });

        
        it('should return no facilities', function(done) {
             request(server)
                .get(conf.prePath + "/facilities/near/111111111111111111111111.json/?units=km&rad=100")
                .expect('Content-Type', /json/)
                .expect(404) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.code.should.match("Not Found");
                    done();
                });
        });
    });

    //TODO: combine sw lat/lng and ne lat/lng
    describe('#within', function() {
        it('should return facilties within box defined by x,y and x",y"', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities/within.json"
                        +"?slat=0&wlng=-180&nlat=90&elng=0")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(25);
                    done();
                });

        });

        it('should return no facilties within box a,b and a,b (point)', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities/within.json"
                        +"?slat=40.7645704&wlng=-73.9570783&nlat=40.7645704&elng=-73.9570783")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(1);
                    done();
                });
        });

        it('should fail to search within box', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/within.json"
                        +"?wlng=-73.9570783&nlat=40.7645704&elng=-73.9570783")
                .expect('Content-Type', /json/)
                .expect(400) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.code.should.match("Bad Request");
                    done();
                });
        });

        it('should return no facilities', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/within.json"
                        +"?slat=0&wlng=0&nlat=0&elng=0")
                .expect('Content-Type', /json/)
                .expect(404) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.code.should.match("Not Found");
                    done();
                });
        });
    });

    describe('#withinSector', function() {
        it('should return facilties within box x,y and x",y" and sector', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities/within.json"
                        +"?slat=0&wlng=-180&nlat=90&elng=0&sector=health")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(25);
                    done();
                });

        });

        it('should return no facilties within box a,b and a,b (point) and sec', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities/within.json"
                        +"?slat=40.7645704&wlng=-73.9570783&nlat=40.7645704&elng=-73.9570783&sector=health")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(1);
                    done();
                });
        });

        it('should return no facilities', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/within.json"
                        +"?slat=0&wlng=0&nlat=0&elng=0&sector=health")
                .expect('Content-Type', /json/)
                .expect('Content-Type', /json/)
                .expect(404) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.code.should.match("Not Found");
                    done();
                });
        });

        it('should fail to search within box', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/within.json"
                        +"?wlng=-73.9570783&nlat=40.7645704&sector=health")
                .expect('Content-Type', /json/)
                .expect(400) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.code.should.match("Bad Request");
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
