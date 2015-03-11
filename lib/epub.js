'use strict';

var spawnSync = require('child_process').spawnSync
var path = require('path')
var fs = require('fs')

var tmp = require('tmp')
var mkdirp = require('mkdirp')
var xml2js = require('xml2js')

var meta = require('../package.json')

exports.is_epub = function(chunks) {
	if (!chunks || chunks.length == 0) return false

	let done = false
	let buf = Buffer.concat(chunks)
	// the magic bytes for the ZIP format
	if ("PK" === buf.slice(0, 2).toString()) throw new Error('epub')
	if (buf.length >= 2) done = true

	return done
}

// Return an ES6 promise
exports.parseXML = function(str) {
	return new Promise( (resolve, reject) => {
		xml2js.parseString(str, (err, result) => {
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
	}

	cleanup() {
		// TODO
	}

	unzip(file) {
		return spawnSync('unzip', [file, '-d', this.dir_epub],
						 { stdio: [0, this.log_unzip_fd, this.log_unzip_fd] })
	}

	// Return a ES6 promise.
	//
	// file must me unzipped already
	content_opf() {
		let func = this
		let opf = path.join(this.dir_epub, 'META-INF', 'container.xml')
		try {
			var str = fs.readFileSync(opf)
		} catch (e) {
			return Promise.reject(e)
		}
		return exports.parseXML(str).then( (r) => {
			try {
				let file = r.container.rootfiles[0].rootfile[0]['$']['full-path']
				return path.join(func.dir_epub, file)
			} catch (e) {
				throw new Error(`invalid ${opf}: ${e}`)
			}
		})
	}

	// Return a ES6 promise.
	//
	// file must me unzipped already
	lang() {
		return this.content_opf().then( (file) => {
			return exports.parseXML(fs.readFileSync(file)).then( (r) => {
				try {
					return r.package.metadata[0]['dc:language'][0]
				} catch (e) {
					// cannot get main epub language
					return null
				}
			})
		})
	}

}

exports.Zip = Zip
