var edit = {};

(function() {
var blocks = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'div', 'li'];
var blocksNotLists = ['h1', 'h2', 'h3', 'p'];

var i = 0;
var BOLD = i++, ITALIC = i++, UNDERLINE = i++;
var LEFT = i++, CENTER = i++, RIGHT = i++, JUSTIFY = i++;
var LINK = i++, U_LIST = i++, O_LIST = i++;
var IM_FLOAT_LEFT = i++, IM_CENTER = i++, IM_FLOAT_RIGHT = i++;

var CLASS_EDIT_BLOCK = 'edit_block', CLASS_SHOWN = 'edit_shown', CLASS_CURRENT = 'edit_current';
var CLASS_SELECTED = 'edit_selected', CLASS_DISABLED = 'edit_disabled';

var toolbar = document.createElement('div');
toolbar.id = 'edit_toolbar';
toolbar.innerHTML =
  '<div id="edit_row_one">' +
    '<select id="edit_node_name" onchange="edit.nodeNameAction();">' +
      '<option value="h1">Heading 1</option>' +
      '<option value="h2">Heading 2</option>' +
      '<option value="h3">Heading 3</option>' +
      '<option value="p">Paragraph</option>' +
    '</select>' +
    '<span>' +
      '<button onclick="edit.action(\'bold\', null)" style="font-weight: bold;">B</button>' +
      '<button onclick="edit.action(\'italic\', null)" style="font-style: italic;">I</button>' +
      '<button onclick="edit.action(\'underline\', null)" style="text-decoration: underline;">U</button>' +
    '</span>' +
    '<span class="edit_radio_buttons">' +
      '<button onclick="edit.action(\'justifyleft\', null)">L</button>' +
      '<button onclick="edit.action(\'justifycenter\', null)">C</button>' +
      '<button onclick="edit.action(\'justifyright\', null)">R</button>' +
      '<button onclick="edit.action(\'justifyfull\', null)">F</button>' +
    '</span>' +
    '<span>' +
      '<button id="edit_button_link" onclick="edit.linkAction();">a</button>' +
    '</span>' +
    '<span class="edit_radio_buttons">' +
      '<button onclick="edit.listAction(edit.U_LIST);">&#x2022;</button>' +
      '<button onclick="edit.listAction(edit.O_LIST);">#</button>' +
    '</span>' +
    '<span class="edit_radio_buttons">' +
      '<button onclick="edit.imageAlignAction(\'alignleft\');">L</button>' +
      '<button onclick="edit.imageAlignAction(\'aligncenter\');">C</button>' +
      '<button onclick="edit.imageAlignAction(\'alignright\');">R</button>' +
    '</span>' +
    '<div id="edit_chain"></div>' +
    '<button onclick="edit.output();">output</button>' +
  '</div>'; // #edit_row_one
document.body.appendChild(toolbar);

var chain_display = document.getElementById('edit_chain');
var nodeNameSelect = document.getElementById('edit_node_name');
var range;
var currentDiv = null;

nodeNameSelect.onmousedown = saveSelection;
var buttons = toolbar.querySelectorAll('button');
for (var i = 0; i < buttons.length; i++) {
  buttons[i].onmousedown = saveSelection;
  buttons[i].onmouseup = restoreSelection;
}
var editables = document.getElementsByClassName(CLASS_EDIT_BLOCK);
for (var i = 0; i < editables.length; i++) {
  setContentEditable(editables[i]);
}

document.documentElement.addEventListener('click', function(event) {
  var element = event.target || event.srcElement;
  while (element) {
    if (element.nodeType == 1 &&
        (element.classList.contains(CLASS_EDIT_BLOCK) || element.id == 'edit_toolbar')) {
      return;
    }
    element = element.parentNode;
  }
  edit.relocateUI(null);
}, false);

function setContentEditable(div) {
  div.setAttribute('onfocus', 'edit.relocateUI(this);');
  div.ondblclick = div.onclick = div.onkeyup = updateUI;
  div.ondragenter = div.ondrop = onDragOver;
  div.contentEditable = true;
}

function onDragOver(event) {
  var hasFiles = event.dataTransfer.files && event.dataTransfer.files.length;
  if (hasFiles)
    event.preventDefault();

  // var isHTML = event.dataTransfer.types.contains('text/html');
  // if (isHTML) {
  //   var htmlContent = event.dataTransfer.getData('text/html');
  //   if (htmlContent.indexOf('<img') >= 0)
  //     event.preventDefault();
  // }

  // var o = document.getElementById('edit_output');
  // o.textContent = '';
  // for (var i = 0; i < event.dataTransfer.types.length; i++) {
  //   o.textContent += event.dataTransfer.types[i] + '\n';
  // }
}

function relocateUI(div) {
  if (div == currentDiv)
    return;
  if (currentDiv)
    currentDiv.classList.remove(CLASS_CURRENT);
  currentDiv = div;
  range = null;
  if (currentDiv) {
    currentDiv.classList.add(CLASS_CURRENT);
    toolbar.classList.add(CLASS_SHOWN);
  } else {
    toolbar.classList.remove(CLASS_SHOWN);
  }
}

function updateUI() {
  chain_display.textContent = '';
  var node;
  if ('getSelection' in window) {
    var a = window.getSelection();
    if (!a.rangeCount)
      return;
    var r = a.getRangeAt(0);
    node = r.startContainer;
    if (node.nodeType == 1)
      node = node.childNodes[r.startOffset];
    else if (node.nodeType == 3 && r.startOffset == node.length && node.nextSibling)
      node = node.nextSibling;
    else if (node.childNodes.length == 1)
      node = node.firstChild;
  } else {
    var r = document.selection.createRange();
    var r2 = r.duplicate();
    node = r2.parentElement();
  }

  var chain = [];
  var image = node.localName == 'img';
  var bold = false;
  var italic = false;
  var underline = false;
  var link = false;
  var uList = false;
  var oList = false;
  var blockNode = null;
  var alignment = null;
  while (node) {
    var name = node.localName;
    if (node.nodeType == 3) name = '#text';//(' + node.length + ')';
    if (node.id) name += '#' + node.id;
    if (node.classList) for (var i = 0; i < node.classList.length; i++) name += '.' + node.classList[i];
    if (node.nodeType == 1) {
      if (node.localName == 'b' || node.localName == 'strong' || node.style.fontWeight == 'bold') bold = true;
      if (node.localName == 'i' || node.localName == 'em' || node.style.fontStyle == 'italic') italic = true;
      if (node.localName == 'u' || node.style.textDecoration == 'underline') underline = true;
      if (node.localName == 'a') link = true;
      if (node.localName == 'ul') uList = true;
      if (node.localName == 'ol') oList = true;
      if (node.localName == 'div' && node.classList.contains(CLASS_EDIT_BLOCK)) {
        chain_display.textContent = chain.reverse().join(' > ');
        chain_display.style.fontWeight = bold ? 'bold' : 'normal';
        chain_display.style.fontStyle = italic ? 'italic' : 'normal';
        chain_display.style.textDecoration = underline ? 'underline' : 'none';
        chain_display.style.color = link ? 'blue' : '';
        break;
      }
      if (!alignment && blocks.indexOf(node.localName) >= 0)
        alignment = (node.style && node.style.textAlign) || node.align || null;
    }
    chain.push(name);
    blockNode = node;
    node = node.parentNode;
  }
  if (!blockNode)
    return;
  if (!alignment)
    alignment = (blockNode.style && blockNode.style.textAlign) || blockNode.align || 'left';
  chain_display.textContent += ' [' + blockNode.localName + ', ' + alignment + ']';

  if (image) {
    for (var i = 0; i < IM_FLOAT_LEFT; i++) {
      buttons[i].classList.remove(CLASS_SELECTED);
      buttons[i].classList.add(CLASS_DISABLED);
    }
    buttons[IM_FLOAT_LEFT].classList.remove(CLASS_DISABLED);
    buttons[IM_CENTER].classList.remove(CLASS_DISABLED);
    buttons[IM_FLOAT_RIGHT].classList.remove(CLASS_DISABLED);
    return;
  }

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove(CLASS_SELECTED);
    buttons[i].classList.remove(CLASS_DISABLED);
  }

  buttons[IM_FLOAT_LEFT].classList.add(CLASS_DISABLED);
  buttons[IM_CENTER].classList.add(CLASS_DISABLED);
  buttons[IM_FLOAT_RIGHT].classList.add(CLASS_DISABLED);

  if (r.collapsed ||
    ('compareEndPoints' in r && r.compareEndPoints('StartToEnd', r) == 0)) {
    buttons[BOLD].classList.add(CLASS_DISABLED);
    buttons[ITALIC].classList.add(CLASS_DISABLED);
    buttons[UNDERLINE].classList.add(CLASS_DISABLED);
    if (!link)
      buttons[LINK].classList.add(CLASS_DISABLED);
  }
  if (bold) buttons[BOLD].classList.add(CLASS_SELECTED);
  if (italic) buttons[ITALIC].classList.add(CLASS_SELECTED);
  if (underline) buttons[UNDERLINE].classList.add(CLASS_SELECTED);
  if (link) buttons[LINK].classList.add(CLASS_SELECTED);
  if (uList) buttons[U_LIST].classList.add(CLASS_SELECTED);
  if (oList) buttons[O_LIST].classList.add(CLASS_SELECTED);

  nodeNameSelect.disabled = false;
  nodeNameSelect.classList.add(CLASS_DISABLED);
  switch (blockNode.localName) {
  case 'h1':
    nodeNameSelect.value = 'h1';
    break;
  case 'h2':
    nodeNameSelect.value = 'h2';
    break;
  case 'h3':
    nodeNameSelect.value = 'h3';
    break;
  case 'ul':
  case 'ol':
    nodeNameSelect.value = 'p';
    nodeNameSelect.disabled = true;
    break;
  case 'p':
  default:
    nodeNameSelect.value = 'p';
    break;
  }
  switch (alignment) {
  case 'center':
    buttons[CENTER].classList.add(CLASS_SELECTED);
    break;
  case 'right':
    buttons[RIGHT].classList.add(CLASS_SELECTED);
    break;
  case 'justify':
    buttons[JUSTIFY].classList.add(CLASS_SELECTED);
    break;
  case 'left':
  default:
    buttons[LEFT].classList.add(CLASS_SELECTED);
    break;
  }
}

function action(command, value) {
  if (!currentDiv) return;
  document.execCommand(command, false, value);
}

function nodeNameAction() {
  var blockNode = getBlockNodeForSelection();
  if (!blockNode)
    return;
  if ('selectNodeContents' in range)
    range.selectNodeContents(blockNode);
  else
    range.moveToElementText(blockNode);
  action('formatblock', '<' + nodeNameSelect.value + '>');
  currentDiv.focus();
  updateUI();
}

function linkAction() {
  var button = buttons[LINK];
  if (button.classList.contains(CLASS_SELECTED)) {
    var node = range.startContainer;
    if (node.nodeType == 3 && range.startOffset == node.length && node.nextSibling) {
      node = node.nextSibling;
    }
    if (node.childNodes.length == 1) {
      node = node.firstChild;
    }
    if (node.nodeType == 1) {
      node = node.childNodes[range.startOffset];
    }
    while (node) {
      if (node.nodeType == 1 && node.localName == 'a')
        break;
      node = node.parentNode;
    }
    if ('selectNode' in range)
      range.selectNode(node);
    else
      range.moveToElementText(node);
    action('unlink', null);
  } else {
    var href;
    if (typeof edit.linkCallback == 'function')
      href = edit.linkCallback('text' in range ? range.text : range.toString());
    else
      href = prompt('Type or paste a link:');
    if (href)
      action('createlink', href);
  }
}

function listAction(listType) {
  var currentListType = null;
  if (buttons[U_LIST].classList.contains(CLASS_SELECTED))
    currentListType = U_LIST;
  else if (buttons[O_LIST].classList.contains(CLASS_SELECTED))
    currentListType = O_LIST;

  var blockNode = getBlockNodeForSelection();
  if (!blockNode)
    return;

  if (!currentListType) {
    action(listType == U_LIST ? 'insertUnorderedList' : 'insertOrderedList', null);
    updateUI();
    return;
  }

  var list;
  if ('startContainer' in range) {
    list = range.startContainer;
    if (list.nodeType == 1)
      list = list.childNodes[range.startOffset];
  } else {
    var r2 = range.duplicate();
    list = r2.parentElement();
  }
  while (list) {
    if (list.nodeType == 1) {
      if (list.localName == 'ul' || list.localName == 'ol') {
        blockNode = list;
        break;
      }
      if (list.localName == 'div' && list.classList.contains(CLASS_EDIT_BLOCK)) {
        break;
      }
    }
    list = list.parentNode;
  }
  var parent = blockNode.parentNode;

  if (currentListType == listType) { // already a list, remove
    var next = blockNode.nextSibling;
    range.setStartAfter(blockNode);
    for (var i = 0; i < blockNode.childElementCount; i++) {
      var li = blockNode.children[i];
      var p = document.createElement('p');
      var n;
      while (n = li.firstChild) {
        if ((!parent.classList.contains(CLASS_EDIT_BLOCK)) ||
            (n.nodeType == 1 && blocks.indexOf(n.localName) >= 0)) {
          parent.insertBefore(n, next);
          range.setEndAfter(n);
        } else {
          p.appendChild(n);
        }
      }
      if (p.childNodes.length) {
        parent.insertBefore(p, next);
        range.setEndAfter(p);
      }
    }
    parent.removeChild(blockNode);

  } else { // convert to other type of list
    var newList = document.createElement(listType == U_LIST ? 'ul' : 'ol');
    var li;
    while (li = blockNode.firstChild) {
      newList.appendChild(li);
    }
    parent.replaceChild(newList, blockNode);
    if ('selectNode' in range)
      range.selectNode(newList);
    else
      range.moveToElementText(newList);
  }
  updateUI();
}

function imageAlignAction(className) {
  var node;
  if ('getSelection' in window) {
    var a = window.getSelection();
    if (!a.rangeCount)
      return;
    var r = a.getRangeAt(0);
    node = r.startContainer;
    if (node.nodeType == 1)
      node = node.childNodes[r.startOffset];
    else if (node.nodeType == 3 && r.startOffset == node.length && node.nextSibling)
      node = node.nextSibling;
    else if (node.childNodes.length == 1)
      node = node.firstChild;
  }
  if (!node || node.localName != 'img')
    return;

  node.classList.remove('alignleft');
  node.classList.remove('aligncenter');
  node.classList.remove('alignright');
  node.classList.add(className);
}

function getBlockNodeForSelection() {
  var node;
  if ('startContainer' in range) {
    node = range.startContainer;
    if (node.nodeType == 1)
      node = node.childNodes[range.startOffset];
  } else {
    if (range.compareEndPoints('StartToEnd', range) == 0)
      return null;
    node = range.parentElement();
  }
  var blockNode = null;
  while (node) {
    if (node.localName == 'div' && node.classList.contains(CLASS_EDIT_BLOCK))
      break;
    blockNode = node;
    node = node.parentNode;
  }
  return blockNode;
}

function saveSelection() {
  range = null;
  if ('getSelection' in window) {
    var a = window.getSelection();
    if (a.rangeCount) {
      range = a.getRangeAt(0);
    }
  } else {
    range = document.selection.createRange();
  }
}

function restoreSelection() {
  if (!range) {
    return;
  }
  if ('getSelection' in window) {
    var a = window.getSelection();
    a.removeAllRanges();
    a.addRange(range);
    currentDiv.focus();
    setTimeout(updateUI, 0);
  } else {
    range.select();
    setTimeout(updateUI, 0);
  }
}

function output() {
  if (!currentDiv) return;
  var o = document.getElementById('edit_output');
  o.textContent = serialize(currentDiv, false);
}

edit.U_LIST = U_LIST;
edit.O_LIST = O_LIST;
edit.action = action;
edit.linkAction = linkAction;
edit.listAction = listAction;
edit.nodeNameAction = nodeNameAction;
edit.imageAlignAction = imageAlignAction;
edit.output = output;
edit.relocateUI = relocateUI;
})();
