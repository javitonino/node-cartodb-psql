all:
	npm install

clean:
	rm -rf node_modules/*

jshint:
	@echo "***jshint***"
	@./node_modules/.bin/jshint lib/ test/


test:
	@echo "***tests***"
	test/run_tests.sh ${RUNTESTFLAGS}

test-all: jshint test

.PHONY: test
