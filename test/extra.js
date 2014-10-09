process.env['NODE_ENV'] = 'testing';

var conf = require('./../config/app/config.js');
var assert = require('assert');
var request = require('supertest');
var should = require('should');
var _ = require('lodash-node');
var server = require('./../server.js').server;
var exec = require('child_process').exec;
var db_controller = require('./../models/dbcontroller.js');

describe('API Extra Routes', function() {
    before(function(done) {
        done();
    });

    beforeEach(function(done) {
        console.log(__dirname);
        var child = exec('mongo test --eval "db.dropDatabase();"'
                + ' && mongoimport -d test -c facilities ' 
                + __dirname + '/fixtures.json',
                    function(err, stdout, stderr) {
                        if (err) throw err;
                        // important to wait for clean to return
                        done();
                    });
    });
 
    describe('#near', function() {
        it('should return facilties with 1km', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/near/40.7645704/-73.9570783/1/km")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(10);
                    res.body.facilities.length.should.be.above(1);
                    done();
                });
        });

        it('should return facilities within 1mi', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/near/40.7645704/-73.9570783/1")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(12);
                    res.body.facilities.length.should.be.above(1);
                    done();
                });

        });

        it('should return 1 facilities within 0km', function(done) {
             request(server)
                .get(conf.prePath + "/facilities/near/40.7645704/-73.9570783/0/km")
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
                .get(conf.prePath + "/facilities/near/0.0/0.0/0/km")
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

    describe('#nearID', function() {
        it('should return facilties with 1km', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/near/1/535823222b7a61adb4ed67cd.json/km")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(10);
                    res.body.facilities.length.should.be.above(1);
                    done();
                });
        });

        it('should return facilities within 1mi', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/near/1/535823222b7a61adb4ed67cd.json")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(12);
                    res.body.facilities.length.should.be.above(1);
                    done();
                });

        });

        it('should return 1 facilities within 0km', function(done) {
             request(server)
                .get(conf.prePath + "/facilities/near/0/535823222b7a61adb4ed67cd.json/km")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(1);
                    res.body.facilities[0].uuid.should.match("535823222b7a61adb4ed67cd");
                    done();
                });
        });

        
        it('should return no facilities', function(done) {
             request(server)
                .get(conf.prePath + "/facilities/near/0/111111111111111111111111.json/km")
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

    describe('#within', function() {
        it('should return facilties within box defined by x,y and x",y"', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities/within/0/-180/90/0")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }


                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(100);
                    done();
                });

        });

        it('should return no facilties within box a,b and a,b (point)', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities/within/40.7645704/-73.9570783/40.7645704/-73.9570783")
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
                .get(conf.prePath + "/facilities/within/0/0/0/0")
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
                .get(conf.prePath + "/facilities/within/0/-180/90/0/health")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.facilities.should.be.ok;
                    res.body.facilities.should.have.lengthOf(56);
                    done();
                });

        });

        it('should return no facilties within box a,b and a,b (point) and sec', 
        function(done) {
            request(server)
                .get(conf.prePath + "/facilities/within/40.7645704/-73.9570783/40.7645704/-73.9570783/health")
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
                .get(conf.prePath + "/facilities/within/0/0/0/0/health")
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
