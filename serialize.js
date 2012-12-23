var noEndTag = ['br', 'hr', 'img', 'input', 'link', 'meta'];
// var blocks = ['div', 'h1', 'h2', 'h3', 'p', 'ol', 'ul'];

function serialize(node, outer) {
  if (node.nodeType != 1)
    return escapeHTML(node.nodeValue);

  str = '';
  if (outer) {
    str += '<' + node.localName;
    for (var i = 0; i < node.attributes.length; i++) {
      if (node.attributes[i].name[0] == '_')
        continue;
      str += ' ' + node.attributes[i].name + '=';
      str += '"' + node.attributes[i].value + '"';
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
    // if (blocks.indexOf(node.localName) >= 0)
    //   str += '\n';
  }

  return str;
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
