'use strict';

var path = require('path')
var util = require('util')
var meta = require('../package')

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

exports.errstack = function(exit_code, level, err) {
	if (level <= exports.VERBOSE) console.error(err.stack)
	if (exit_code) process.exit(exit_code)
}

exports.warnx = function(msg) {
	exports.vputs(0, `${exports.pnGet()} warning: ${msg}`)
}

exports.hash_size = function(hash) {
	return Object.keys(hash).length
}

exports.inspect = function(obj) {
	console.log(util.inspect(obj, { showHidden: true, depth: null }))
}

exports.user_agent = function() {
	return `${meta.name}/${meta.version} (${process.platform}; ${process.arch}) node/${process.versions.node}`
}
