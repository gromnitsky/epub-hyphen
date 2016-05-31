TEST_OPTS :=
mocha := node_modules/.bin/mocha
mocha_opt := -u tdd

.PHONY: test
test: node_modules
	@cd test && ../$(mocha) $(mocha_opt) test*.js $(TEST_OPT)

node_modules: package.json
	npm install
	touch $@

.PHONY: nuke
nuke:
	rm -rf node_modules
