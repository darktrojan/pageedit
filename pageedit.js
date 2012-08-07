var edit = {};

(function() {
var blocks = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'div', 'li'];
var blocksNotLists = ['h1', 'h2', 'h3', 'p'];

var i = 0;
var BOLD = i++, ITALIC = i++, UNDERLINE = i++;
//var HEADING_1 = i++, HEADING_2 = i++, HEADING_3 = i++, PARAGRAPH = i++;
var LEFT = i++, CENTER = i++, RIGHT = i++, JUSTIFY = i++;
var LINK = i++, U_LIST = i++, O_LIST = i++;

var CLASS_EDIT_BLOCK = 'edit_block', CLASS_SHOWN = 'edit_shown', CLASS_CURRENT = 'edit_current';
var CLASS_SELECTED = 'edit_selected', CLASS_DISABLED = 'edit_disabled';

var toolbar = document.getElementById('edit_toolbar');
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

//setCurrentSelector('p');

function setContentEditable(div) {
  div.setAttribute('onfocus', 'edit.relocateUI(this);');
  div.ondblclick = div.onclick = div.onkeyup = updateUI;
  div.contentEditable = true;
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

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove(CLASS_SELECTED);
    buttons[i].classList.remove(CLASS_DISABLED);
  }

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
    //buttons[HEADING_1].classList.add(CLASS_SELECTED);
    nodeNameSelect.value = 'h1';
    //setCurrentSelector('h1');
    break;
  case 'h2':
    //buttons[HEADING_2].classList.add(CLASS_SELECTED);
    nodeNameSelect.value = 'h2';
    //setCurrentSelector('h2');
    break;
  case 'h3':
    //buttons[HEADING_3].classList.add(CLASS_SELECTED);
    nodeNameSelect.value = 'h3';
    //setCurrentSelector('h3');
    break;
  case 'ul':
  case 'ol':
    nodeNameSelect.value = 'p';
    nodeNameSelect.disabled = true;
    //setCurrentSelector('li');
    break;
  case 'p':
  default:
    //buttons[PARAGRAPH].classList.add(CLASS_SELECTED);
    nodeNameSelect.value = 'p';
    //setCurrentSelector('p');
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
    action('createlink', 'about:blank');
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
    //var node = range.startContainer;
  //  while (node) {
    //  if (node.localName == 'div') {
      //  if (node.classList.contains(CLASS_EDIT_BLOCK)) {
        //  node.focus();
          setTimeout(updateUI, 0);
        //}
        //return;
      //}
      //node = node.parentNode;
    //}
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
/*
var defaults = {
  'fontFamily': 'serif',
  'color': 'rgb(0, 0, 0)',
  'marginTop': '0.5em',
  'marginBottom': '0.5em',
  'lineHeight': '1.25em'
};

function button1() {
  setCSS(getCurrentSelector(), 'marginTop', '0.5em');
  setCSS(getCurrentSelector(), 'marginBottom', '0.5em');
}

function button2() {
  setCSS(getCurrentSelector(), 'marginTop', '1em');
  setCSS(getCurrentSelector(), 'marginBottom', '1em');
}

function button3() {
  setCSS(getCurrentSelector(), 'lineHeight', '1.15em');
}

function button4() {
  setCSS(getCurrentSelector(), 'lineHeight', '1.5em');
}

function button5() {
  setCurrentSelector(getCurrentSelector());
}

function setCSS(selector, property, value) {
  var stylesheet = document.styleSheets[0];

  var rule;
  for (var i = 0; i < stylesheet.cssRules.length; i++) {
    if (stylesheet.cssRules[i].selectorText == selector) {
      rule = stylesheet.cssRules[i];
      break;
    }
  }
  if (!rule) {
    var index = stylesheet.insertRule(selector + '{}', i);
    rule = stylesheet.cssRules[index];
  }
  rule.style[property] = value;
}

function getCSS(selector, property) {
  var stylesheet = document.styleSheets[0];

  var rule;
  for (var i = 0; i < stylesheet.cssRules.length; i++) {
    if (stylesheet.cssRules[i].selectorText == selector) {
      rule = stylesheet.cssRules[i];
      return rule.style[property] || defaults[property];
    }
  }
  return defaults[property];
}

function getCurrentSelector() {
  return document.getElementById('currentSelector').value;
}

function setCurrentSelector(selector) {
  document.getElementById('currentSelector').value = selector;
  document.getElementById('fontFamilyValue').value = getCSS(selector, 'fontFamily');
  document.getElementById('colorValue').value = getCSS(selector, 'color');
  document.getElementById('marginTopValue').value = getCSS(selector, 'marginTop');
  document.getElementById('marginBottomValue').value = getCSS(selector, 'marginBottom');
  document.getElementById('lineHeightValue').value = getCSS(selector, 'lineHeight');
}
*/

edit.U_LIST = U_LIST;
edit.O_LIST = O_LIST;
edit.action = action;
edit.linkAction = linkAction;
edit.listAction = listAction;
edit.nodeNameAction = nodeNameAction;
edit.output = output;
edit.relocateUI = relocateUI;
})();
