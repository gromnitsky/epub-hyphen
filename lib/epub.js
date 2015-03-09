'use strict';

exports.is_epub = function(chunks) {
	if (!chunks || chunks.length == 0) return false

	let done = false
	let buf = Buffer.concat(chunks)
	// the magic bytes for the ZIP format
	if ("PK" === buf.slice(0, 2).toString()) throw new Error('epub')
	if (buf.length >= 2) done = true

	return done
}
