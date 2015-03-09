'use strict';

var TAGS_TO_IGNORE = {
	"applet": true,
	"base": true,
	"basefont": true,
	"br": true,
	"frame": true,
	"frameset": true,
	"iframe": true,
	"param": true,
	"script": true,

	"head": true,
	"style": true,
	"hr": true,
	"code": true,
	"var": true,
	"pre": true,
	"kbd": true,
	"img": true,

	"embed": true,
	"object": true,
	"video": true,
	"audio": true,
	"track": true,
	"canvas": true,
	"source": true,

	"input": true,
	"output": true,
	"progress": true,
	"meter": true,
	"marquee": true,
	"button": true,
	"select": true,
	"datalist": true,
	"optgroup": true,
	"option": true,
	"textarea": true,
	"keygen": true,

	"map": true,
	"area": true,

	"menu": true,
	"menuitem": true
}

var tags_to_ignore_add = function(arr) {
	if (!arr) return
	arr.forEach( (v) => {
		TAGS_TO_IGNORE[v] = true
	})
}

// TODO
// modify node in-place
exports.hyphenize = function(node, conf) {
	if (node.nodeName !== '#text') return false
	node.value = node.value.toUpperCase()
}

exports.is_node_eligible = function(node, conf) {
	// FIXME
	tags_to_ignore_add(conf.tags_to_ignore)

	if (node.nodeName in TAGS_TO_IGNORE) {
		console.log(`ignoring ${node.nodeName}`)
		return false
	}
	return true
}

exports.walk = function(node, callback, conf) {
	if (!node.childNodes || node.childNodes.length == 0) return

	node.childNodes.forEach( (child) => {
		if (exports.is_node_eligible(child, conf)) {
			if (!child.childNodes || child.childNodes.length == 0) {
				callback(child, conf)
			} else {
				exports.walk(child, callback, conf)
			}
		}
	})
}
