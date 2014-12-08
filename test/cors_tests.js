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

describe('CORS Tests', function(done) {

    var the_uuid = null;
    var the_user = null;

    // Before begining tests, populate the db with Users.
    before(function(done) {
        done();
    });

    beforeEach(function(done) {
        // wipe db
        // SiteModel.find({}).remove(function(err, result) {
        //     // load db
        //     SiteModel.collection.insert(sites, function(err, result) {
        //         if (err) throw (err);

        //         // get an example uuid with specific coords
        //         SiteModel.findOne({}, function(err, site) {
        //             if (err) throw (err);
        //             the_uuid = site.uuid;

        //             // clear out users
        //             UserModel.find({}).remove(function(err, result) {
        //                 done();
        //             });
        //         });
        //     });
        // });
        done();
    });

    afterEach(function(done) {
        // auth.useAuth(false);
        // auth.allowGet(true);
        // auth.allowPost(false);
        // auth.allowPut(false);
        done();
    });

    describe('Request Methods', function() {
        
        it('should allow OPTIONS requests to determine CORS values', function(done) {

            request(server)
                .options(conf.prePath + "/facilities.json")
                .expect(204)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                });

        });

        it('should return a 405 for other unsupported trace method', function(done) {

            request(server)
                .trace(conf.prePath + "/facilities.json")
                .expect(405)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                });

        });

    });
});
