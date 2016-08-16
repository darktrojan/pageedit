function isBlock(node) {
	if (!node || node.nodeType != Node.ELEMENT_NODE) {
		return false;
	}
	return ['div', 'h1', 'h2', 'h3', 'p', 'ol', 'ul'].indexOf(node.localName) >= 0;
}

/* exported serialize */
function serialize(node, outer) {
	if (node.nodeType == Node.TEXT_NODE) {
		if (!node.nodeValue.trim() && (isBlock(node.previousSibling) || isBlock(node.nextSibling))) {
			return '';
		}
		return escapeHTML(node.nodeValue);
	} else if (node.nodeType != Node.ELEMENT_NODE) {
		return '';
	}

	if (node.localName == 'br' && !node.nextSibling) {
		return '';
	}

	var str = '';
	if (outer) {
		str += '<' + node.localName;
		for (var i = 0; i < node.attributes.length; i++) {
			var attribute = node.attributes[i];
			if (attribute.name[0] == '_') {
				continue;
			}
			if (attribute.name == 'style' && attribute.value == '') {
				continue;
			}
			str += ' ' + attribute.name + '=';
			str += '"' + attribute.value + '"';
		}
		if (['br', 'hr', 'img', 'input', 'link', 'meta'].indexOf(node.localName) >= 0 && node.childNodes.length == 0) {
			return str + '/>';
		}
		str += '>';
	}

	if (!node._placeholder) {
		for (var i = 0; i < node.childNodes.length; i++) {
			str += serialize(node.childNodes[i], true);
		}
	}

	if (outer) {
		str += '</' + node.localName + '>';
		if (isBlock(node)) {
			str += '\n';
		}
	}

	return str;
}

function escapeHTML(str) {
	return str.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
