REPORTER = dot

test:
	./node_modules/.bin/mocha \
    --reporter $(REPORTER) \

test-w:
	./node_modules/.bin/mocha \
    --reporter $(REPORTER) \
    --growl \
    --watch

.PHONY: test test-w
