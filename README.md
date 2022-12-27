    $ npm i -g epub-hyphen

Reqs:

* node 18.x
* `zip` & `unzip` in PATH

## Usage

~~~
$ ./epub-hyphen -h
Usage: epub-hyphen [options] input [-o output]

Hyphenate text nodes in epub or stand-alone xhtml files

Options:
  -V, --version        output the version number
  -l <str>             a 2-letter default language in case <html lang='xx'>
                       attribute is absent; this does NOT override already
                       present lang= attributes
  -i <str>             an additional comma-separated list of tags to ignore; a
                       tag can optionally include a class name, e.g. `h1,p.foo`
  -o <str>             an output file name (overwrite the contents)
  --lang-list          print all supported languages
  --ignored-tags-list  print the default ignored tags list
  -h, --help           display help for command

set NODE_DEBUG=epub-hyphen to enable debug log
~~~

When converting epubs:

* if no `-l` is given, the program tries to detect the
  default language from epub metadata;
* always use `-o` in Windows.

## Examples

~~~
$ echo '<p>дихлордифенілтрихлорметилметан</p>' | ./epub-hyphen -l uk
<?xml version="1.0"?>
<p>ди-хлор-ди-фе-ніл-три-хлор-ме-тил-ме-тан</p>
~~~

The contents of some tags is never hyphenated (`code`, `pre`, &c, see
lib.js):

~~~
$ echo '<p><code>foobar</code>foobar</p>' | ./epub-hyphen
<?xml version='1.0' encoding='utf-8'?>
<p><code>foobar</code>foo-bar</p>
~~~

Hyphenate a epub:

    $ ./epub-hyphen test/data/1.epub > 2.epub

## Bugs

* No mappings the between internal lang names & BCP 47.
* An empty .x?html file is treated as an invalid xml.

## News

v1.0.0 is a complete rewrite; its cli is incompatible with 0.0.x
versions.

## License

AGPL-3.0
