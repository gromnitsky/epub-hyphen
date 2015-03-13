# epub-hyphen

Hyphenate epub or xhtml files.

## Usage

	epub-hyphen -l lang [-d] [-i tag1,tag2,...] [-o output] [input]

Input: xhtml file or epub. Input is never modified.

For epub, the util unzips it to a tmp dir & processes every (x)html file
in the dir, then zips the dir again.

There is no default language. You must specify `-l` opt for stdin. For
epub files, the util tries to guess the lang & aborts if it can't & you
haven't provided `-l` opt.

If xhtml files (standalones or inside of an epub file) contain `lang`
attribute, you may use `-d` opt for a language detection. The util
aborts immidiately if the detection fails or if it doesn't have a proper
pattern for the detected lang.

## Supported Languages

	$ epub-hyphen --lang-list

## Ignored Tags

See the default list in `lib/hyphenize.js`.

User may add its own tags to the ignored list w/ `-i` opt.

## Requirements

* iojs 1.5.1
* CLI utils in the PATH:
  - readlink
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

* Untested under Windows.
* No mapping between internal lang names & BCP 47.

## License

AGPL-3.0.
