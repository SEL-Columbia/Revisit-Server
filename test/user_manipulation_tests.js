process.env['NODE_ENV'] = 'testing';

var conf = require('./../config/app/config.js');
var auth = require('./../core/authentication.js');
var assert = require('assert');
var request = require('supertest');
var should = require('should');
var _ = require('lodash-node');
var server = require('./../server.js').server;
var SiteModel = require('../domain/model/site.js');
var UserModel = require('../domain/model/user.js');
var sites = require('./fixturez.js');

describe('User endpoint tests', function(done) {

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
        auth.useAuth(false);
        auth.allowGet(true);
        auth.allowPost(false);
        auth.allowPut(false);
        done();
    });

    describe('User Creation', function() {
        it('should create a new user on the server', function(done) {
            request(server)
                .post(conf.prePath + '/users.json?username=Bob&password=test')
                .expect('Content-Type', /json/)
                .expect(201)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    UserModel.findOne({
                            'username': 'Bob'
                        },
                        function(err, user) {
                            if (err) {
                                throw (err);
                            } else {
                                done();
                            }
                        });
                });
        });

        it('should fail to create a duplicate user', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                // second request
                request(server)
                  .post(conf.prePath + '/users.json?username=Bob&password=test2')
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

        it('should fail to create a user with no pass', function(done) {
            request(server)
                 .post(conf.prePath + '/users.json?username=Bob')
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

        it('should fail to create a user with no params', function(done) {
            request(server)
                 .post(conf.prePath + '/users.json')
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

    describe('User Deletion', function() {
        it('should delete user Bob', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                // second request
                request(server)
                  .del(conf.prePath + '/users/Bob.json')
                  .expect('Content-Type', /json/)
                  .expect(200)
                  .end(function(err, res) {
                      if (err) {
                          throw err;
                      }

                      res.body.deleted.should.match(true);

                      UserModel.findOne({
                            'username': 'Bob'
                        },
                        // should fail to find bob
                        function(err, user) {
                            if (err) {
                                throw err;
                            }
                            assert(user === null);
                            done();
                        });
                  });
            });
        });

        it('should fail to delete user Joe', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                // second request
                request(server)
                  .del(conf.prePath + '/users/Joe.json')
                  .expect('Content-Type', /json/)
                  .expect(404)
                  .end(function(err, res) {
                      if (err) {
                          throw err;
                      }

                      res.body.code.should.match("404 Not Found");

                      // This isnt really neccesary ... but w/e
                      UserModel.findOne({
                            'username': 'Bob'
                        },
                        // should still find Bob in db
                        function(err, user) {
                            if (err) {
                                throw err;
                            }

                            user.username.should.match("Bob");
                            done();
                        });
                  });
            });
        });
    });
   
    describe('Get Users', function() {
        it('should retrieve two users', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                // second request
                UserModel.addUser("Joe", "test", "simple", function(success) {
                    assert(success);

                    // get request
                    request(server)
                        .get(conf.prePath + '/users.json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }

                            res.body.users.length.should.equal(2);
                            res.body.users[0].username.should.be.ok;
                            res.body.users[0].role.should.be.ok;
                            res.body.users[1].username.should.be.ok;
                            res.body.users[1].role.should.be.ok;
                            res.body.length.should.equal(2);
                            done();
                        });
                  });
            });
        });
    });

    describe('Get User', function() {
        it('should retrieve Bob user', function(done) {
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

        it('should fail to retrieve Joe user', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                // second request
                request(server)
                    .get(conf.prePath + '/users/Joe.json')
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

    describe('Login', function() {
        it('should login as Bob user', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                // second request
                request(server)
                    .post(conf.prePath + '/users/login/?username=Bob&password=test')
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

        it('should fail to log in as Bob user with incorrect password', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                // second request
                request(server)
                    .post(conf.prePath + '/users/login/?username=Bob&password=test2')
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

        it('should fail to log in as Joe user', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                // second request
                request(server)
                    .post(conf.prePath + '/users/login/?username=Joe&password=test')
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

        it('should fail to log with no supplied user', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                // second request
                request(server)
                    .post(conf.prePath + '/users/login/')
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
    });

    describe('update User', function() {
        it('should update password of user Bob', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                var un = "Bob";
                var old_role = "simple";
                var old_pass = "test";
                // second request
                request(server)
                    .put(conf.prePath + '/users/Bob.json?password=test2')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }

                        res.body.username.should.match("Bob");
                        res.body.role.should.match(old_role);

                        request(server)
                            .post(conf.prePath + '/users/login?username=Bob&password=test2')
                            .expect('Content-Type', /json/)
                            .expect(200)
                            .end(function(err, res) {
                                if (err) {
                                    throw err;
                                }

                                res.body.login.should.match(true);
                                done();
                            });

                    });
            });
        });

        it('should update password of user Bob', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                var un = "Bob";
                var old_role = "simple";
                var old_pass = "test";
                // second request
                request(server)
                    .put(conf.prePath + '/users/Bob.json?role=admin')
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
 
        it('should fail to update user Joe', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                var un = "Bob";
                var old_role = "simple";
                var old_pass = "test";
                // second request
                request(server)
                    .put(conf.prePath + '/users/Joe.json?role=admin')
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

        it('should update password and role of user Bob', function(done) {
            UserModel.addUser("Bob", "test", "simple", function(success) {
                assert(success);
                var un = "Bob";
                var old_role = "simple";
                var old_pass = "test";
                // second request
                request(server)
                    .put(conf.prePath + '/users/Bob.json?password=test2&role=admin')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }

                        res.body.username.should.match("Bob");
                        res.body.role.should.match("admin");

                        // confirm login
                        request(server)
                            .post(conf.prePath + '/users/login?username=Bob&password=test2')
                            .expect('Content-Type', /json/)
                            .expect(200)
                            .end(function(err, res) {
                                if (err) {
                                    throw err;
                                }

                                res.body.login.should.match(true);
                                done();
                            });
                    });
            });
        });
    });
});
