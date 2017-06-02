# epub-hyphen

Hyphenate epub or xhtml files.

## Usage

	epub-hyphen -l lang [-d] [-i tag1,tag2,...] [-o output] [input]

Input: xhtml file or epub. The input is never modified.

For a epub, the util unzips it to a tmp dir & processes every (x)html
file in the dir, then zips the dir again.

There is no default language. You must specify `-l` opt for the
stdin. For epub files, the util tries to guess the lang & aborts if
(a) it can't & (b) you haven't provided `-l` opt.

If xhtml files (standalones or inside of an epub file) contain `lang`
attribute, you may use `-d` opt for the language detection. The util
aborts immidiately if the detection fails or if it doesn't have a
proper pattern for the detected lang.

A smoke test:

~~~
$ echo '<a><code>foobar</code>foobar</a>' | epub-hyphen -l en
<?xml version='1.0' encoding='utf-8'?>
<a><code>foobar</code>foo-bar</a>
~~~

Note how the string in the `code` node wasn't hyphenated.

## Supported Languages

	$ epub-hyphen --lang-list

## Ignored Tags

See the default list in `lib/hyphenize.js`.

A user may add its own tags to the ignored list w/ `-i` opt.

## Requirements

* node 6.10.3
* CLI utils in the PATH:
  - zip
  - unzip

## Signals

* SIGTERM
* SIGINT
* SIGHUP
* SIGBREAK (Windows only)

Deletes all temporal data & exits.

## Exit Status

<table>
<tbody>

<tr>
<td>0</td>
<td>Success</td>
</tr>

<tr>
<td>1</td>
<td>Any kind of error</td>
</tr>

</tbody>
</table>

## Files

<table>
<tbody>

<tr>
<td>`/tmp/epub-hyphen-XXXXXX/epub/`</td>
<td>epub contents</td>
</tr>

<tr>
<td>`/tmp/epub-hyphen-XXXXXX/*.log`</td>
<td>log files</td>
</tr>

</tbody>
</table>

## Bugs

* No mapping between internal lang names & BCP 47.
* Empty .x?html files are treated as an invalid xml.

## License

AGPL-3.0.
