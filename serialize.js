var noEndTag = ['br', 'hr', 'img', 'input', 'link', 'meta'];
var blocks = ['div', 'h1', 'h2', 'h3', 'p', 'ol', 'ul'];

function serialize(node, outer) {
	if (node.nodeType != 1)
		return escapeHTML(node.nodeValue);

	if (node.localName == 'br' && !node.nextSibling)
		return '';

	str = '';
	if (outer) {
		str += '<' + node.localName;
		for (var i = 0; i < node.attributes.length; i++) {
			var attribute = node.attributes[i];
			if (attribute.name[0] == '_')
				continue;
			if (attribute.name == 'style' && attribute.value == '')
				continue;
			str += ' ' + attribute.name + '=';
			str += '"' + attribute.value + '"';
		}
		if (noEndTag.indexOf(node.localName) >= 0 && node.childNodes.length == 0)
			return str + '/>';
		str += '>';
	}

	if (!node._placeholder) {
		for (var i = 0; i < node.childNodes.length; i++) {
			str += serialize(node.childNodes[i], true);
		}
	}

	if (outer) {
		str += '</' + node.localName + '>';
		if (blocks.indexOf(node.localName) >= 0)
			str += '\n';
	}

	return str;
}

function escapeHTML(str) {
	return str.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
