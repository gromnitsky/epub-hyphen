'use strict';

var path = require('path')

exports.QUIET = false

exports.pnGet = function() {
	return path.basename(process.argv[1])
}

exports.errx = function(exit_code, msg) {
	if (!exports.QUIET) console.error(`${exports.pnGet()} error: ${msg}`)
	if (exit_code) process.exit(exit_code)
}

exports.warnx = function(msg) {
	if (!exports.QUIET) console.error(`${exports.pnGet()} warning: ${msg}`)
}

exports.hash_size = function(hash) {
	return Object.keys(hash).length
}
