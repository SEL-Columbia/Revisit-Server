# Facility Registry API Server

A RESTful API that serves basic facility information, designed for simple integration with other applications that use facilities. Revisit provides endpoints for querying facilities by various properties such as location, name, and type as well as ways to update and add your own facility data.

Revisit aims to be a global repository for facility data. Revisit offers context for your application in areas where a simple map does not provide enough direction.

[![Build Status](https://travis-ci.org/SEL-Columbia/Revisit-Server.png)](https://travis-ci.org/SEL-Columbia/Revisit-Server)

Although we are not limiting the data to health sector facilities, the service will conform to the [FRED API specification](http://facilityregistry.org/) as closely as possible, with several extensions.

For details on setting up a local dev enviroment, [see the wiki](https://github.com/SEL-Columbia/Revisit-Server/wiki/Setting-Up-a-Local-Environment).

For an indepth look at our api, [see the api docs](https://github.com/SEL-Columbia/Revisit-Server/wiki/API-Documentation-v0.2.1).


## Dependencies
* restify: REST API framework for node.js
* mongo: Document store, a lot of node integration options
* mongoose: ODM for mongo, enforces facility format
* mongoose-rollback: versioning plugin for mongoose
* jshashes: hashing basic auth passwords
* mkdirp: simple recursive directory creation for photos
* bunyan: logger
* mocha: For BDD testing
* supertest: for testing requests
* should: readable asserts 

## Deployment
* Ruby based deployment via [Capistrano](http://capistranorb.com). For details on deployment, [see the  wiki](https://github.com/SEL-Columbia/Revisit-Server/wiki/Deployment).
