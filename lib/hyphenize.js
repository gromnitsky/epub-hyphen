'use strict';

var util = require('util')

var Hypher = require('hypher')
var xamel = require('xamel')

var u = require('./utils')
var meta = require('../package')
var epub = require('./epub')

class Hyphenizor {

	constructor(str, conf) {
		this.str = str
		this.conf = conf

		if (!util.isString(str)) throw new Error('str is requred')
		if (!util.isObject(conf)) throw new Error('conf obj is requred')

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
//			u.inspect(result)
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

		if (!node.children) {
			// comment
			u.vputs(2, `comment: ${node}`)
			return
		}

		let func = this
		for (let idx in node.children) {
			let child = node.children[idx]

			if (util.isString(child)) {
				this.hyphenize(node.children, idx, lang)
				u.vputs(2, `TEXT: \`${child}\``)
			} else {
				if (!this.is_node_eligible(child.name)) continue

				u.vputs(2, `tag: ${child.name}`)
				u.vputs(2, `attrs: ${util.inspect(child.attrs, { showHidden: true, depth: null })}`)
				if (child.attrs && child.attrs.lang) {
					// TODO: check if `child.attrs.lang` is empty
					func.walk(child, child.attrs.lang)
				} else {
					func.walk(child, lang)
				}
			}
		}
	}

	is_node_eligible(name) {
		if (!name) return true

		if (name.toLowerCase() in this.TAGS_TO_IGNORE) {
			u.vputs(2, `ignoring ${name}`)
			return false
		}
		return true
	}

	// Modifies node in-place.
	hyphenize(arr, index, lang) {
		if (!arr || !arr[index]) return
//		arr[index] = arr[index].toUpperCase()
		arr[index] = this.lang(lang).hyphenateText(arr[index])
	}

	// FIXME: map Hyper pattern names to BCP 47
	lang(lang) {
		let key = this.lang_chose(lang)
		if (key === 'en') key = 'en-us'
		if (key in this.constructor._lang) {
			// load lang patterns dynamically on request
			if (!this.constructor._lang[key]) {
				u.vputs(1, `loading lang pattern: ${key}`)
				this.constructor._lang[key] = new Hypher(require(`hyphenation.${key}`))
			}
			return this.constructor._lang[key]
		}
		throw new Error(`no support for \`${key}\` lang`)
	}

	lang_chose(lang) {
		if (!this.conf.lang_detect) return this.conf.lang
		if (lang) {
			u.vputs(2, `USING DETECTED lang=${lang}`)
			return lang
		}
		return this.conf.lang
	}

	toString() {
		if (!this.doc) return ''
		return "<?xml version='1.0' encoding='utf-8'?>\n"
			+ xamel.serialize(this.doc, {header: false})
	}

	static languages() {
		if (this._lang) return this._lang

		this._lang = {}
		for (let idx in meta.dependencies) {
			let m = idx.match(/^hyphenation\.([a-z.-]+)$/)
			if (!m) continue
			this._lang[m[1]] = null
		}

		return this._lang
	}
}

// static var, idiotic ES6
Hyphenizor._lang = null

module.exports = Hyphenizor
Hyphenizor.languages()
