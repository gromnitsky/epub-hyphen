'use strict';

var epub = require('../lib/epub')
let magic = require('../lib/magic')

var assert = require('assert')
var fs = require('fs')
var spawnSync = require('child_process').spawnSync

var rimraf = require('rimraf')

suite('epub', function() {

    setup(function() {
    })

    test('is zip', function(done) {
	let stream = fs.createReadStream('data/epub/Les_Podervyansky--Plays.epub')
	magic.check_stream(stream, magic.is_zip, (err, result) => {
	    assert.equal(err, null)
	    assert(result)
	    done()
	})
    })

    test('not zip', function(done) {
	let stream = fs.createReadStream('data/zip/broken.zip')
	magic.check_stream(stream, magic.is_zip, (err, result) => {
	    assert.equal(err, null)
	    assert.equal(result, false)
	    done()
	})
    })

    test('findSync', function () {
	let r = epub.findSync(".", /\.(js|html|xml)$/)
	assert(r.some(function(val) { return val === 'test_epub.js' }))
	assert(r.some(function(val) { return val.match(/^data\/html\/.+\.html$/) }))

	assert(epub.findSync(".").length > r.length)
    })

})

suite('Zip', function() {

    setup(function() {
	this.z = new epub.Zip("tmp")
    })

    teardown(function(done) {
	this.z.cleanup(function(name) {
	    //			console.log(`rm -r ${name}`)
	    done()
	})
    })

    suiteTeardown(function() {
	rimraf.sync("tmp")
    })

    test('cleanup', function (done) {
	let zz = new epub.Zip("tmp")

	assert.throws(function() {
	    zz.cleanup()
	}, /callback is required/)

	zz.cleanup(function(name) {
	    done()
	})
    })

    test('unzip', function () {
	let r = this.z.unzip()
	assert.equal(9, r.status)

	r = this.z.unzip('data/zip/broken.zip')
	assert.equal(9, r.status)

	r = this.z.unzip('data/zip/meta-is-missing.zip')
	assert.equal(0, r.status)

	this.z.cmd_unzip = 'does not exist'
	r = this.z.unzip('data/zip/meta-is-missing.zip')
	assert.equal('ENOENT', r.error.code)
    })

    test('content_opf no file', function (done) {
	let r = this.z.unzip('data/zip/meta-is-missing.zip')
	assert.equal(0, r.status)

	this.z.content_opf().catch(function(e) {
	    assert(e.message.match(/no such file or directory, open .+\/META-INF\/container.xml/))
	    done()
	});
    })

    test('content_opf', function (done) {
	let r = this.z.unzip('data/zip/meta-broken.zip')
	assert.equal(0, r.status)

	this.z.content_opf().then(function(r) {
	    assert(r.match(/.+\/epub\/SVG\/Sandman.opf$/))
	    done()
	})
    })

    test('lang no file', function (done) {
	let r = this.z.unzip('data/zip/meta-broken.zip')
	assert.equal(0, r.status)

	this.z.lang().catch(function(e) {
	    assert(e.message.match(/no such file or directory, open .+\/epub\/SVG\/Sandman.opf/))
	    done()
	});
    })

    test('lang no lang', function (done) {
	let r = this.z.unzip('data/zip/meta-no-lang.zip')
	assert.equal(0, r.status)

	this.z.lang().then(function(r) {
	    assert.equal(null, r)
	    done()
	}).catch(function(e) {
	    console.log(e)
	});
    })

    test('lang', function (done) {
	let r = this.z.unzip('data/zip/meta.zip')
	assert.equal(0, r.status)

	this.z.lang().then(function(r) {
	    assert.equal('en', r)
	    done()
	})
    })

    test('lang in peru', function (done) {
	let r = this.z.unzip('data/epub/peru.epub')
	assert.equal(0, r.status)

	this.z.lang().then(function(r) {
	    assert.equal('en', r)
	    done()
	}).catch(function(e) {
	    console.log(e)
	});
    })

    test('zip', function() {
	let r = this.z.unzip('data/zip/meta.zip')
	assert.equal(0, r.status)

	r = this.z.zip("tmp/meta.zip")
	assert.equal(0, r.status)

	r = spawnSync('zipcmp', ['data/zip/meta.zip', "tmp/meta.zip"])
	assert.equal(0, r.status)

	fs.unlinkSync("tmp/meta.zip")

	this.z.cmd_zip = 'does not exist'
	r = this.z.zip("tmp/meta.zip")
	assert.equal('ENOENT', r.error.code)
    })

})
