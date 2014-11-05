process.env['NODE_ENV'] = 'testing';

var conf = require('./../config/app/config.js');
var assert = require('assert');
var request = require('supertest');
var should = require('should');
var _ = require('lodash-node');
var server = require('./../server.js').server;
var SiteModel = require('../domain/model/site.js');
var UserModel = require('../domain/model/user.js');
var sites = require('./fixturez.js');

describe('Authentication Tests', function(done) {

    var the_uuid = null;
    var the_user = null;

    // Before begining tests, populate the db with Users.
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
                SiteModel.findOne({}, function(err, site) {
                    if (err) throw (err);
                    the_uuid = site.uuid;

                    // clear out users
                    UserModel.find({}).remove(function(err, result) {
                        done();
                    });
                });
            });
        });
    });

    afterEach(function(done) {
        conf.useAuth(false);
        conf.allowGet(true);
        conf.allowPost(false);
        conf.allowPut(false);
        done();
    });

    describe('Accessing Data', function() {
        it('should allow GET requests from an UNAUTHORIZED user', function(done) {

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

        it('should NOT allow GET requests from an UNAUTHORIZED user', function(done) {

            conf.useAuth(true);
            conf.allowGet(false);

            request(server)
                .get(conf.prePath + "/facilities.json")
                .expect('Content-Type', /json/)
                .expect(401)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.code.should.match("401 Unauthorized");
                    done();
                });
        });

        it('should allow GET requests from an AUTHORIZED user', function(done) {

            conf.useAuth(true);
            conf.allowGet(false);

            // insert user
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .get(conf.prePath + "/facilities.json")
                    .auth('Bob', 'test')
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
        });
    });

    describe('Modifying Data', function() {

        it('should allow PUT requests from an UNAUTHORIZED user', function(done) {

            conf.useAuth(true);
            conf.allowPut(true);

            var new_name = "" + Math.random();
            request(server)
                .put(conf.prePath + "/facilities/" + the_uuid + ".json")
                .send({
                    "name": new_name
                })
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    console.log(res.body);
                    res.body.should.be.ok;
                    res.body.uuid.should.match(the_uuid);
                    res.body.name.should.match(new_name);
                    console.log(res.body);
                    done();
                });
        });

        it('should NOT allow PUT requests from an UNAUTHORIZED user', function(done) {

            conf.useAuth(true);
            conf.allowPut(false);

            var new_name = "" + Math.random();
            request(server)
                .put(conf.prePath + "/facilities/" + the_uuid + ".json")
                .send({
                    "name": new_name
                })
                .expect('Content-Type', /json/)
                .expect(401)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.code.should.match("401 Unauthorized");
                    done();
                });
        });

        it('should allow PUT requests from an AUTHORIZED user', function(done) {

            conf.useAuth(true);
            conf.allowPut(false);

            var new_name = "" + Math.random();
            // insert user
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .put(conf.prePath + "/facilities/" + the_uuid + ".json")
                    .auth('Bob', 'test')
                    .send({
                        "name": new_name
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }

                        console.log(res.body);
                        res.body.should.be.ok;
                        res.body.uuid.should.match(the_uuid);
                        res.body.name.should.match(new_name);
                        console.log(res.body);
                        done();
                    });
            });
        });
    });


    describe('Adding Data', function() {

        it('should allow POST requests from an UNAUTHORIZED user', function(done) {

            conf.useAuth(true);
            conf.allowPost(true);

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

        it('should NOT allow POST requests from an UNAUTHORIZED user', function(done) {

            conf.useAuth(true);
            conf.allowPost(false);

            request(server)
                .post(conf.prePath + "/facilities.json")
                .send({"name": "Toronto", "properties": {"sector": "test"}})
                .expect('Content-Type', /json/)
                .expect(401)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.code.should.match("401 Unauthorized");
                    done();
                });
        });

        it('should allow POST requests from an AUTHORIZED user', function(done) {

            conf.useAuth(true);
            conf.allowPost(false);

            var new_name = "" + Math.random();
            // insert user
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .post(conf.prePath + "/facilities.json")
                    .auth('Bob', 'test')
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
        });
    });

    describe('Deleting Data', function() {

        it('should allow DELETE requests from an UNAUTHORIZED user', function(done) {

            // authorization off, allow deletes
            conf.useAuth(false);

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

        it('should NOT allow DELETE requests from an UNAUTHORIZED user', function(done) {

            conf.useAuth(true);

            request(server)
                .del(conf.prePath + "/facilities/" + the_uuid + ".json")
                .expect('Content-Type', /json/)
                .expect(401)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.code.should.match("401 Unauthorized");
                    done();
                });
        });

        it('should allow DELETE requests from an AUTHORIZED user', function(done) {

            conf.useAuth(true);

            var new_name = "" + Math.random();
            // insert user
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .del(conf.prePath + "/facilities/" + the_uuid + ".json")
                    .auth('Bob', 'test')
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

    describe('Accessing User endpoints as an UNAUTHORIZED user', function() {

        it('should allow endpoint /user.json requests from an UNAUTHORIZED user', function(done) {

            // authorization off, allow deletes
            conf.useAuth(false);

            request(server)
                .post(conf.prePath + "/users.json?username=new&password=user")
                .expect('Content-Type', /json/)
                .expect(201) 
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.username.should.match("new");
                    res.body.created.should.match(true);
                    done();
                });
        });

        it('should allow endpoint /user/username.json requests from an UNAUTHORIZED user', function(done) {

            // authorization off, allow deletes
            conf.useAuth(false);

            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .put(conf.prePath + "/users/Bob.json?role=admin")
                    .expect('Content-Type', /json/)
                    .expect(200) 
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.username.should.match("Bob");
                        res.body.role.should.match("admin");
                        done();
                    });
            });
        });

        it('should allow endpoint /users/login requests from an UNAUTHORIZED user', function(done) {

            // authorization off, allow deletes
            conf.useAuth(false);

            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .post(conf.prePath + "/users/login/?username=Bob&password=test")
                    .expect('Content-Type', /json/)
                    .expect(200) 
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.username.should.match("Bob");
                        res.body.login.should.match(true);
                        done();
                    });
            });
        });
    });

    describe('Accessing User endpoints as an AUTHORIZED user with INCORRECT role', function() {

        it('should NOT allow endpoint /user.json requests from an AUTHORIZED user with INCORRECT role', function(done) {

            conf.useAuth(true);
            conf.blockUsers(true); // on by default

            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .post(conf.prePath + "/users.json?username=new&password=user")
                    .auth('Bob', 'test')
                    .expect('Content-Type', /json/)
                    .expect(403) 
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.code.should.match("403 Forbidden");
                        done();
                    });
            });
        });

        it('should NOT allow endpoint /user/username.json requests from an AUTHORIZED user with INCORRECT role', function(done) {

            conf.useAuth(true);
            conf.blockUsers(true); // on by default

            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .put(conf.prePath + "/users/Bob.json?role=admin")
                    .auth('Bob', 'test')
                    .expect('Content-Type', /json/)
                    .expect(403) 
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.code.should.match("403 Forbidden");
                        done();
                    });
            });
        });

        it('should NOT allow endpoint /users/login requests from an AUTHORIZED user with INCORRECT role', function(done) {

            conf.useAuth(true);
            conf.blockUsers(true); // on by default

            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .post(conf.prePath + "/users/login/?username=Bob&password=test")
                    .auth('Bob', 'test')
                    .expect('Content-Type', /json/)
                    .expect(403) 
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.code.should.match("403 Forbidden");
                        done();
                    });
            });
        });
    });

    describe('Accessing User endpoints as an AUTHORIZED user with CORRECT role', function() {

        it('should allow endpoint /user.json requests from an AUTHORIZED user with CORRECT role', function(done) {

            conf.useAuth(true);
            conf.blockUsers(true); // on by default

            UserModel.addUser("Bob", "test", "admin", function(success) {
                assert(success);
                request(server)
                    .post(conf.prePath + "/users.json?username=new&password=user with CORRECT role")
                    .auth('Bob', 'test')
                    .expect('Content-Type', /json/)
                    .expect(201) 
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.username.should.match("new");
                        res.body.created.should.match(true);
                        done();
                    });
            });
        });

        it('should allow endpoint /user/username.json requests from an AUTHORIZED user with CORRECT role', function(done) {

            conf.useAuth(true);
            conf.blockUsers(true); // on by default

            UserModel.addUser("Bob", "test", "admin", function(success) {
                assert(success);
                request(server)
                    .put(conf.prePath + "/users/Bob.json?role=somethingelse")
                    .auth('Bob', 'test')
                    .expect('Content-Type', /json/)
                    .expect(200) 
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.username.should.match("Bob");
                        res.body.role.should.match("somethingelse");
                        done();
                    });
            });
        });

        it('should allow endpoint /users/login requests from an AUTHORIZED user with CORRECT role', function(done) {

            conf.useAuth(true);
            conf.blockUsers(true); // on by default

            UserModel.addUser("Bob", "test", "admin", function(success) {
                assert(success);
                request(server)
                    .post(conf.prePath + "/users/login/?username=Bob&password=test")
                    .auth('Bob', 'test')
                    .expect('Content-Type', /json/)
                    .expect(200) 
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.username.should.match("Bob");
                        res.body.login.should.match(true);
                        done();
                    });
            });
        });
    });
    
    describe('Accessing User endpoints as an AUTHORIZED user with INCORRECT role and endpoint checking OFF', function() {

        it('should allow endpoint /user.json requests from an AUTHORIZED user with endpoint checking OFF', function(done) {

            conf.useAuth(true);
            conf.blockUsers(false); // on by default

            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .post(conf.prePath + "/users.json?username=new&password=user")
                    .auth('Bob', 'test')
                    .expect('Content-Type', /json/)
                    .expect(201) 
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.username.should.match("new");
                        res.body.created.should.match(true);
                        done();
                    });
            });
        });

        it('should allow endpoint /user/username.json requests from an AUTHORIZED user with endpoint checking OFF', function(done) {

            conf.useAuth(true);
            conf.blockUsers(false); // on by default

            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .put(conf.prePath + "/users/Bob.json?role=somethingelse")
                    .auth('Bob', 'test')
                    .expect('Content-Type', /json/)
                    .expect(200) 
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.username.should.match("Bob");
                        res.body.role.should.match("somethingelse");
                        done();
                    });
            });
        });

        it('should allow endpoint /users/login requests from an AUTHORIZED user with endpoint checking OFF', function(done) {

            conf.useAuth(true);
            conf.blockUsers(false); // on by default

            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                request(server)
                    .post(conf.prePath + "/users/login/?username=Bob&password=test")
                    .auth('Bob', 'test')
                    .expect('Content-Type', /json/)
                    .expect(200) 
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.username.should.match("Bob");
                        res.body.login.should.match(true);
                        done();
                    });
            });
        });
    });
});
