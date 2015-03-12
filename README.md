## Usage

	epub-hyphen 

input: html/xml file or epub

Input is never modified.

For epub we unzip it to a tmp dir & process every (x)html file in the
dir, then zip the dir again.

Default language is 'en'.

1 language for the whole input or w/ -d try to detect the lang for a
subtree. Abort immidiately if the detection fails or if we don't have a
proper pattern for the detected lang.

## Ignored tags

Attributes are ignored.

This tags & their subtrees are always ignored:

html 4.1 req:

* applet
* base
* basefont
* br
* frame
* frameset
* iframe
* param
* script

Practical req:

* head
* style
* hr
* code
* var
* pre
* kbd
* img

* embed (?)
* object
* video
* audio
* track
* canvas
* source

* input
* output
* progress
* meter
* marquee
* button
* select
* datalist
* optgroup
* option
* textarea
* keygen

* map
* area

* menu
* menuitem

User may add its own tags to the ignored list w/ -i opt.

## Signals

* SIGTERM
* SIGINT
* SIGHUP
* SIGBREAK (Windows only)

Deletes all temporal data & exits.
