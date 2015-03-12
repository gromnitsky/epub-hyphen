TEST_OPTS :=
mocha := node_modules/.bin/mocha
mocha_opt := --harmony --harmony_arrow_functions -u tdd

.PHONY: test
test:
	@cd test && ../$(mocha) $(mocha_opt) test*.js $(TEST_OPTS)
