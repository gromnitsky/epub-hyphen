'use strict';

var path = require('path')

exports.VERBOSE = 0

exports.pnGet = function() {
	return path.basename(process.argv[1])
}

exports.vputs = function(level /*, ...args */) {
	if (arguments.length < 2) throw new Error('vputs needs more args')
	if (level > exports.VERBOSE) return

	console.error.apply(this, Array.prototype.slice.call(arguments, 1))
}

exports.errx = function(exit_code, msg) {
	exports.vputs(0, `${exports.pnGet()} error: ${msg}`)
	if (exit_code) process.exit(exit_code)
}

exports.warnx = function(msg) {
	exports.vputs(0, `${exports.pnGet()} warning: ${msg}`)
}

exports.hash_size = function(hash) {
	return Object.keys(hash).length
}
