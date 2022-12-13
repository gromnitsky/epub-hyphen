let xamel = require('xamel')
let CData = require('xamel/lib/xml').CData
let Hypher = require('hypher')
//let util = require('util')

function hyphenate(xml, opt) {
    return new Promise( (resolve, reject) => {
        xamel.parse(xml.text, {trim: false, cdata: true}, function(err, doc) {
            if (err) {
                reject(new EpubHyphenError(xml.filename, err))
                return
            }

            //console.log(util.inspect(doc, {depth: Infinity}))
            try {
                transform(doc, ignored_tags(opt.i), hyphenate_string, opt.l)
            } catch (err) {
                reject(new EpubHyphenError(xml.filename, err))
            }

            resolve(xamel.serialize(doc))
        })
    })
}

function ignored_tags(str) {
    let additional = (str || '').split(',').map(s => s.trim()).filter(Boolean)
    let list = ["applet", "base", "basefont", "br", "frame", "frameset",
              "iframe", "param", "script", "head", "style", "hr",
              "code", "var", "pre", "kbd", "img", "embed", "object",
              "video", "audio", "track", "canvas", "source", "input",
              "output", "progress", "meter", "marquee", "button",
              "select", "datalist", "optgroup", "option", "textarea",
              "keygen", "map", "area", "menu", "menuitem"]
    return list.concat(additional)
}

function hyphenate_string(text, language) {
    language = language || 'en'
    language = language === 'en' ? 'en-us' : language
    let lang = require(`hyphenation.${language}`)
    let engine = new Hypher(lang)
//    console.error(language, engine.hyphenateText(text))
    return engine.hyphenateText(text)
}

function transform(node, ignored_tags, callback, language) {
    for (let idx in node.children) {
        let kid = node.children[idx]

        if (is_str(kid)) {
            if (!kid.trim().length) continue
            // modify kid in-place
            node.children[idx] = callback(kid, language)

        } else if (kid.constructor.name === 'Tag') {
            if (kid.name === 'style') {
                protect_style(kid)
                continue
            }

            let lang = kid.attrs.lang || language
            if (-1 === ignored_tags.indexOf(kid.name))
                transform(kid, ignored_tags, callback, lang)
        }
    }
}

function protect_style(node) {
    // either a node has an empty content or it's been CDATA'ed already
    let text = node.text()
    if (!text.trim().length) return

    // valid xml, but invalid xhtml
    node.children.forEach( kid => {
        if (kid.constructor.name !== 'String')
            throw new Error(`<style> can't have descendent tags, but it has <${kid.name}>`)
    })

    node.children = [new CData(text)]
}

function is_str(obj) {
    return (typeof obj === 'string' || obj instanceof String)
}

class EpubHyphenError extends Error {
    constructor(file, msg) {
        super()
        this.message = `${file}: ${msg instanceof Error ? msg.message : msg}`
    }
}

module.exports = { ignored_tags, hyphenate, transform, EpubHyphenError }
