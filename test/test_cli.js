'use strict';

var epub = require('../lib/epub')
var u = require('../lib/utils')

var assert = require('assert')
var fs = require('fs')
var spawnSync = require('child_process').spawnSync

var mkdirp = require('mkdirp')
var rimraf = require('rimraf')

var cmd = '../bin/epub-hyphen'

suite('CLI xml', function() {

	setup(function() {
	})

	test('empty stdin', function () {
		let r = spawnSync(cmd, {input: ''})
		assert.equal(1, r.status)
		assert(r.stderr.toString().match(/-l is required/))

		r = spawnSync(cmd, ['-l', 'en'], {input: ''})
		assert.equal(1, r.status)
		assert(r.stderr.toString().match(/Unexpected end/))
	})

	test('no hyphenation', function () {
		let r = spawnSync(cmd,  ['-l', 'en'], {input: '<foo/>'})
		assert.equal(0, r.status)
		assert.equal(`<?xml version='1.0' encoding='utf-8'?>
<foo/>`, r.stdout.toString())
	})

	test('1 tag', function () {
		let r = spawnSync(cmd,  ['-l', 'en'], {input: '<foo>foobar</foo>'})
		assert.equal(0, r.status)
		assert.equal(`<?xml version='1.0' encoding='utf-8'?>
<foo>foo­bar</foo>`, r.stdout.toString())
	})

	test('custom ignore tags', function () {
		let r = spawnSync(cmd,  ['-l', 'en', '-i', 'bar,baz'],
						  {input:'<foo>foobar<bar>foobar</bar><baz>foobar</baz></foo>'})
		assert.equal(0, r.status)
		assert.equal(`<?xml version='1.0' encoding='utf-8'?>
<foo>foo­bar<bar>foobar</bar><baz>foobar</baz></foo>`, r.stdout.toString())
	})

	test('2 languages, no lang detection', function () {
		let r = spawnSync(cmd,  ['-l', 'uk'],
						  {input: '<foo><bar lang="en">foobar</bar>отакої</foo>'})
		assert.equal(0, r.status)
		assert.equal(`<?xml version='1.0' encoding='utf-8'?>
<foo><bar lang="en">foobar</bar>ота­кої</foo>`, r.stdout.toString())
	})

	test('2 languages, lang detection', function () {
		let r = spawnSync(cmd,  ['-d', '-l', 'uk'],
						  {input: '<foo><bar lang="en">foobar</bar>отакої</foo>'})
		assert.equal(0, r.status)
		assert.equal(`<?xml version='1.0' encoding='utf-8'?>
<foo><bar lang="en">foo­bar</bar>ота­кої</foo>`, r.stdout.toString())
	})

	test('file not found', function () {
		let r = spawnSync(cmd,  ['-l', 'en', 'doesn not exist'])
		assert.equal(1, r.status)
		assert(r.stderr.toString().match(/no such file or directory, open 'doesn not exist'/));
	})

})

suite('CLI epub', function() {

	setup(function() {
		mkdirp("tmp")
	})

	teardown(function() {
		rimraf.sync("tmp")
	})

	test('epub in stdin', function () {
		let r = spawnSync(cmd,  {input: fs.readFileSync('data/epub/Les_Podervyansky--Plays.epub')})
		assert.equal(1, r.status)
		assert(r.stderr.toString().match(/epubs aren't allowed/));
	})

	test('simple.epub', function () {
		let r = spawnSync(cmd,  ["-d", '-o', 'tmp/simple.epub', 'data/epub/simple.epub'])
		assert.equal(0, r.status)
		assert.equal('', r.stdout.toString())
		assert.equal('', r.stderr.toString())

		let s = fs.statSync('tmp/simple.epub')
//		u.inspect(s)
		assert(s.size > 2000 && s.size < 4000)
	})

})
