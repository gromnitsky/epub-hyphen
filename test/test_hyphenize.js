'use strict';

var Hyphenizor = require('../lib/hyphenize')
var u = require('../lib/utils')

var assert = require('assert')

suite('Hyphenizor', function() {

	setup(function() {
	})

	test('Hyphenizor.languages', function () {
		Hyphenizor._lang = null
		let r = Hyphenizor.languages()
		assert(u.hash_size(r) >= 2)
		assert(u.hash_size(Hyphenizor._lang) >= 2)
	})

	test('tags_to_ignore_update', function () {
		let conf = {}
		let h = new Hyphenizor('', conf)
		let tags_len = u.hash_size(h.TAGS_TO_IGNORE)
		conf.tags_to_ignore = [1,2]
		h.tags_to_ignore_update()

		assert.equal(tags_len + 2, u.hash_size(h.TAGS_TO_IGNORE))
	})

	test('is_node_eligible', function () {
		let conf = {}
		let h = new Hyphenizor('', conf)

		assert.equal(false, h.is_node_eligible('hr'))
		assert.equal(true, h.is_node_eligible('p'))
	})

	test('lang_chose', function () {
		let conf = {lang: 'en'}
		let h = new Hyphenizor('', conf)
		assert('en', h.lang_chose(null))

		conf = {lang_detect: true, lang: 'uk'}
		h = new Hyphenizor('', conf)
		assert('uk', h.lang_chose(null))

		conf = {lang_detect: true, lang: 'es'}
		h = new Hyphenizor('', conf)
		assert('uk', h.lang_chose('uk'))
	})

	test('lang', function () {
		let conf = {lang: 'qwerty'}
		let h = new Hyphenizor('', conf)
		assert.throws(function() {
			h.lang(null)
		}, /no support for/)

		conf = {lang: 'en'}
		h = new Hyphenizor('', conf)
		assert(h.lang(null))
	})

	test('hyphenize', function () {
		let node = { '_': '2 characters' }
		let conf = {lang: 'en'}
		let h = new Hyphenizor('', conf)
		h.hyphenize(node, '_', null)
		assert.equal('2 char­ac­ters', node['_'])

		node = { '_': '2 characters' }
		conf = {lang: 'uk'}
		h = new Hyphenizor('', conf)
		h.hyphenize(node, '_', null)
		assert.equal('2 characters', node['_'])
	})

	test('parse invalid xml', function(done) {
		let conf = {}
		let h = new Hyphenizor('<', conf)
		h.parse().catch(function(e) {
			assert(e.message.match(/Unclosed root tag/))
			done()
		});
	})

	test('parse empty input', function(done) {
		let conf = {}
		let h = new Hyphenizor('', conf)
		h.parse().then(function(r) {
			assert.equal('', h.toString())
			done()
		}).catch(function(e) {
			console.log(e)
		})
	})

	test('parse too simple xml', function(done) {
		let conf = {}
		let h = new Hyphenizor('<foo>characters</foo>', conf)
		h.parse().catch(function(e) {
			assert(e.message.match(/too simple xml/))
			done()
		})
	})

	test('parse 01 no lang', function(done) {
		let conf = {}
		let h = new Hyphenizor('<html><foo>characters</foo></html>', conf)
		h.parse().catch(function(e) {
			assert(e.message.match(/no support for .+ lang/))
			done()
		})
	})

	test('parse 01', function(done) {
		let conf = {lang: 'en'}
		let h = new Hyphenizor('<html><foo>characters</foo></html>', conf)
		h.parse().then(function(r) {
//			console.log(h.toString())
			assert.equal(`<?xml version="1.0" encoding="UTF-8"?>
<html>
  <foo>char­ac­ters</foo>
</html>`, h.toString())
			done()
		}).catch(function(e) {
			console.log(e)
		})
	})

	test('parse 02', function(done) {
		let conf = {lang_detect: true}
		let h = new Hyphenizor('<html lang="uk"><foo lang="en">characters</foo>Данко</html>', conf)
		h.parse().then(function(r) {
//			console.log(h.toString())
			assert.equal(`<?xml version="1.0" encoding="UTF-8"?>
<html lang="uk">
  Дан­ко
  <foo lang="en">char­ac­ters</foo>
</html>`, h.toString())
			done()
		}).catch(function(e) {
			console.log(e)
		})
	})

})
