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
var UserModel = require('../domain/model/user.js');

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

                        // clear out users
                        UserModel.find({}).remove(function(err, result) {
                            if (err) throw err;

                            UserModel.addUser("Vijay", "test", "admin", function(success) {
                                assert(success);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#stats endpoint', function(done) {
        it('should return stats for db', function(done) {
            request(server)
                .get(conf.prePath + "/facilities/stats.json")
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.be.ok;
                    res.body.users.should.match(1);
                    res.body.sites.should.match(100);
                    res.body.visits.should.match(481);
                    res.body.lastUpdate.should.be.ok;
                    ((new Date(res.body.lastUpdate)).toString())
                        .should.match((new Date("Oct" + 30 + " " + 2014)).toString())
                    done();

                });
        });

        it('should return stats for an empty db', function(done) {
            SiteModel.find({}).remove(function(err, result) {
                if (err) throw err;
                UserModel.find({}).remove(function(err, result) {
                    if (err) throw err;

                    request(server)
                        .get(conf.prePath + "/facilities/stats.json")
                        .expect(200)
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }

                            res.body.should.be.ok;
                            res.body.users.should.match(0);
                            res.body.sites.should.match(0);
                            res.body.visits.should.match(0);
                            assert(res.body.lastUpdate === null);
                            done();

                        });
                });
            })
        });

        it('should return this facility as last updated', 
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

                    var date_str = (new Date(res.body.updatedAt)).toString();
                    request(server)
                        .get(conf.prePath + "/facilities/stats.json")
                        .expect(200)
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }

                            res.body.should.be.ok;
                            res.body.users.should.match(1);
                            res.body.sites.should.match(100);
                            res.body.visits.should.match(481);
                            res.body.lastUpdate.should.be.ok;
                            ((new Date(res.body.lastUpdate)).toString())
                                .should.match(date_str)
                            done();

                        });
                });
        });

        it('should increase the user count by one', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                // second request
                request(server)
                .get(conf.prePath + "/facilities/stats.json")
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.be.ok;
                    res.body.users.should.match(2);
                    res.body.sites.should.match(100);
                    res.body.visits.should.match(481);
                    res.body.lastUpdate.should.be.ok;
                    ((new Date(res.body.lastUpdate)).toString())
                        .should.match((new Date("Oct" + 30 + " " + 2014)).toString())
                    done();

                });
            });
        });

        it('should decrease the user count by one', function(done) {
             UserModel.deleteByName('Vijay', function() {
                request(server)
                .get(conf.prePath + "/facilities/stats.json")
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.be.ok;
                    res.body.users.should.match(0);
                    res.body.sites.should.match(100);
                    res.body.visits.should.match(481);
                    res.body.lastUpdate.should.be.ok;
                    ((new Date(res.body.lastUpdate)).toString())
                        .should.match((new Date("Oct" + 30 + " " + 2014)).toString())
                    done();

                });
            });
        });

        it('should increase the facility count by one', function(done) {
            request(server)
                .post(conf.prePath + "/facilities.json")
                .send({"name": "Toronto", "properties": {"sector": "test"}})
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    var date_str = (new Date(res.body.updatedAt)).toString();
                    request(server)
                        .get(conf.prePath + "/facilities/stats.json")
                        .expect(200)
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }

                            res.body.should.be.ok;
                            res.body.users.should.match(1);
                            res.body.sites.should.match(101);
                            res.body.visits.should.match(481);
                            res.body.lastUpdate.should.be.ok;
                            ((new Date(res.body.lastUpdate)).toString())
                                .should.match(date_str)
                            done();

                        });
                });
        });

        it('should decrease the facility count by one', function(done) {
            request(server)
                .del(conf.prePath + "/facilities/" + the_uuid + ".json")
                .expect('Content-Type', /json/)
                .expect(200) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    request(server)
                        .get(conf.prePath + "/facilities/stats.json")
                        .expect(200)
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }

                            res.body.should.be.ok;
                            res.body.users.should.match(1);
                            res.body.sites.should.match(99); //XXX: This field needs updating based on how stats endpoint handles showDeleted
                            res.body.visits.should.match(481);
                            res.body.lastUpdate.should.be.ok;
                            ((new Date(res.body.lastUpdate)).toString())
                                .should.match((new Date("Oct" + 30 + " " + 2014)).toString())
                            done();

                        });
                });
        });


    });
});
