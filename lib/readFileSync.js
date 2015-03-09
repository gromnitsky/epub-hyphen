'use strict';

var fs = require('fs')

/* analyser -- A function that raises an exception if it thinks that the
   bytes read are not in valid format. It takes 1 argument: (chunks),
   that is an array of Buffers.
*/
module.exports = function(file, analyser) {
	let is_stdin = (file.trim() === '/dev/stdin')
	let fd = is_stdin ? process.stdin.fd : fs.openSync(file, 'r')

    let BUFSIZ = 65536
    let chunks = []
	let analyser_has_finished = false
    while (1) {
        try {
            var buf = new Buffer(BUFSIZ)
            var nbytes = fs.readSync(fd, buf, 0, BUFSIZ, null)
        } catch (err) {
            if (err.code === 'EAGAIN' && is_stdin) {
                // node is teh funney
                throw new Error("interactive mode isn't supported, use pipes")
            }
            if (err.code === 'EOF') break
            throw err
        }

        if (nbytes === 0) break
        chunks.push(buf.slice(0, nbytes))
		if (!analyser_has_finished && analyser) {
			analyser_has_finished = analyser(chunks)
		}
    }

    return Buffer.concat(chunks)
}
