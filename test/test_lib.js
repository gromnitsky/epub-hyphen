#!/usr/bin/env -S mocha -u tdd

let assert = require('assert')
let lib = require('../lib')

suite('lib', function() {
    test('node_match', function() {
        let p_bare = {
            name: 'p',
            attrs: {}
        }
        let p_with_classes = {
            name: 'p',
            attrs: {class: ' foo  bar '}
        }

        assert.equal(lib.node_match(p_bare, ['p', '']), true)

        assert.equal(lib.node_match(p_bare, ['title', '']), false)
        assert.equal(lib.node_match(p_bare, ['p','foo']), false)
        assert.equal(lib.node_match(p_bare, ['','']), false)
        assert.equal(lib.node_match(p_bare, ['','foo']), false)

        assert.equal(lib.node_match(p_with_classes, ['p','foo']), true)
        assert.equal(lib.node_match(p_with_classes, ['p','bar']), true)

        assert.equal(lib.node_match(p_with_classes, ['h1','foo']), false)
        assert.equal(lib.node_match(p_with_classes, ['p','123']), false)
        assert.equal(lib.node_match(p_with_classes, ['p','']), false)
        assert.equal(lib.node_match(p_with_classes, ['','']), false)
        assert.equal(lib.node_match(p_with_classes, ['','foo']), false)
    })
})
