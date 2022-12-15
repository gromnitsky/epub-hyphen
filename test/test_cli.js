#!/usr/bin/env -S mocha -u tdd

let assert = require('assert')
let {spawnSync} = require('child_process')
let fs = require('fs')
let crypto = require('crypto')

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

    test('ignore <p> and <h1>', function() {
        let r = spawnSync('./epub-hyphen', ['-i', 'p,h1', 'test/data/3-lang.xml'])
        assert.equal(r.stdout.toString(), `<?xml version="1.0"?>
<body>
  <h1>untitled</h1>
  <h2 lang="uk">ди­хлор­ди­фе­ніл­три­хлор­ме­тил­ме­тан</h2>
  <h3>sec­tion</h3>
  <p>righteousness &gt; <span lang="it">immoralità</span></p>
  <p>paragraph</p>
</body>`)
    })

})

function sha1(buf) {
    return crypto.createHash('sha1').update(buf).digest('hex')
}

function mktemp(template) {
    return template + '.' + crypto.randomBytes(3).toString('hex') + '.tmp'
}

suite('epub', function() {
    test('smoke', function() {
        let r = spawnSync('./epub-hyphen', ['test/data/1.epub'])
        assert.equal(r.status, 0)
        r = spawnSync('bsdtar', ['xf','-','-O','ch01.xhtml'], {input: r.stdout})
        // ./epub-hyphen test/data/1.epub | bsdtar xf - -O ch01.xhtml | sha1sum
        assert.equal(sha1(r.stdout), '2ced4ee70db5f85837d39c954c6646c91e759396')
    })

    test('already hyphenated', function() {
        let r = spawnSync('./epub-hyphen', ['test/data/1.epub'])
        assert.equal(r.status, 0)
        let tmp = mktemp('1.epub')
        fs.writeFileSync(tmp, r.stdout)

        r = spawnSync('./epub-hyphen', [tmp])
        assert.match(r.stderr.toString(), /already hyphenated/)
        fs.unlinkSync(tmp)
    })
})
