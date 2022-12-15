let xamel = require('xamel')
let util = require('util')
let fs = require('fs')

let xml = fs.readFileSync(process.argv[2]).toString()
xamel.parse(xml, {trim: false, cdata: true}, (err, doc) => {
    if (err) {
        console.error(err)
        return
    }

    console.log(util.inspect(doc, {depth: Infinity}))
})
