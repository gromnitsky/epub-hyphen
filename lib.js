let fs = require('fs')
let os = require('os')
let path = require('path')
let spawnSync = require('child_process').spawnSync
let xamel = require('xamel')
let CData = require('xamel/lib/xml').CData
let Hypher = require('hypher')
let pkg = require('./package.json')

function is_zip(chunks) {
    let buf = Buffer.concat(chunks)
    return buf.length > 2 && buf.slice(0, 2).toString() === "PK"
}

function parse_xml(input) {
    return new Promise( (resolve, reject) => {
        xamel.parse(input.text, {trim: false, cdata: true}, (err, result) => {
            err ? reject(new EpubHyphenError(input.file, err)) : resolve(result)
        })
    })
}

function hyphenate_xhtml(input, opt) {
    return parse_xml(input).then( doc => {
        try {
            transform(doc, ignored_tags(opt.i), hyphenate_string, opt.l)
        } catch (err) {
            throw new EpubHyphenError(input.file, err)
        }

        let r = xamel.serialize(doc)
        if (opt.o) {
            fs.writeFileSync(opt.o, r)
            return ''
        }
        return r
    })
}

function ignored_tags(str) {
    let def = ["title", "script", "template", "code", "var", "pre", "kbd",
               "textarea", "tt", "xmp", "samp"]
    let from_user = (str || '').split(',').map(s => s.trim()).filter(Boolean)
    return def.concat(from_user)
}

function hypher_engine_loader() {
    let engines = {}
    return language => {
        language = language || 'en'
        language = language === 'en' ? 'en-us' : language

        if ( !(language in engines)) {
            let lang = require(`hyphenation.${language}`)
            engines[language] = new Hypher(lang)
        }
        return engines[language]
    }
}

let hypher_engine = hypher_engine_loader()

function hyphenate_string(text, language) {
    let engine = hypher_engine(language)
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
            // could do the same for <script>,
            // but kindles ignore JS, so who cares
            if (kid.name === 'style') {
                wrap_contents_in_cdata(kid)
                continue
            }

            let lang = kid.attrs.lang || language
            if (-1 === ignored_tags.indexOf(kid.name))
                transform(kid, ignored_tags, callback, lang)
        }
    }
}

function wrap_contents_in_cdata(node) {
    let text = node.text()
    // either a node has an empty content or it's been CDATA'ed already
    if (!text.trim().length) return

    // valid xml, but invalid xhtml
    node.children.forEach( kid => {
        if (kid.constructor.name === 'Tag')
            throw new Error(`<style> can't have descendent tags, but it has <${kid.name}>`)
    })

    // existing CDATA may be interleaved with text
    let concatination = node.children.map( kid => {
        return (kid instanceof CData) ? kid.rawData : kid
    }).join('')
    node.children = [new CData(concatination)]
}

function is_str(obj) {
    return (typeof obj === 'string' || obj instanceof String)
}

class EpubHyphenError extends Error {
    constructor(file, error, prepended_message) {
        let msg = error
        if ( (error instanceof Error) && prepended_message) {
            msg = prepended_message + ': ' + error.message
        } else if (error instanceof Error) {
            msg = error.message
        }

        super()
        this.message = `${file}: ${msg}`
        if (error instanceof Error) this.stack = error.stack
    }
}

class Epub {
    constructor(input, opt = {}) {
        this.file = input.file
        Object.assign(opt, {
            zip: 'zip',
            unzip: 'unzip',
            workdir_prefix: path.join(os.tmpdir(), 'epub-hyphen.')
        })
        this.opt = opt
        this.log = this.opt.log

        this.workdir = fs.mkdtempSync(this.opt.workdir_prefix)
        this.logfile = fs.openSync(path.join(this.workdir, 'log.txt'), 'w+')
        this.epubdir = path.join(this.workdir, 'files')
        this.dest = path.join(this.workdir, path.basename(this.file))
        this.mark = path.join(this.epubdir, 'META-INF', 'epub-hyphen.json')

        process.on('exit', this.cleanup.bind(this))
    }

    cleanup() {
        if (this.log.enabled) return

        this.log('cleanup')
        fs.closeSync(this.logfile)
        fs.rmdirSync(this.workdir, { recursive: true, force: true })
    }

    unpack() {
        this.log(`unpack ${this.file} to ${this.epubdir}`)
        return spawnSync(this.opt.unzip, [this.file, '-d', this.epubdir],
                  { stdio: [0, this.logfile, this.logfile] })
    }

    repack(dest) {
        let orig_dir = process.cwd()
        dest = path.resolve(dest || this.dest)
        this.log(`repacking into ${dest}`)
        fs.writeSync(this.logfile, `\nrepacking into ${dest}\n`)

        process.chdir(this.epubdir)
        try { fs.unlinkSync(dest) } catch (_) {/* ignore errors */}
        let exit_code = spawnSync(this.opt.zip,
                                  ['-X', '-r', dest, 'mimetype', '.'],
                                  { stdio: [0, this.logfile, this.logfile] })
        process.chdir(orig_dir)
        return exit_code
    }

    parse_xml_file(file) {
        let input = { file, text: fs.readFileSync(file).toString() }
        return parse_xml(input)
    }

    guess_lang() {              // after #unpack()
        let container_xml = path.join(this.epubdir, 'META-INF', 'container.xml')
        return this.parse_xml_file(container_xml).then( doc => {
            let file = doc.find('container/rootfiles/rootfile').children[0].attrs['full-path']
            return path.join(this.epubdir, file)
        }).then(this.parse_xml_file).then( doc => {
            return doc.find('package/*/dc:language')?.children[0]?.text()
        })
    }

    mark_as_hyphenated() {
        let info = Object.assign({ user_agent: user_agent() }, this.opt)
        fs.writeFileSync(this.mark, JSON.stringify(info))
    }
}

function user_agent() {
    return `${pkg.name}/${pkg.version} (${process.platform}; ${process.arch}) node/${process.versions.node}`
}

// an equivalent to `find start_dir -name pattern`
function find(start_dir, pattern) {
    let all = fs.readdirSync(start_dir).map( v => path.join(start_dir, v))
    let files = all.filter( v => {
        return v.match(pattern) && fs.statSync(v).isFile()
    })

    all.filter( v => fs.statSync(v).isDirectory())
        .forEach( dir => {
            files = files.concat(find(dir, pattern))
        })

    return files
}

async function hyphenate_zip(input, opt) {
    let epub = new Epub(input, opt)

    let status = epub.unpack()
    if (0 !== status.status)
        throw new EpubHyphenError(epub.file, status.error, 'unpacking failed')

    if (fs.existsSync(epub.mark))
        throw new EpubHyphenError(epub.file, 'already hyphenated')

    epub.log('-l: ' + opt.l)
    if (!opt.l) {
        let lang = await epub.guess_lang()
        epub.log('metadata lang: ' + lang)
        opt.l = lang
    }

    let transformers = find(epub.workdir, "\\.x?html$")
        .map( async (file) => {
            epub.log(file)
            let xml = { file, text: fs.readFileSync(file).toString() }
            let dest = file + '.new'
            let local_opt = Object.assign({}, opt, {o: null})
            let text = await hyphenate_xhtml(xml, local_opt)
            fs.writeFileSync(dest, text)
            fs.renameSync(dest, file)
        })
    await Promise.all(transformers)

    epub.mark_as_hyphenated()

    status = epub.repack(opt.o)
    if (0 !== status.status)
        throw new EpubHyphenError(epub.file, status.error, 'repacking failed')

    return opt.o ? '' : fs.readFileSync(epub.dest)
}

module.exports = { is_zip, hyphenate_zip, hyphenate_xhtml, EpubHyphenError }
