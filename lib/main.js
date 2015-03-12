'use strict';

var util = require('util')
var fs = require('fs')
var path = require('path')

var program = require('commander')

var rfs = require('./readFileSync')
var epub = require('./epub')
var meta = require('../package')
var u = require('./utils')
var Hyphenizor = require('./hyphenize')

var conf = {
	// for Hyphenizor
	lang_detect: false,
	lang: null,
	tags_to_ignore: [],

	// cli only
	output: null,
	tmpdir_prefix: 'tmp',
	clean: [],
	epub_xml_files: /\.(html|xhtml)$/
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
		u.errx(0, e.message)
		u.errstack(1, 1, e)
	}
	return r
}

var clean = function() {
	u.vputs(1, 'cleanup')
	conf.clean.forEach( (fun) => fun.call() )
}

var clean_setup = function() {
	process.on('SIGTERM', clean)
	process.on('SIGINT', clean)
	process.on('SIGHUP', clean)
	process.on('SIGBREAK', clean)
}

var do_unzip = function(zip) {
	u.vputs(1, "epub: unzipping")
	let r = zip.unzip(program.args[0])
	if (r.error) u.errx(1, r.error.message)
	if (r.status !== 0) u.errx(1, `see ${zip.log_unzip}`)
}

var do_zip = function(zip) {
	u.vputs(1, 'epub: zip')
	let r = zip.zip(conf.output)
	if (r.error) u.errx(1, r.error.message)
	if (r.status !== 0) u.errx(1, `see ${zip.log_zip}`)
}

var lang_epub_update = function(val) {
	u.vputs(1, `epub: lang: ${val}`)
	if (val && !conf.lang) conf.lang = val
	if (!conf.lang) u.errx(1, "-l is required, because the language wasn't specified in the book")
	u.vputs(1, `epub: using lang ${conf.lang}`)
}



clean_setup()

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
conf.lang = program.lang
if (program.tagsToIgnore) conf.tags_to_ignore = program.tagsToIgnore

u.vputs(2, conf)

let input = input_read(program.args[0])
if (input.epub) {
	if (!conf.output) u.errx(1, "-o <file> is required")

	// create tmp dirs
	let zip = new epub.Zip(conf.tmpdir_prefix)
	// set cleanup
	conf.clean.push( () => {
		zip.cleanup( (dir) => u.vputs(1, `epub: rm -rf ${dir}`) )
	})

	do_unzip(zip)

	zip.lang().then( (r) => {
		lang_epub_update(r)

		let promises = []
		let files = epub.findSync(zip.dir_epub, conf.epub_xml_files)
		for (let idx in files) {
			let xml = fs.readFileSync(files[idx]).toString()
			let hyp = new Hyphenizor(xml, conf)
			promises.push(hyp.parse().then( () => {
				u.vputs(1, 'epub: %d/%d: %s', parseInt(idx)+1, files.length, files[idx])
				let tmp = files[idx] + '.tmp'
				fs.writeFileSync(tmp, hyp.toString())
				fs.renameSync(tmp, files[idx])
				u.vputs(1, 'epub: %d/%d: DONE', parseInt(idx)+1, files.length)
			}))
		}
		return Promise.all(promises)

	}).then ( () => {
		do_zip(zip)
		clean()

	}).catch( (e) => {
		u.errx(0, e.message)
		u.errstack(1, 1, e)
	});

} else {
	if (!conf.lang) u.errx(1, "-l is required")

	let output = conf.output ? fs.createWriteStream(conf.output) : process.stdout

	let hyp = new Hyphenizor(input.buf.toString(), conf)
	hyp.parse().then( () => {
		output.write(hyp.toString())
		if (output.path) output.end()

	}).catch( (err) => {
		u.errx(0, 'xml: ' + err.message)
		u.errstack(1, 1, err)
	})
}
