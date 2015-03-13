'use strict';

var epub = require('../lib/epub')
var u = require('../lib/utils')

var assert = require('assert')

suite('epub', function() {

	setup(function() {
	})

	test('is_epub', function () {
		assert.equal(false, epub.is_epub())

		let b1 = new Buffer(1)
		let b2 = new Buffer(1)
		assert.equal(true, epub.is_epub([b1, b2]))

		assert.equal(false, epub.is_epub([b1]))

		b1.fill("P")
		b2.fill("K")
		assert.throws(function() {
			epub.is_epub([b1, b2])
		}, /epub/)

		let b3 = new Buffer(2)
		b3.write("PK")
		assert.throws(function() {
			epub.is_epub([b3])
		}, /epub/)

		b3.write("12")
		assert.doesNotThrow(function() {
			assert.equal(true, epub.is_epub([b3]))
		})
	})

	test('findSync', function () {
		let r = epub.findSync(".", /\.(js|html|xml)$/)
		assert(r.some(function(val) { return val === 'test_epub.js' }))
		assert(r.some(function(val) { return val.match(/^data\/html\/.+\.html$/) }))

		assert(epub.findSync(".").length > r.length)
	})

	test('findSync fail', function () {
//		console.log(r)
	})

})
