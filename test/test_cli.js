#!/usr/bin/env -S mocha -u tdd

let assert = require('assert')
let {spawnSync} = require('child_process')
let fs = require('fs')

function mktemp(template) {
    return template + '.' + crypto.randomBytes(3).toString('hex') + '.tmp'
}

suite('Invalid Input', function() {
    test('xhtml', function() {
        let r = spawnSync('./epub-hyphen', ['test/data/invalid1.xml'])
        assert.equal(r.stderr.toString(), "test/data/invalid1.xml: <style> can't have descendent tags, but it has <p>\n")

        r = spawnSync('./epub-hyphen', ['test/data/invalid2.xml'])
        assert.equal(r.stderr.toString(), `test/data/invalid2.xml: Non-whitespace before first tag.
Line: 0
Column: 1
Char: w
`)

        r = spawnSync('./epub-hyphen', {input: ''})
        assert.equal(r.stderr.toString(), `[stdin]: Unexpected end
Line: 0
Column: 0
Char: \n`)
    })

    test('zip in stdin', function() {
        let input = fs.readFileSync('test/data/1.epub').toString()
        let r = spawnSync('./epub-hyphen', {input})
        assert.equal(r.stderr.toString(), "zip data isn't allowed from stdin\n")
    })

    test('xml in epub', function() {
        let r = spawnSync('./epub-hyphen', ['test/data/invalid1.epub'])
        assert.match(r.stderr.toString(), /files\/ch01.xhtml: Unexpected close tag/)
    })
})

suite('xhtml', function() {
    test('minimal, with a wrong default lang', function() {
        let r = spawnSync('./epub-hyphen', ['test/data/uk1.bare.xml'])
        assert.equal(r.stdout.toString(), `<?xml version="1.0"?>
<p>дихлордифенілтрихлорметилметан</p>`)
    })

    test('minimal', function() {
        let r = spawnSync('./epub-hyphen', ['-l','uk','test/data/uk1.bare.xml'])
        assert.equal(r.stdout.toString(), `<?xml version="1.0"?>
<p>ди­хлор­ди­фе­ніл­три­хлор­ме­тил­ме­тан</p>`)
    })

    test('wrap <style> in cdata', function() {
        let r = spawnSync('./epub-hyphen', ['test/data/style.xml'])
        assert.equal(r.stdout.toString(), `<?xml version="1.0"?>
<style><![CDATA[
  p > span { color: red; }
  p > span { font-style: italic; }

  p > span { color: blue; }

]]></style>`)
    })

    test('3 languages', function() {
        let r = spawnSync('./epub-hyphen', ['test/data/3-lang.xml'])
        assert.equal(r.stdout.toString(), `<?xml version="1.0"?>
<body>
  <h1>un­ti­tled</h1>
  <h2 lang="uk">ди­хлор­ди­фе­ніл­три­хлор­ме­тил­ме­тан</h2>
  <h3>sec­tion</h3>
  <p>right­eous­ness &gt; <span lang="it">im­mo­ra­li­tà</span></p>
  <p>para­graph</p>
</body>`)
    })

})
