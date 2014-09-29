# Facility Registry restful api on Node.js

A restful api that will serve facility information + a few more details that 
will server both formhub and revisit (and w/e other services we see fit)

The service will conform to http://facilityregistry.org/ as best as possible

Start the server in one of the following ways:
````
node server.js
node server.js | ./node_modules/bunyan/bin/bunyan -l INFO
node server.js | ./node_modules/bunyan/bin/bunyan -l DEBUG
node server.js | ./node_modules/bunyan/bin/bunyan -l ERROR
````

## Extra Properties
* Number of times visited
* Survey info? Maybe? 
* ???

## Dependancies
* Restify: Defactor restapi builder
* Mongo: Document store, alot of node integration options
* Mongoose: Schema type layer for mongo, enforces facility format

## Intended dependancies
* restify-oauth2: auth server https://github.com/domenic/restify-oauth2 

## Possible alternatives
* Save: DB interation layer, allows us to swap mongodb without much code change
* Express: More involved stack then restify, has restify extension as well
* Mongojs: Exposes mongoapi directly


## Deployment
* ???

