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
                            done();
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

                    console.log(res.body);
                    res.body.should.be.ok;
                    res.body.users.should.match(0);
                    res.body.sites.should.match(100);
                    res.body.visits.should.match(481);
                    res.body.lastUpdate.should.be.ok;
                    ((new Date(res.body.lastUpdate)).toString())
                        .should.match((new Date("Dec " + 30 + " " + 2014)).toString())
                    done();

                });
        });

        it('should return stats for an empty db', function(done) {
            SiteModel.find({}).remove(function(err, result) {
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

                    res.body.should.be.ok;
                    res.body.uuid.should.match(the_uuid);
                    res.body.name.should.match(new_name);
                    done();
                });
        });

        it('should increase the user count by one', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                // second request
                request(server)
                    .get(conf.prePath + '/users/Bob.json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }

                        res.body.username.should.match("Bob");
                        res.body.role.should.match("simple");
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
                    res.body.name.should.match("Toronto");
                    deletion_uuid = res.body.uuid; // for deletion
                    done();
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
                    res.body.id.should.match(the_uuid);
                    res.body.message.should.match("Resource deleted");
                    done();
                });
        });


    });
});
