var edit = {};

(function() {
var blocks = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'div', 'li'];

var CLASS_EDIT_BLOCK = 'edit_block', CLASS_SHOWN = 'edit_shown', CLASS_CURRENT = 'edit_current';
var CLASS_SELECTED = 'edit_selected', CLASS_DISABLED = 'edit_disabled';
var CLASS_ALIGN_LEFT = 'alignleft', CLASS_ALIGN_CENTER = 'aligncenter', CLASS_ALIGN_RIGHT = 'alignright';

var ToolbarUI = {
	element: null,
	nodeNameSelect: null,
	buttons: {},
	chain_display: null,

	init: function() {
		this.element = document.body.append('div#edit_toolbar');

		this.nodeNameSelect = this.element.append('select#edit_node_name');
		this.nodeNameSelect.append('option', 'Heading 1', { 'value': 'h1' });
		this.nodeNameSelect.append('option', 'Heading 2', { 'value': 'h2' });
		this.nodeNameSelect.append('option', 'Heading 3', { 'value': 'h3' });
		this.nodeNameSelect.append('option', 'Paragraph', { 'value': 'p' });

		var group = this.element.append('span');
		this.addButton(group, 'bold', 'B');
		this.addButton(group, 'italic', 'I');
		this.addButton(group, 'underline', 'U');

		group = this.element.append('span.edit_radio_buttons');
		this.addButton(group, 'justifyleft', 'L');
		this.addButton(group, 'justifycenter', 'C');
		this.addButton(group, 'justifyright', 'R');
		this.addButton(group, 'justifyfull', 'F');

		group = this.element.append('span');
		this.addButton(group, 'link', 'a');

		group = this.element.append('span.edit_radio_buttons');
		this.addButton(group, 'ulist', '\u2022');
		this.addButton(group, 'olist', '#');

		group = this.element.append('span');
		this.addButton(group, 'image', 'im');

		group = this.element.append('span.edit_radio_buttons');
		this.addButton(group, 'im_alignleft', 'L');
		this.addButton(group, 'im_aligncenter', 'C');
		this.addButton(group, 'im_alignright', 'R');

		this.chain_display = this.element.append('div#edit_chain');

		this.element.addEventListener('change', function(aEvent) {
			if (aEvent.target.id == 'edit_node_name') {
				Actions.nodeNameAction();
			}
		}, false);
		this.element.addEventListener('click', function(aEvent) {
			var id = aEvent.target.id;
			switch (id) {
			case 'edit_bold':
			case 'edit_italic':
			case 'edit_underline':
			case 'edit_justifyleft':
			case 'edit_justifycenter':
			case 'edit_justifyright':
			case 'edit_justifyfull':
				return Actions.action(id.substring(5), null);
			case 'edit_link':
				return Actions.linkAction();
			case 'edit_ulist':
			case 'edit_olist':
				return Actions.listAction(id.substr(5, 2));
			case 'edit_image':
				return Actions.imageAction();
			case 'edit_im_alignleft':
			case 'edit_im_aligncenter':
			case 'edit_im_alignright':
				return Actions.imageAlignAction(id.substring(8));
			}
		}, false);

		this.nodeNameSelect.onmousedown = saveSelection;
	},
	show: function() {
		this.element.classList.add(CLASS_SHOWN);
	},
	hide: function() {
		this.element.classList.remove(CLASS_SHOWN);
	},
	addButton: function(aGroup, aName, aText) {
		var button = aGroup.append('button#edit_' + aName, aText);
		button.onmousedown = saveSelection;
		button.onmouseup = restoreSelection;
		this.buttons[aName] = button;
	},
	setNodeName: function(aNodeName) {
		this.nodeNameSelect.selectedIndex = -1;
		for (var i = 0; i < this.nodeNameSelect.options.length; i++) {
			if (this.nodeNameSelect.options[i].value == aNodeName) {
				this.nodeNameSelect.selectedIndex = i;
			}
		}
	},
	setButtonState: function(aButton, aSelected, aDisabled) {
		var classList = this.buttons[aButton].classList;
		classList[aSelected ? 'add' : 'remove'](CLASS_SELECTED);
		classList[aDisabled ? 'add' : 'remove'](CLASS_DISABLED);
	},
	setChain: function(aText, aBold, aItalic, aUnderline, aLink) {
		this.chain_display.textContent = aText;
		this.chain_display.style.fontWeight = aBold ? 'bold' : 'normal';
		this.chain_display.style.fontStyle = aItalic ? 'italic' : 'normal';
		this.chain_display.style.textDecoration = aUnderline ? 'underline' : 'none';
		this.chain_display.style.color = aLink ? 'blue' : '';
	}
};
ToolbarUI.init();

var Actions = {
	action: function(aCommand, aValue) {
		if (!currentDiv) return;
		document.execCommand(aCommand, false, aValue);
	},
	nodeNameAction: function() {
		var blockNode = getBlockNodeForSelection();
		if (!blockNode)
			return;
		if ('selectNodeContents' in range)
			range.selectNodeContents(blockNode);
		else
			range.moveToElementText(blockNode);
		this.action('formatblock', '<' + ToolbarUI.nodeNameSelect.value + '>');
		currentDiv.focus();
		updateUI();
	},
	linkAction: function() {
		var button = ToolbarUI.buttons[LINK];
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
			this.action('unlink', null);
		} else {
			var href;
			if (typeof edit.linkCallback == 'function')
				href = edit.linkCallback('text' in range ? range.text : range.toString(),
					function(aHref) {
						restoreSelection();
						Actions.action('createlink', aHref);
					});
			else
				href = prompt('Type or paste a link:');
			if (href)
				this.action('createlink', href);
		}
	},
	listAction: function(aListType) {
		var currentListType = null;
		if (ToolbarUI.buttons.ulist.classList.contains(CLASS_SELECTED))
			currentListType = 'ul';
		else if (ToolbarUI.buttons.olist.classList.contains(CLASS_SELECTED))
			currentListType = 'ol';

		var blockNode = getBlockNodeForSelection();
		if (!blockNode)
			return;

		if (!currentListType) {
			this.action(aListType == 'ul' ? 'insertUnorderedList' : 'insertOrderedList', null);
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
				if (list.classList.contains(CLASS_EDIT_BLOCK)) {
					break;
				}
			}
			list = list.parentNode;
		}
		var parent = blockNode.parentNode;

		if (currentListType == aListType) { // already a list, remove
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
			var newList = document.createElement(aListType);
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
	},
	imageAction: function() {
		function callbackCallback(aHref) {
			var block = getBlockNodeForSelection();
			var newBlock = document.createElement('div');
			var image = document.createElement('img');
			image.setAttribute('src', aHref);
			newBlock.appendChild(image);
			block.parentNode.insertBefore(newBlock, block);
		}
		var href;
		if (typeof edit.imageCallback == 'function')
			href = edit.imageCallback(function(aHref) {
				restoreSelection();
				callbackCallback(aHref);
			});
		else
			href = 'chiefs.png';
		if (href) {
			callbackCallback(href);
		}
	},
	imageAlignAction: function(aClassName) {
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

		node.classList.remove(CLASS_ALIGN_LEFT);
		node.classList.remove(CLASS_ALIGN_CENTER);
		node.classList.remove(CLASS_ALIGN_RIGHT);
		node.classList.add(aClassName);
	}
};

var range;
var currentDiv = null;
var outputDiv = document.getElementById('edit_output');

var editables = document.getElementsByClassName(CLASS_EDIT_BLOCK);
for (var i = 0; i < editables.length; i++) {
	setContentEditable(editables[i]);
}

document.documentElement.addEventListener('click', function(event) {
	var element = event.target || event.srcElement;
	while (element) {
		if (element.nodeType == 1 &&
				(element.classList.contains(CLASS_EDIT_BLOCK) ||
				element.id == 'edit_toolbar' ||
				element.id == 'darkbox-b')) {
			return;
		}
		element = element.parentNode;
	}
	relocateUI(null);
}, false);

function setContentEditable(div) {
	div.ondblclick = div.onclick = div.onkeyup = updateUI;
	div.ondragenter = div.ondrop = onDragOver;
	div.contentEditable = true;
	div.onfocus = function() {
		relocateUI(this);
	};
	div.onblur = function() {
		if (div.textContent == '') {
			div.innerHTML = '<p>Edit this text</p>';
			div._placeholder = div.firstChild;
		} else if (div.textContent == 'Edit this text') {
			div._placeholder = div.firstChild;
		}
	};

	if (div.textContent == '') {
		div.innerHTML = '<p>Edit this text</p>';
		div._placeholder = div.firstChild;
	}
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
		if (currentDiv._placeholder) {
			if ('createRange' in document) {
				var selection = window.getSelection();
				var range = document.createRange();
				range.selectNodeContents(currentDiv._placeholder);
				selection.removeAllRanges();
				selection.addRange(range);
			} else {
				var range = document.selection.createRange();
				range.moveToElementText(currentDiv._placeholder);
				range.select();
			}
			currentDiv._placeholder = null;
		}
		ToolbarUI.show();
	} else {
		ToolbarUI.hide();
	}
}

function updateUI() {
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
	if (!node)
		return;

	var collapsed = r.collapsed ||
		('compareEndPoints' in r && r.compareEndPoints('StartToEnd', r) == 0);
	var chain = [];
	var leafNode = node.nodeType == 1 ? node : null;
	var blockNode = null;
	var bold = false;
	var italic = false;
	var underline = false;
	var link = false;
	var uList = false;
	var oList = false;
	var image = node.nodeType == 1 && node.localName == 'img';

	do {
		var name;
		if (node.nodeType == 1) {
			name = node.localName;
			if (node.id) name += '#' + node.id;
			if (node.classList) for (var i = 0; i < node.classList.length; i++) name += '.' + node.classList[i];
			if (node.localName == 'b' || node.localName == 'strong' || node.style.fontWeight == 'bold') bold = true;
			if (node.localName == 'i' || node.localName == 'em' || node.style.fontStyle == 'italic') italic = true;
			if (node.localName == 'u' || node.style.textDecoration == 'underline') underline = true;
			if (node.localName == 'a') link = true;
			if (node.localName == 'ul') uList = true;
			if (node.localName == 'ol') oList = true;
		} else if (node.nodeType == 3) {
			name = '#text';//(' + node.length + ')';
		}

		chain.push(name);
		blockNode = node;
		node = node.parentNode;
	} while (node && !node.classList.contains(CLASS_EDIT_BLOCK));

	var alignment = (blockNode.style && blockNode.style.textAlign) || blockNode.align || 'left';

	// console.log([collapsed, leafNode, blockNode, bold, italic, underline, alignment, link, uList, oList, image]);

	ToolbarUI.setChain(
		chain.reverse().join(' > ') + ' [' + blockNode.localName + ', ' + alignment + ']',
		bold, italic, underline, link
	);

	ToolbarUI.setButtonState('bold', bold, collapsed);
	ToolbarUI.setButtonState('italic', italic, collapsed);
	ToolbarUI.setButtonState('underline', underline, collapsed);
	ToolbarUI.setButtonState('justifyleft', alignment == 'left', image);
	ToolbarUI.setButtonState('justifycenter', alignment == 'center', image);
	ToolbarUI.setButtonState('justifyright', alignment == 'right', image);
	ToolbarUI.setButtonState('justifyfull', alignment == 'justify', image);
	ToolbarUI.setButtonState('link', link, (image || collapsed) && !link);
	ToolbarUI.setButtonState('ulist', uList, image);
	ToolbarUI.setButtonState('olist', oList, image);
	ToolbarUI.setButtonState('image', false, image);
	ToolbarUI.setButtonState('im_alignleft', image && leafNode.classList.contains(CLASS_ALIGN_LEFT), !image);
	ToolbarUI.setButtonState('im_aligncenter', image && leafNode.classList.contains(CLASS_ALIGN_CENTER), !image);
	ToolbarUI.setButtonState('im_alignright', image && leafNode.classList.contains(CLASS_ALIGN_RIGHT), !image);

	ToolbarUI.setNodeName(blockNode.localName);
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
		if (node.nodeType == 1 && node.classList.contains(CLASS_EDIT_BLOCK))
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
	outputDiv.textContent = serialize(currentDiv, false);
}

edit.restoreSelection = restoreSelection;
edit.getBlockNodeForSelection = getBlockNodeForSelection;
})();
