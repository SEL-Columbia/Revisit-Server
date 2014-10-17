# Facility Registry API Server

A RESTful API that serves basic facility information, designed for simple integration with other applications that use facilities.

[![Build Status](https://travis-ci.org/SEL-Columbia/Revisit-Server.png)](https://travis-ci.org/SEL-Columbia/Revisit-Server)

Although we are not limiting the data to health sector facilities, the service will conform to the [FRED API specification](http://facilityregistry.org/) as closely as possible, with several extensions.

For details on setting up a local dev enviroment, [see the wiki](https://github.com/SEL-Columbia/Revisit-Server/wiki/Setting-Up-a-Local-Environment).

# Notes

## Extra Properties
* Number of times visited
* Sector
* Type
* Does the facility have power?

## Dependencies
* Restify: REST API framework for node.js
* Mongo: Document store, a lot of node integration options
* Mongoose: ODM for mongo, enforces facility format
* jshashes: hashing basic auth passwords
* mkdirp: simple recursive directory creation for photos
* bunyan: logger
* mocha: For BDD testing
* supertest: for testing requests
* should: readable asserts 

## Possible Alternatives
* Save: DB interaction layer, allows us to swap mongodb without much code change
* Express: More involved stack then restify, has restify extension as well
* Mongojs: Exposes mongoapi directly


## Deployment
* Ruby based deployment vai [Capistrano](http://capistranorb.com). For details on deployment, [see the  wiki](https://github.com/SEL-Columbia/Revisit-Server/wiki/Deployment).
