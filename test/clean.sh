#!/bin/bash
mongo test --eval "db.dropDatabase();"
mongoimport -d test -c facilities $1/fixtures.json
