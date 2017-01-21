(function() {
	var blocks = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'div', 'li'];

	var CLASS_EDIT_BLOCK = 'edit_block', CLASS_SHOWN = 'edit_shown';
	var CLASS_SELECTED = 'edit_selected', CLASS_PLACEHOLDER = 'edit_placeholder';

	var scriptPath = '';
	for (var i = 0; i < document.scripts.length; i++) {
		var s = document.scripts[i];
		var m = /^(.*\/)pageedit\.js(:\d+)?$/.exec(s.getAttribute('src'));
		if (m) {
			scriptPath = m[1];
			break;
		}
	}

	var NodeTypeUI = {
		container: null,
		button: null,
		dropdown: null,
		currentTypeItem: null,

		init: function() {
			var self = this;

			this.container = document.createElement('div');
			this.container.id = 'edit_nodetype_container';
			this.container.onmousedown = Edit.saveSelection;
			this.button = document.createElement('button');
			this.button.id = 'edit_nodetype_button';
			this.button.textContent = '\u00a0';
			this.container.appendChild(this.button);
			this.button.onclick = function() {
				self.dropdown.classList.toggle(CLASS_SHOWN);
				this.blur();
			};
			this.dropdown = document.createElement('div');
			this.dropdown.id = 'edit_nodetype_dropdown';
			this.container.appendChild(this.dropdown);
			this.dropdown.innerHTML =
				'<div class="edit_nodetype_item" data-tag="h1"><h1>Heading 1</h1></div>' +
				'<div class="edit_nodetype_item" data-tag="h2"><h2>Heading 2</h2></div>' +
				'<div class="edit_nodetype_item" data-tag="h3"><h3>Heading 3</h3></div>' +
				'<div class="edit_nodetype_item" data-tag="p"><p>Paragraph</p></div>' +
				'<div class="edit_nodetype_item" data-tag="pre"><pre>Preformatted</pre></div>';
			this.dropdown.onclick = function(event) {
				self.dropdownClick(event);
			};

			document.documentElement.addEventListener('click', function(event) {
				if (!(Edit.NodeTypeUI.container.compareDocumentPosition(event.target) & Node.DOCUMENT_POSITION_CONTAINED_BY)) {
					self.dropdown.classList.remove(CLASS_SHOWN);
				}
			}, false);

			return this.container;
		},
		dropdownClick: function(event) {
			var target = event.target;
			if (!target.classList.contains('edit_nodetype_item')) {
				target = target.parentNode;
			}

			Edit.restoreSelection();
			Edit.Actions.action('formatblock', target.dataset.tag);
			Edit.currentBlock.focus();

			this.button.textContent = target.textContent;
			this.dropdown.classList.remove(CLASS_SHOWN);
		},
		setNodeType: function(text) {
			if (this.currentTypeItem) {
				this.currentTypeItem.classList.remove(CLASS_SELECTED);
			}

			var items = this.dropdown.querySelectorAll('.edit_nodetype_item');
			for (var i = 0; i < items.length; i++) {
				if (items[i].dataset.tag == text) {
					items[i].classList.add(CLASS_SELECTED);
					this.currentTypeItem = items[i];
					this.button.textContent = items[i].textContent;
					this.button.disabled = false;
					return;
				}
			}
			this.button.textContent = '\u00a0';
			this.button.disabled = true;
		}
	};

	var ToolbarUI = {
		element: null,
		buttons: {},

		init: function() {
			this.element = document.createElement('div');
			this.element.id = 'edit_toolbar';
			this.element.classList.add('edit_ui');
			document.body.appendChild(this.element);

			this.element.appendChild(NodeTypeUI.init());

			var group = document.createElement('span');
			this.element.appendChild(group);
			this.addButton(group, 'bold', 'B');
			this.addButton(group, 'italic', 'I');
			this.addButton(group, 'underline', 'U');

			group = document.createElement('span');
			group.classList.add('edit_radio_buttons');
			this.element.appendChild(group);
			this.addButton(group, 'justifyleft', null, 'text_align_left.png');
			this.addButton(group, 'justifycenter', null, 'text_align_center.png');
			this.addButton(group, 'justifyright', null, 'text_align_right.png');
			this.addButton(group, 'justifyfull', null, 'text_align_justify.png');

			group = document.createElement('span');
			this.element.appendChild(group);
			this.addButton(group, 'link', 'a');

			group = document.createElement('span');
			group.classList.add('edit_radio_buttons');
			this.element.appendChild(group);
			this.addButton(group, 'ulist', null, 'text_list_bullets.png');
			this.addButton(group, 'olist', null, 'text_list_numbers.png');

			group = document.createElement('span');
			this.element.appendChild(group);
			this.addButton(group, 'indent', null, 'text_indent.png');
			this.addButton(group, 'outdent', null, 'text_indent_remove.png');

			group = document.createElement('span');
			this.element.appendChild(group);
			this.addButton(group, 'image', null, 'picture.png');

			this.element.addEventListener('mousedown', function(event) {
				if (event.target == this) {
					event.preventDefault();
				}
			}, false);
			this.element.addEventListener('click', function(event) {
				var id = event.target.localName == 'img' ? event.target.parentNode.id : event.target.id;
				switch (id) {
				case 'edit_bold':
				case 'edit_italic':
				case 'edit_underline':
				case 'edit_justifyleft':
				case 'edit_justifycenter':
				case 'edit_justifyright':
				case 'edit_justifyfull':
				case 'edit_indent':
				case 'edit_outdent':
					Actions.action(id.substring(5), null);
					return;
				case 'edit_link':
					Actions.linkCallbackAction();
					return;
				case 'edit_ulist':
				case 'edit_olist':
					Actions.listAction(id.substr(5, 2));
					return;
				case 'edit_image':
					Actions.imageCallbackAction();
					return;
				}
			}, false);

			this.setInactive();
		},
		show: function() {
			this.element.classList.add(CLASS_SHOWN);
		},
		hide: function() {
			this.element.classList.remove(CLASS_SHOWN);
		},
		addButton: function(group, name, text, image) {
			var button = document.createElement('button');
			button.id = 'edit_' + name;
			button.textContent = text;
			group.appendChild(button);
			button.onmousedown = Edit.saveSelection;
			button.onmouseup = function() {
				Edit.restoreSelection();
				Edit.currentBlock.focus();
			};
			if (image) {
				var img = document.createElement('img');
				img.src = scriptPath + 'icons/' + image;
				button.appendChild(img);
			}
			this.buttons[name] = button;
			return button;
		},
		setButtonState: function(button, selected, disabled) {
			this.buttons[button].classList[selected ? 'add' : 'remove'](CLASS_SELECTED);
			this.buttons[button].disabled = disabled;
		},
		setInactive: function() {
			this.setButtonState('bold', false, true);
			this.setButtonState('italic', false, true);
			this.setButtonState('underline', false, true);
			this.setButtonState('justifyleft', false, true);
			this.setButtonState('justifycenter', false, true);
			this.setButtonState('justifyright', false, true);
			this.setButtonState('justifyfull', false, true);
			this.setButtonState('link', false, true);
			this.setButtonState('ulist', false, true);
			this.setButtonState('olist', false, true);
			this.setButtonState('indent', false, true);
			this.setButtonState('outdent', false, true);
			this.setButtonState('image', false, true);
			NodeTypeUI.setNodeType(null);
		}
	};

	var Actions = {
		action: function(command, value) {
			if (!Edit.currentBlock) {
				return;
			}
			Edit.currentWindow.document.execCommand(command, false, value);
		},
		linkCallbackAction: function() {
			if (!Edit.currentBlock) {
				return;
			}
			var button = ToolbarUI.buttons.link;
			if (button.classList.contains(CLASS_SELECTED)) {
				var range = Edit.getRange();
				if (!range) {
					return;
				}
				var node = Edit.savedRange.startContainer;
				if (node == range.endContainer &&
						node.nodeType == Node.ELEMENT_NODE &&
						range.startOffset == range.endOffset - 1) {
					node = node.childNodes[range.startOffset];
				}

				while (node && node.parentNode.localName != 'body') {
					if (node.nodeType == Node.ELEMENT_NODE) {
						if (node.localName == 'a') {
							range.selectNode(node);
							this.action('unlink', null);
							break;
						}
					}
					node = node.parentNode;
				}
			} else {
				var returnedHref;
				if (typeof Edit.linkCallback == 'function') {
					returnedHref = Edit.linkCallback(Edit.savedRange.toString(), function(href) {
						Edit.restoreSelection();
						Actions.action('createlink', href);
					});
				} else {
					returnedHref = prompt('Type or paste a link:');
				}
				if (returnedHref) {
					this.action('createlink', returnedHref);
				}
			}
			Edit.updateUI();
		},
		linkAction: function(linkAttributes) {
			if (!Edit.currentBlock) {
				return;
			}
			Edit.restoreSelection();
			Edit.currentWindow.document.execCommand('createlink', null, linkAttributes.href);
			var range = Edit.currentWindow.getSelection().getRangeAt(0);

			var link;
			if (range.startContainer.nodeType == Node.TEXT_NODE && range.startContainer == range.endContainer) {
				link = range.startContainer.parentNode;
			} else {
				link = range.startContainer.childNodes[range.startOffset];
				range.selectNodeContents(link);
			}
			if (!(link instanceof HTMLAnchorElement)) {
				throw 'Something odd happened.';
			}
			if (linkAttributes.target) {
				link.setAttribute('target', linkAttributes.target);
			}
			Edit.updateUI();
		},
		listAction: function(listType) {
			if (!Edit.currentBlock) {
				return;
			}
			var currentListType = null;
			if (ToolbarUI.buttons.ulist.classList.contains(CLASS_SELECTED)) {
				currentListType = 'ul';
			} else if (ToolbarUI.buttons.olist.classList.contains(CLASS_SELECTED)) {
				currentListType = 'ol';
			}

			var blockNode = Edit.getBlockNodeForSelection();
			if (!blockNode) {
				return;
			}

			if (!currentListType) {
				this.action(listType == 'ul' ? 'insertUnorderedList' : 'insertOrderedList', null);
				Edit.updateUI();
				return;
			}

			var list = Edit.savedRange.startContainer;
			if (list.nodeType == Node.ELEMENT_NODE) {
				list = list.childNodes[Edit.savedRange.startOffset];
			}

			while (list) {
				if (list.nodeType == Node.ELEMENT_NODE) {
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

			if (currentListType == listType) { // already a list, remove
				var next = blockNode.nextSibling;
				Edit.savedRange.setStartAfter(blockNode);
				for (var i = 0; i < blockNode.childElementCount; i++) {
					var li = blockNode.children[i];
					var p = document.createElement('p');
					var n = li.firstChild;
					while (n) {
						if ((!parent.classList.contains(CLASS_EDIT_BLOCK)) ||
								(n.nodeType == Node.ELEMENT_NODE && blocks.indexOf(n.localName) >= 0)) {
							parent.insertBefore(n, next);
							Edit.savedRange.setEndAfter(n);
						} else {
							p.appendChild(n);
						}
						n = li.firstChild;
					}
					if (p.childNodes.length) {
						parent.insertBefore(p, next);
						Edit.savedRange.setEndAfter(p);
					}
				}
				parent.removeChild(blockNode);

			} else { // convert to other type of list
				var newList = document.createElement(listType);
				var li = blockNode.firstChild;
				while (li) {
					newList.appendChild(li);
					li = blockNode.firstChild;
				}
				parent.replaceChild(newList, blockNode);
				Edit.savedRange.selectNode(newList);
			}
			Edit.updateUI();
		},
		imageCallbackAction: function() {
			if (typeof Edit.imageCallback == 'function') {
				Edit.saveSelection();
				var existing;
				var range = Edit.savedRange;
				if (range && range.startContainer.nodeType == Node.ELEMENT_NODE) {
					if (range.startContainer instanceof HTMLImageElement) {
						existing = range.startContainer;
					} else {
						var child = range.startContainer.childNodes[range.startOffset];
						if (child instanceof HTMLImageElement) {
							existing = child;
						}
					}
				}
				Edit.imageCallback(existing);
			} else {
				console.error('No Edit.imageCallback.');
			}
		},
		imageAction: function(imageAttributes) {
			if (!Edit.currentBlock) {
				return;
			}
			if (!imageAttributes.src) {
				throw 'No image src';
			}
			Edit.restoreSelection();

			var image = Edit.currentWindow.document.createElement('img');
			image.src = imageAttributes.src;
			image.setAttribute('width', imageAttributes.width);
			image.setAttribute('height', imageAttributes.height);

			var range = Edit.currentWindow.getSelection().getRangeAt(0);
			range.deleteContents();
			range.insertNode(image);
			range.selectNode(image);
		}
	};

	function EditArea(content) {
		this.content = content;
		this.init();
	}
	EditArea.prototype = {
		content: null,
		init: function() {
			this.content.editArea = this;

			this.content.classList.add(CLASS_EDIT_BLOCK);
			this.content.onclick = Edit.updateUI;
			this.content.contentEditable = true;

			var content = this.content;
			var contentDocument = content.ownerDocument;
			var contentWindow = contentDocument.defaultView;

			contentWindow.onfocus = function() {
				Edit.setCurrentBlock(content);

				if (content._placeholder) {
					var selection = contentWindow.getSelection();
					selection.removeAllRanges();
					var r = contentDocument.createRange();
					r.selectNodeContents(content._placeholder);
					selection.addRange(r);
				}
				content.classList.remove(CLASS_PLACEHOLDER);
			};
			contentWindow.onblur = function() {
				for (var i = 0; i < content.childNodes.length; i++) {
					var node = content.childNodes[i];
					if (node.nodeType == Node.TEXT_NODE) {
						if (node.nodeValue.trim()) {
							var p = contentDocument.createElement('p');
							p.textContent = node.nodeValue;
							content.replaceChild(p, node);
						} else {
							node.remove();
							i--;
						}
					}
				}
				delete content._placeholder;
				content.classList.remove(CLASS_PLACEHOLDER);
				if (content.textContent == '') {
					content.innerHTML = '<p>Edit this text</p>';
					content._placeholder = content.firstChild;
					content.classList.add(CLASS_PLACEHOLDER);
				} else if (content.textContent == 'Edit this text') {
					content._placeholder = content.firstChild;
					content.classList.add(CLASS_PLACEHOLDER);
				}
			};
			this.content.onkeypress = function(event) {
				if (event.ctrlKey) {
					switch (event.charCode) {
					case 98:
						Edit.Actions.action('bold', null);
						event.preventDefault();
						break;
					case 105:
						Edit.Actions.action('italic', null);
						event.preventDefault();
						break;
					case 117:
						Edit.Actions.action('underline', null);
						event.preventDefault();
						break;
					}
				}
			};
			this.content.onkeyup = function() {
				if (content.textContent == '') {
					content.innerHTML = '';
					var p = contentDocument.createElement('p');
					p.textContent = 'Edit this text';
					content.appendChild(p);
					content._placeholder = p;

					var selection = contentWindow.getSelection();
					selection.removeAllRanges();
					var r = contentDocument.createRange();
					r.selectNodeContents(p);
					selection.addRange(r);
				}
				Edit.updateUI();
			};

			if (this.content.textContent == '') {
				this.content.innerHTML = '<p>Edit this text</p>';
				this.content._placeholder = this.content.firstChild;
				this.content.classList.add(CLASS_PLACEHOLDER);
			}
		},
		destroy: function() {
			this.content.classList.remove(CLASS_EDIT_BLOCK);
			this.content.contentEditable = false;
			this.content.onblur =
				this.content.onclick =
				this.content.ondblclick =
				this.content.ondragenter =
				this.content.ondrop =
				this.content.onfocus =
				this.content.onkeyup = null;
		},
		input: function(html) {
			this.content.innerHTML = html;
			delete this.content._placeholder;
			this.content.classList.remove(CLASS_PLACEHOLDER);
		},
		output: function() {
			if (this.content._placeholder) {
				return '';
			}
			return Serializer.serialize(this.content);
		}
	};

	var Serializer = {
		escapeHTML: function(str) {
			return str.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');
		},
		isBlock: function(node) {
			if (!node || node.nodeType != Node.ELEMENT_NODE) {
				return false;
			}
			return ['div', 'h1', 'h2', 'h3', 'p', 'ol', 'ul'].indexOf(node.localName) >= 0;
		},
		serialize: function(node) {
			return this.serializeInternal(node, false);
		},
		serializeInternal: function(node, outer) {
			if (node.nodeType == Node.TEXT_NODE) {
				if (!node.nodeValue.trim() && (this.isBlock(node.previousSibling) || this.isBlock(node.nextSibling))) {
					return '';
				}
				return this.escapeHTML(node.nodeValue);
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
					if (attribute.name == 'contenteditable' || attribute.name == 'draggable') {
						continue;
					}
					if (attribute.name[0] == '_') {
						continue;
					}
					if (attribute.name == 'style' && attribute.value == '') {
						continue;
					}
					str += ' ' + attribute.name + '=';
					str += '"' + attribute.value + '"';
				}
				if (node.localName == 'hr') {
					return str + '/>\n';
				} else if (['br', 'img', 'input', 'link', 'meta'].indexOf(node.localName) >= 0 && node.childNodes.length == 0) {
					return str + '/>';
				}
				str += '>';
			}

			if (!node._placeholder) {
				for (var i = 0; i < node.childNodes.length; i++) {
					str += this.serializeInternal(node.childNodes[i], true);
				}
			}

			if (outer) {
				str += '</' + node.localName + '>';
				if (this.isBlock(node)) {
					str += '\n';
				}
			}

			return str;
		}
	};

	var Edit = {
		scriptPath: scriptPath,
		currentBlock: null,
		currentWindow: null,
		savedRange: null,

		Actions: Actions,
		ToolbarUI: ToolbarUI,
		NodeTypeUI: NodeTypeUI,
		Serializer: Serializer,
		EditArea: EditArea,

		setCurrentBlock: function(div) {
			if (div == this.currentBlock) {
				return;
			}
			this.currentBlock = div;
			this.range = null;
			if (this.currentBlock) {
				this.currentWindow = div.ownerDocument.defaultView;
				ToolbarUI.show();
			} else {
				this.currentWindow = null;
				ToolbarUI.hide();
				ToolbarUI.setInactive();
			}
		},
		updateUI: function() {
			var range = Edit.getRange();
			if (!range) {
				ToolbarUI.setInactive();
				return;
			}

			var node = range.startContainer;
			var collapsed = range.collapsed;
			var doc = node.ownerDocument;

			if (node == range.endContainer &&
					node.nodeType == Node.ELEMENT_NODE &&
					range.startOffset == range.endOffset - 1) {
				node = node.childNodes[range.startOffset];
			}

			var alignment = 'left';
			if (doc.queryCommandState('justifycenter')) {
				alignment = 'center';
			} else if (doc.queryCommandState('justifyright')) {
				alignment = 'right';
			} else if (doc.queryCommandState('justifyfull')) {
				alignment = 'justify';
			}

			var bold = doc.queryCommandState('bold');
			var italic = doc.queryCommandState('italic');
			var underline = doc.queryCommandState('underline');
			var link = false;
			var uList = doc.queryCommandState('insertUnorderedList');
			var oList = doc.queryCommandState('insertOrderedList');
			var image = false;

			while (node && node.parentNode.localName != 'body') {
				if (node.nodeType == Node.ELEMENT_NODE) {
					if (node.localName == 'a') {
						link = true;
					} else if (node.localName == 'img') {
						image = true;
					}
				}
				node = node.parentNode;
			}

			ToolbarUI.setButtonState('bold', bold, image);
			ToolbarUI.setButtonState('italic', italic, image);
			ToolbarUI.setButtonState('underline', underline, image);
			ToolbarUI.setButtonState('justifyleft', alignment == 'left', false);
			ToolbarUI.setButtonState('justifycenter', alignment == 'center', false);
			ToolbarUI.setButtonState('justifyright', alignment == 'right', false);
			ToolbarUI.setButtonState('justifyfull', alignment == 'justify', false);
			ToolbarUI.setButtonState('link', link, collapsed && !link);
			ToolbarUI.setButtonState('ulist', uList, image);
			ToolbarUI.setButtonState('olist', oList, image);
			ToolbarUI.setButtonState('indent', false, !uList && !oList);
			ToolbarUI.setButtonState('outdent', false, !uList && !oList);
			ToolbarUI.setButtonState('image', false, false);

			NodeTypeUI.setNodeType(node ? node.localName : null);
		},
		getBlockNodeForSelection: function() {
			var node;
			var range = this.getRange();
			if (!range) {
				return null;
			}

			node = range.startContainer;
			if (node.nodeType == Node.ELEMENT_NODE && node.classList.contains(CLASS_EDIT_BLOCK)) {
				if (range.startOffset == 0) {
					return node.firstElementChild;
				} else {
					return node.lastElementChild;
				}
			}

			do {
				if (node.nodeType == Node.ELEMENT_NODE && node.matches('.' + CLASS_EDIT_BLOCK + ' > *')) {
					return node;
				}
				node = node.parentNode;
			} while (node);

			return null;
		},
		getRange: function() {
			if (this.currentWindow) {
				var selection = this.currentWindow.getSelection();
				if (selection.rangeCount) {
					return selection.getRangeAt(0);
				}
			}
			return null;
		},
		saveSelection: function() {
			Edit.savedRange = Edit.getRange();
		},
		restoreSelection: function() {
			if (!Edit.savedRange) {
				return;
			}

			var selection = this.currentWindow.getSelection();
			selection.removeAllRanges();
			selection.addRange(Edit.savedRange);
			// Edit.currentBlock.focus();
			if (Edit.savedRange.startContainer.nodeType == Node.ELEMENT_NODE) {
				Edit.savedRange.startContainer.focus();
			} else {
				Edit.savedRange.startContainer.parentNode.focus();
			}
			setTimeout(Edit.updateUI, 0);
		}
	};

	ToolbarUI.init();

	function listener(event) {
		if (!Edit.currentBlock) {
			return;
		}
		var ui = document.querySelectorAll('.edit_ui');
		for (var i = 0; i < ui.length; i++) {
			if (ui[i] == event.target ||
					ui[i].compareDocumentPosition(event.target) & Node.DOCUMENT_POSITION_CONTAINED_BY) {
				return;
			}
		}
		Edit.setCurrentBlock(null);
	}
	document.documentElement.addEventListener('click', listener);
	document.documentElement.addEventListener('keyup', listener);

	window.Edit = Edit;
})();
