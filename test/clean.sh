#!/bin/bash
#TODO: test db name hardcoded here, should be passed in from conf
mongo test --eval "db.dropDatabase();"
mongoimport -d test -c facilities $1/fixtures.json
