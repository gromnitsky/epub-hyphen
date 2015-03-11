'use strict';

var util = require('util')

var Hypher = require('hypher')
var xml2js = require('xml2js')

var u = require('./utils')
var meta = require('../package')
var epub = require('./epub')

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
	}

	// Return an ES6 promise.
	parse() {
		let func = this
		return epub.parseXML(this.str).then( (result) => {
//			console.log(util.inspect(result, { showHidden: true, depth: null }))
			func.doc = result
			func.walk(func.doc, null)
		})
	}

	tags_to_ignore_update() {
		if (!this.conf.tags_to_ignore) return
		let func = this			// FIXME: remove when v8 will be ready
		this.conf.tags_to_ignore.forEach(v => {
			func.TAGS_TO_IGNORE[v] = true
		})
	}

	walk(node, lang) {
		if (!node) return
		if (util.isArray(node)) {
			// several tags on the same level OR plain values
			for (let idx in node) {
				if (util.isString(node[idx])) {
					this.hyphenize(node, idx, lang)
				} else {
					u.vputs(1, `array ${idx}`)
					this.walk(node[idx], lang)
				}
			}
		} else {
			// an individual tag that may contain other tags
			if (node['$'] && node['$']['lang']) {
				// detect lang
				u.vputs(1, `FOUND lang \`${node['$']['lang']}\``)
				lang = node['$']['lang'].trim()
			}
			this.hyphenize(node, '_', lang)

			// enclosed tags
//			console.dir(node)
			for (let tag in node) {
				// we can filter out them here by name
				if (!this.is_node_eligible(tag)) continue

				if (tag === '$' || tag === '_') continue
				u.vputs(1, `walk ${tag}`)
				this.walk(node[tag], lang)
			}
		}
	}

	is_node_eligible(name) {
		if (name in this.TAGS_TO_IGNORE) {
			u.vputs(1, `ignoring ${name}`)
			return false
		}
		return true
	}

	// Modifies `node` in-place.
	hyphenize(node, key, lang) {
		if (!node || !node[key]) return
//		node[key] = node[key].toUpperCase()
		node[key] = this.lang(node, lang).hyphenateText(node[key])
	}

	// FIXME: map Hyper pattern names to BCP 47
	lang(node, lang) {
		let key = this.lang_chose(node, lang)
		if (key === 'en') key = 'en-us'
		if (key in this.constructor._lang) return this.constructor._lang[key]
		throw new Error(`no support for \`${key}\` lang`)
	}

	lang_chose(node, lang) {
		if (!this.conf.lang_detect) return this.conf.lang
		if (lang) {
			u.vputs(1, `USING DETECTED lang=${lang}`)
			return lang
		}
		return this.conf.lang
	}

	toString() {
		if (!this.doc) return ''

		let builder = new xml2js.Builder({
			xmldec: {version: '1.0', encoding: 'UTF-8'}
		})
		return builder.buildObject(this.doc)
	}

	static languages() {
		if (this._lang) return this._lang

		this._lang = {}
		for (let idx in meta.dependencies) {
			let m = idx.match(/^hyphenation\.([a-z.-]+)$/)
			if (!m) continue
			this._lang[m[1]] = new Hypher(require(idx))
		}

		return this._lang
	}
}

// static var, idiotic ES6
Hyphenizor._lang = null

module.exports = Hyphenizor
Hyphenizor.languages()
