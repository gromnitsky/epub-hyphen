'use strict'

exports.check_stream = function(readable, test, cb) {
    let chunks = []
    let tested = false

    let cleanup = () => {
	tested = true
	readable.removeListener('readable', checker)
	readable.unshift(Buffer.concat(chunks))
    }

    let checker = () => {
	let buf = readable.read()
	if (!buf) return
	chunks.push(buf)
//	console.error(buf.length)

	let r
	try {
	    r = test(chunks)
	    if (r) {
		cleanup()
		cb(null, true)
	    }
	} catch (_err) {
	    cleanup()
	    cb(null, false)
	}
    }

    readable.on('readable', checker)

    readable.on('end', () => {
	if (!tested) cb(null, false)
    })
    readable.on('error', cb)
}

exports.is_zip = function(chunks) {
    let buf = Buffer.concat(chunks)
    if (buf.length < 2) return false // buf isn't ready yet
    // the magic bytes for the ZIP format
    if ("PK" !== buf.slice(0, 2).toString()) throw new Error('not a zip stream')
    return true
}
