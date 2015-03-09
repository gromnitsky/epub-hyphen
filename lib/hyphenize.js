'use strict';

var util = require('util')

var parse5 = require('parse5')

var u = require('./utils')
var meta = require('../package')

class Hyphenizor {

	constructor(str, conf) {
		this.str = str
		this.conf = conf

		this.TAGS_TO_IGNORE = {
			"applet": true,
			"base": true,
			"basefont": true,
			"br": true,
			"frame": true,
			"frameset": true,
			"iframe": true,
			"param": true,
			"script": true,

			"head": true,
			"style": true,
			"hr": true,
			"code": true,
			"var": true,
			"pre": true,
			"kbd": true,
			"img": true,

			"embed": true,
			"object": true,
			"video": true,
			"audio": true,
			"track": true,
			"canvas": true,
			"source": true,

			"input": true,
			"output": true,
			"progress": true,
			"meter": true,
			"marquee": true,
			"button": true,
			"select": true,
			"datalist": true,
			"optgroup": true,
			"option": true,
			"textarea": true,
			"keygen": true,

			"map": true,
			"area": true,

			"menu": true,
			"menuitem": true
		}
		this.tags_to_ignore_update()

		let parser = new parse5.Parser()
		this.doc = parser.parse(str)
		this.walk(this.doc)
	}

	tags_to_ignore_update() {
		if (!this.conf.tags_to_ignore) return
		let func = this			// FIXME: remove when v8 will be ready
		this.conf.tags_to_ignore.forEach(v => {
			func.TAGS_TO_IGNORE[v] = true
		})
	}

	walk(node) {
		if (!node.childNodes || node.childNodes.length == 0) return

		let func = this			// FIXME: remove when v8 will be ready
		node.childNodes.forEach(child => {
			if (func.is_node_eligible(child)) {
				if (!child.childNodes || child.childNodes.length == 0) {
					func.hyphenize(child)
				} else {
					func.walk(child)
				}
			}
		})
	}

	is_node_eligible(node) {
		if (node.nodeName in this.TAGS_TO_IGNORE) {
			console.log(`ignoring ${node.nodeName}`)
			return false
		}
		return true
	}

	// TODO
	// Modifies `node` in-place.
	hyphenize(node) {
		if (node.nodeName !== '#text') return false
		node.value = node.value.toUpperCase()
	}


	toString() {
		let serializer = new parse5.Serializer()
		return serializer.serialize(this.doc)
	}

	static languages() {
		if (this._lang) return this._lang

		this._lang = {}
		for (let idx in meta.dependencies) {
			let m = idx.match(/^hyphenation\.([a-z.-]+)$/)
			if (m) this._lang[m[1]] = true
		}

		return this._lang
	}
}

// static var, idiotic ES6
Hyphenizor._lang = null

module.exports = Hyphenizor
