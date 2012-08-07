var noEndTag = ['br', 'hr', 'img', 'input', 'link', 'meta'];

function serialize(node, outer) {
  if (node.nodeType != 1)
    return node.nodeValue;

  str = '';
  if (outer) {
    str += '<' + node.localName;
    for (var i = 0; i < node.attributes.length; i++) {
      str += ' ' + node.attributes[i].name + '=';
      str += '"' + node.attributes[i].value + '"';
    }
    if (noEndTag.indexOf(node.localName) >= 0 && node.childNodes.length == 0)
      return str + '/>';
    str += '>';
  }
  for (var i = 0; i < node.childNodes.length; i++) {
    str += serialize(node.childNodes[i], true);
  }

  if (outer) {
    str += '</' + node.localName + '>';
  }

  return str;
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
