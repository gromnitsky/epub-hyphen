var fs = require('fs')

module.exports = function(file, opt) {
    if ( !(file && file.trim() === '/dev/stdin'))
        return fs.readFileSync(file, opt)

    var BUFSIZ = 65536
    var chunks = []
    while (1) {
        try {
            var buf = new Buffer(BUFSIZ)
            var nbytes = fs.readSync(process.stdin.fd, buf, 0, BUFSIZ, null)
        } catch (err) {
            if (err.code === 'EAGAIN') {
                // node is funny
                throw new Error("interactive mode isn't supported, use pipes")
            }
            if (err.code === 'EOF') break
            throw err
        }

        if (nbytes === 0) break
        chunks.push(buf.slice(0, nbytes))
    }

    return Buffer.concat(chunks)
}
