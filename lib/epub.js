'use strict';

var spawnSync = require('child_process').spawnSync
var path = require('path')
var fs = require('fs')

var tmp = require('tmp')
var mkdirp = require('mkdirp')
var xamel = require('xamel')
var rimraf = require('rimraf')

var meta = require('../package.json')

// like xamel find() but return a 1st non-empty result from an array
// of `expressions`. if every expression has empty result, just return
// the last one.
let myfind = function(nodeset, expressions) {
    if (!nodeset || !expressions) { return null }

    for (let val of expressions) {
	let ns = nodeset.find(val)
//	console.log(ns, ns.length)
	if (ns.length > 0) { return ns }
    }
    return nodeset.find(expressions[expressions.length - 1])
}

// Return an ES6 promise
exports.parseXML = function(str) {
    return new Promise( (resolve, reject) => {
	xamel.parse(str, {strict: true, trim: false, cdata: true}, (err, result) => {
	    if (err) {
		reject(err)
	    } else {
		resolve(result)
	    }
	})
    })
}

exports.findSync = function(start_dir, pattern) {
    let all = fs.readdirSync(start_dir).map( (val) => path.join(start_dir, val))
    let files = all.filter( (val) => {
	return val.match(pattern) && fs.statSync(val).isFile()
    })

    all.filter( (val) => {
	return fs.statSync(val).isDirectory()
    }).forEach( (dir) => {
	files = files.concat(exports.findSync(dir, pattern))
    })

    return files
}

class Zip {
    constructor(dir) {
	mkdirp.sync(dir)
	this.dir = tmp.dirSync({ template: `${dir}/${meta.name}-XXXXXX` })
	this.dir_epub = path.join(this.dir.name, 'epub')
	mkdirp.sync(this.dir_epub)

	this.log_zip = path.join(this.dir.name, 'zip.log')
	this.log_zip_fd = fs.openSync(this.log_zip, 'w+')

	this.log_unzip = path.join(this.dir.name, 'unzip.log')
	this.log_unzip_fd = fs.openSync(this.log_unzip, 'w+')

	this.cmd_zip = 'zip'
	this.cmd_unzip = 'unzip'
    }

    cleanup(cb) {
	if (!cb) throw new Error('callback is required')
	try {
	    fs.closeSync(this.log_zip_fd)
	    fs.closeSync(this.log_unzip_fd)
	} catch (e) {
	    // ignore
	}
	let func = this
	rimraf(this.dir.name, () => {
	    cb(func.dir.name)
	})
    }

    unzip(file) {
	return spawnSync(this.cmd_unzip, [file, '-d', this.dir_epub],
			 { stdio: [0, this.log_unzip_fd, this.log_unzip_fd] })
    }

    zip(tofile) {
	let save_dir = process.cwd()
	tofile = path.resolve(tofile)

	process.chdir(this.dir_epub)
	let r = spawnSync(this.cmd_zip, ['-X', '-r', tofile, 'mimetype', '.'],
			  { stdio: [0, this.log_zip_fd, this.log_zip_fd] })
	process.chdir(save_dir)
	return r
    }

    // Return a ES6 promise.
    //
    // file must me unzipped already
    content_opf() {
	let func = this
	let opf = path.join(this.dir_epub, 'META-INF', 'container.xml')
	try {
	    var str = fs.readFileSync(opf).toString()
	} catch (e) {
	    return Promise.reject(e)
	}
	return exports.parseXML(str).then( (r) => {
	    try {
		let file = r.find('container/rootfiles/rootfile').children[0].attrs['full-path']
		return path.join(func.dir_epub, file)
	    } catch (e) {
		throw new Error(`invalid ${opf}: ${e}`)
	    }
	})
    }

    // Return a ES6 promise w/ the 1st language match.
    //
    // file must me unzipped already
    lang() {
	return this.content_opf().then( (file) => {
	    return exports.parseXML(fs.readFileSync(file).toString()).then( (r) => {
		return myfind(r, ['package/metadata/dc:language/text()',
				  'package/*/dc:language/text()'])
		    .text(true)[0] || null
	    })
	})
    }

}

exports.Zip = Zip
