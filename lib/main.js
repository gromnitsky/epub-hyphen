'use strict';

var util = require('util')

var program = require('commander')
var parse5 = require('parse5')

var rfs = require('./readFileSync')
var epub = require('./epub')
var meta = require('../package')
var u = require('./utils')
var hyphenize = require('./hyphenize')

var conf = {
	lang_detect: false,
	lang: "en",
	tags_to_ignore: [],
	output: null
}

// TODO
var lang = function(val) {
	let t = {
		'en': 1,
		'uk': 1
	}
	val = val.trim()
	return (val in t) ? val : ""
}

var tags_to_ignore = function(val) {
	return val.split(',').filter((v) => v.match(/^[a-zA-Z0-9_-]+$/))
}

var input_read = function(file) {
	if (!file) file = '/dev/stdin'
	let r = {}
	try {
		r.buf = rfs(file, epub.is_epub)
	} catch (e) {
		if (e.message === 'epub' && file === '/dev/stdin')
			u.errx(1, "epub in stdin isn't allowed")

		if (e.message === 'epub') {
			r.epub = true
			r.buf = null
			return r
		}
		u.errx(1, e.message)
	}
	return r
}

program
    .version(meta.version)
    .usage("-l lang [-d] [-i tag1,tag2,...] [-o output] [input]")
    .option('-l, --lang <str>', '2 letters', lang)
    .option('-i, --tags-to-ignore <str>', 'a comma-sep list of tags', tags_to_ignore)
    .option('-d, --lang-detect', 'try to detect language via lang attr')
    .option('-o, --output <file>', 'write to a file instead of stdout')
    .parse(process.argv)

conf.lang_detect = program.langDetect
conf.output = program.output
if (util.isString(program.lang)) conf.lang = program.lang
if (program.tagsToIgnore) conf.tags_to_ignore = program.tagsToIgnore

//console.log(conf)
if (conf.lang === "") u.errx(1, "no supported lang provided")

let input = input_read(program.args[0])
if (input.epub) {
	console.error("TODO: unzip epub")
} else {
	let parser = new parse5.Parser()
	let doc = parser.parse(input.buf.toString())
//	console.log(util.inspect(doc, { showHidden: true, depth: null }))
	hyphenize.walk(doc, hyphenize.hyphenize, conf)

	let serializer = new parse5.Serializer()
	process.stdout.write(serializer.serialize(doc))
}