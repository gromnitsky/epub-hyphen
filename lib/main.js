'use strict';

var util = require('util')

var program = require('commander')

var rfs = require('./readFileSync')
var epub = require('./epub')
var meta = require('../package')
var u = require('./utils')
var Hyphenizor = require('./hyphenize')

var conf = {
	lang_detect: false,
	lang: "en",
	tags_to_ignore: [],
	output: null
}

var lang = function(val) {
	return val.trim().toLowerCase()
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
    .option('-v', 'be more verbose', (v) => u.VERBOSE++)
    .parse(process.argv)

conf.lang_detect = program.langDetect
conf.output = program.output
if (util.isString(program.lang)) conf.lang = program.lang
if (program.tagsToIgnore) conf.tags_to_ignore = program.tagsToIgnore

u.vputs(1, conf)

let input = input_read(program.args[0])
if (input.epub) {
	console.error("TODO: unzip epub")
} else {
	let hyp = new Hyphenizor(input.buf.toString(), conf)

	process.stdout.write(hyp.toString())
}
