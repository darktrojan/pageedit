(function() {
var blocks = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'div', 'li'];

var CLASS_EDIT_BLOCK = 'edit_block', CLASS_SHOWN = 'edit_shown', CLASS_CURRENT = 'edit_current';
var CLASS_SELECTED = 'edit_selected', CLASS_DISABLED = 'edit_disabled', CLASS_PLACEHOLDER = 'edit_placeholder';
var CLASS_ALIGN_LEFT = 'alignleft', CLASS_ALIGN_CENTER = 'aligncenter', CLASS_ALIGN_RIGHT = 'alignright';

var ToolbarUI = {
	element: null,
	imagePrefix: '',
	nodeNameSelect: null,
	buttons: {},
	chain_display: null,

	init: function() {
		this.element = document.body.append('div#edit_toolbar');

		for (var i = 0; i < document.scripts.length; i++) {
			var s = document.scripts[i];
			var m = /^(.*\/)pageedit\.js$/.exec(s.src);
			if (m)
				this.imagePrefix = m[1];
		}

		this.nodeNameSelect = this.element.append('select#edit_node_name');
		this.nodeNameSelect.append('option', 'Heading 1', { 'value': 'h1' });
		this.nodeNameSelect.append('option', 'Heading 2', { 'value': 'h2' });
		this.nodeNameSelect.append('option', 'Heading 3', { 'value': 'h3' });
		this.nodeNameSelect.append('option', 'Paragraph', { 'value': 'p' });
		this.nodeNameSelect.onmousedown = Edit.saveSelection;

		var group = this.element.append('span');
		this.addButton(group, 'bold', 'B');
		this.addButton(group, 'italic', 'I');
		this.addButton(group, 'underline', 'U');

		group = this.element.append('span.edit_radio_buttons');
		this.addButton(group, 'justifyleft', null, 'text_align_left.png');
		this.addButton(group, 'justifycenter', null, 'text_align_center.png');
		this.addButton(group, 'justifyright', null, 'text_align_right.png');
		this.addButton(group, 'justifyfull', null, 'text_align_justify.png');

		group = this.element.append('span');
		this.addButton(group, 'link', 'a');

		group = this.element.append('span.edit_radio_buttons');
		this.addButton(group, 'ulist', null, 'text_list_bullets.png');
		this.addButton(group, 'olist', null, 'text_list_numbers.png');

		group = this.element.append('span');
		this.addButton(group, 'image', null, 'picture.png');

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
			var id = aEvent.target.localName == 'img' ? aEvent.target.parentNode.id : aEvent.target.id;
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
	},
	show: function() {
		this.element.classList.add(CLASS_SHOWN);
	},
	hide: function() {
		this.element.classList.remove(CLASS_SHOWN);
	},
	addButton: function(aGroup, aName, aText, aImage) {
		var button = aGroup.append('button#edit_' + aName, aText);
		button.onmousedown = Edit.saveSelection;
		button.onmouseup = Edit.restoreSelection;
		if (aImage)
			button.append('img', null, { 'src': this.imagePrefix + aImage });
		this.buttons[aName] = button;
		return button;
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

var Actions = {
	action: function(aCommand, aValue) {
		if (!Edit.currentBlock) return;
		document.execCommand(aCommand, false, aValue);
	},
	nodeNameAction: function() {
		var blockNode = Edit.getBlockNodeForSelection();
		if (!blockNode)
			return;
		if ('selectNodeContents' in Edit.savedRange)
			Edit.savedRange.selectNodeContents(blockNode);
		else
			Edit.savedRange.moveToElementText(blockNode);
		this.action('formatblock', '<' + ToolbarUI.nodeNameSelect.value + '>');
		Edit.currentBlock.focus();
		Edit.updateUI();
	},
	linkAction: function() {
		var button = ToolbarUI.buttons['link'];
		if (button.classList.contains(CLASS_SELECTED)) {
			var node = Edit.savedRange.startContainer;
			if (node.nodeType == 3 && Edit.savedRange.startOffset == node.length && node.nextSibling) {
				node = node.nextSibling;
			}
			if (node.childNodes.length == 1) {
				node = node.firstChild;
			}
			if (node.nodeType == 1) {
				node = node.childNodes[Edit.savedRange.startOffset];
			}
			while (node) {
				if (node.nodeType == 1 && node.localName == 'a')
					break;
				node = node.parentNode;
			}
			if ('selectNode' in Edit.savedRange)
				Edit.savedRange.selectNode(node);
			else
				Edit.savedRange.moveToElementText(node);
			this.action('unlink', null);
		} else {
			var href;
			if (typeof Edit.linkCallback == 'function')
				href = Edit.linkCallback('text' in Edit.savedRange ? Edit.savedRange.text : Edit.savedRange.toString(),
					function(aHref) {
						Edit.restoreSelection();
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

		var blockNode = Edit.getBlockNodeForSelection();
		if (!blockNode)
			return;

		if (!currentListType) {
			this.action(aListType == 'ul' ? 'insertUnorderedList' : 'insertOrderedList', null);
			Edit.updateUI();
			return;
		}

		var list;
		if ('startContainer' in Edit.savedRange) {
			list = Edit.savedRange.startContainer;
			if (list.nodeType == 1)
				list = list.childNodes[Edit.savedRange.startOffset];
		} else {
			var r2 = Edit.savedRange.duplicate();
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
			Edit.savedRange.setStartAfter(blockNode);
			for (var i = 0; i < blockNode.childElementCount; i++) {
				var li = blockNode.children[i];
				var p = document.createElement('p');
				var n;
				while (n = li.firstChild) {
					if ((!parent.classList.contains(CLASS_EDIT_BLOCK)) ||
							(n.nodeType == 1 && blocks.indexOf(n.localName) >= 0)) {
						parent.insertBefore(n, next);
						Edit.savedRange.setEndAfter(n);
					} else {
						p.appendChild(n);
					}
				}
				if (p.childNodes.length) {
					parent.insertBefore(p, next);
					Edit.savedRange.setEndAfter(p);
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
			if ('selectNode' in Edit.savedRange)
				Edit.savedRange.selectNode(newList);
			else
				Edit.savedRange.moveToElementText(newList);
		}
		Edit.updateUI();
	},
	imageAction: function() {
		function callback(aHref) {
			var block = Edit.getBlockNodeForSelection();
			var newBlock = document.createElement('div');
			var image = document.createElement('img');
			image.setAttribute('src', aHref);
			newBlock.appendChild(image);
			block.parentNode.insertBefore(newBlock, block);
		}
		var href;
		if (typeof Edit.imageCallback == 'function') {
			href = Edit.imageCallback(function(aHref) {
				Edit.restoreSelection();
				callback(aHref);
			});
		}
		if (href) {
			callback(href);
		}
	},
	imageAlignAction: function(aClassName) {
		var node;
		var range = Edit.getRange();

		node = range.startContainer;
		if (node.nodeType == 1)
			node = node.childNodes[range.startOffset];
		else if (node.nodeType == 3 && range.startOffset == node.length && node.nextSibling)
			node = node.nextSibling;
		else if (node.childNodes.length == 1)
			node = node.firstChild;

		if (!node || node.localName != 'img')
			return;

		node.classList.remove(CLASS_ALIGN_LEFT);
		node.classList.remove(CLASS_ALIGN_CENTER);
		node.classList.remove(CLASS_ALIGN_RIGHT);
		node.classList.add(aClassName);
	}
};

var Edit = {
	currentBlock: null,
	savedRange: null,

	Actions: Actions,
	ToolbarUI: ToolbarUI,

	setContentEditable: function(aBlock) {
		function onDragOver(aEvent) {
			var hasFiles = aEvent.dataTransfer.files && aEvent.dataTransfer.files.length;
			if (hasFiles)
				aEvent.preventDefault();

			// var isHTML = aEvent.dataTransfer.types.contains('text/html');
			// if (isHTML) {
			//   var htmlContent = aEvent.dataTransfer.getData('text/html');
			//   if (htmlContent.indexOf('<img') >= 0)
			//     aEvent.preventDefault();
			// }

			// var o = document.getElementById('edit_output');
			// o.textContent = '';
			// for (var i = 0; i < aEvent.dataTransfer.types.length; i++) {
			//   o.textContent += aEvent.dataTransfer.types[i] + '\n';
			// }
		}

		aBlock.classList.add(CLASS_EDIT_BLOCK);
		aBlock.ondblclick = aBlock.onclick = Edit.updateUI;
		aBlock.ondragenter = aBlock.ondrop = onDragOver;
		aBlock.contentEditable = true;
		aBlock.onfocus = function() {
			Edit.setCurrentBlock(this);

			if (this._placeholder) {
				var selection = window.getSelection();
				selection.removeAllRanges();
				var r = document.createRange();
				r.selectNodeContents(this._placeholder);
				selection.addRange(r);
			}
			this.classList.remove(CLASS_PLACEHOLDER);
		};
		aBlock.onblur = function() {
			for (var i = 0; i < this.childNodes.length; i++) {
				var node = this.childNodes[i];
				if (node.nodeType == 3) {
					this.replaceChild(createElement('p', node.nodeValue), node);
				}
			}
			this._placeholder = null;
			this.classList.remove(CLASS_PLACEHOLDER);
			if (aBlock.textContent == '') {
				aBlock.innerHTML = '<p>Edit this text</p>';
				aBlock._placeholder = aBlock.firstChild;
				this.classList.add(CLASS_PLACEHOLDER);
			} else if (aBlock.textContent == 'Edit this text') {
				aBlock._placeholder = aBlock.firstChild;
				this.classList.add(CLASS_PLACEHOLDER);
			}
		};
		aBlock.onkeyup = function() {
			if (this.textContent == '') {
				this.clearChildNodes();
				var p = this.append('p', 'Edit this text');
				this._placeholder = p;

				var selection = window.getSelection();
				selection.removeAllRanges();
				var r = document.createRange();
				r.selectNodeContents(p);
				selection.addRange(r);
			}
			Edit.updateUI();
		};

		if (aBlock.textContent == '') {
			aBlock.innerHTML = '<p>Edit this text</p>';
			aBlock._placeholder = aBlock.firstChild;
			aBlock.classList.add(CLASS_PLACEHOLDER);
		}
	},
	setCurrentBlock: function(aDiv) {
		if (aDiv == this.currentBlock)
			return;
		if (this.currentBlock)
			this.currentBlock.classList.remove(CLASS_CURRENT);
		this.currentBlock = aDiv;
		this.range = null;
		if (this.currentBlock) {
			this.currentBlock.classList.add(CLASS_CURRENT);
			ToolbarUI.show();
		} else {
			ToolbarUI.hide();
		}
	},
	updateUI: function() {
		var range = Edit.getRange();
		var node = range.startContainer;
		var collapsed = range.collapsed;

		if (node.nodeType == 1)
			node = node.childNodes[range.startOffset];
		else if (node.nodeType == 3 && range.startOffset == node.length && node.nextSibling)
			node = node.nextSibling;
		else if (node.childNodes.length == 1)
			node = node.firstChild;

		if (!node)
			return;

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

		ToolbarUI.setButtonState('bold', bold, collapsed || image);
		ToolbarUI.setButtonState('italic', italic, collapsed || image);
		ToolbarUI.setButtonState('underline', underline, collapsed || image);
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
	},
	getBlockNodeForSelection: function() {
		var node;
		var range = this.getRange();
		if (!range)
			return null;
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
	},
	getRange: function() {
		var selection = window.getSelection();
		if (selection.rangeCount) {
			return selection.getRangeAt(0);
		}
	},
	saveSelection: function() {
		Edit.savedRange = Edit.getRange();
	},
	restoreSelection: function() {
		if (!Edit.savedRange)
			return;

		var selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(Edit.savedRange);
		Edit.currentBlock.focus();
		setTimeout(Edit.updateUI, 0);
	}
};

ToolbarUI.init();
document.documentElement.addEventListener('click', function(aEvent) {
	var element = aEvent.target || aEvent.srcElement;
	while (element) {
		if (element.nodeType == 1 &&
				(element.classList.contains(CLASS_EDIT_BLOCK) ||
				element.id == 'edit_toolbar' ||
				element.id == 'darkbox-b')) {
			return;
		}
		element = element.parentNode;
	}
	Edit.setCurrentBlock(null);
}, false);

window.Edit = Edit;
})();
