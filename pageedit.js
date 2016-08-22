/* globals createElement, serialize */
(function() {
	var blocks = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'div', 'li'];

	var CLASS_EDIT_BLOCK = 'edit_block', CLASS_SHOWN = 'edit_shown', CLASS_CURRENT = 'edit_current';
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

			this.container = createElement('div#edit_nodetype_container');
			this.container.onmousedown = Edit.saveSelection;
			this.button = this.container.append('button#edit_nodetype_button', '\u00a0');
			this.button.onclick = function() {
				self.dropdown.classList.toggle(CLASS_SHOWN);
				this.blur();
			};
			this.dropdown = this.container.append('div#edit_nodetype_dropdown');
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
				if (!event.target.ancestor('#edit_nodetype_container')) {
					self.dropdown.classList.remove(CLASS_SHOWN);
				}
			}, false);

			return this.container;
		},
		dropdownClick: function(event) {
			var item = event.target.ancestor('.edit_nodetype_item');
			if (!item) {
				return;
			}

			Edit.restoreSelection();
			Edit.Actions.action('formatblock', item.dataset.tag);

			this.button.textContent = item.textContent;
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
		chain_display: null,

		init: function() {
			this.element = document.body.append('div#edit_toolbar');

			this.element.appendChild(NodeTypeUI.init());

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
			this.addButton(group, 'indent', null, 'text_indent.png');
			this.addButton(group, 'outdent', null, 'text_indent_remove.png');

			group = this.element.append('span');
			this.addButton(group, 'image', null, 'picture.png');

			this.chain_display = this.element.append('div#edit_chain');

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
					Actions.linkAction();
					return;
				case 'edit_ulist':
				case 'edit_olist':
					Actions.listAction(id.substr(5, 2));
					return;
				case 'edit_image':
					Actions.imageAction();
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
			var button = group.append('button#edit_' + name, text);
			button.onmousedown = Edit.saveSelection;
			button.onmouseup = Edit.restoreSelection;
			if (image) {
				button.append('img', null, { 'src': scriptPath + 'icons/' + image });
			}
			this.buttons[name] = button;
			return button;
		},
		setButtonState: function(button, selected, disabled) {
			this.buttons[button].classList[selected ? 'add' : 'remove'](CLASS_SELECTED);
			this.buttons[button].disabled = disabled;
		},
		setChain: function(text, bold, italic, underline, link) {
			this.chain_display.textContent = text;
			this.chain_display.style.fontWeight = bold ? 'bold' : 'normal';
			this.chain_display.style.fontStyle = italic ? 'italic' : 'normal';
			this.chain_display.style.textDecoration = underline ? 'underline' : 'none';
			this.chain_display.style.color = link ? 'blue' : '';
		},
		setInactive: function() {
			this.setChain('', false, false, false, false);
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
			document.execCommand(command, false, value);
		},
		linkAction: function() {
			var button = ToolbarUI.buttons.link;
			if (button.classList.contains(CLASS_SELECTED)) {
				var node = Edit.savedRange.startContainer;
				if (node.nodeType == Node.TEXT_NODE && Edit.savedRange.startOffset == node.length && node.nextSibling) {
					node = node.nextSibling;
				}
				if (node.childNodes.length == 1) {
					node = node.firstChild;
				}
				if (node.nodeType == Node.ELEMENT_NODE) {
					node = node.childNodes[Edit.savedRange.startOffset];
				}
				while (node) {
					if (node.nodeType == Node.ELEMENT_NODE && node.localName == 'a') {
						break;
					}
					node = node.parentNode;
				}
				Edit.savedRange.selectNode(node);
				this.action('unlink', null);
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
		},
		listAction: function(listType) {
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
					var n;
					while (n = li.firstChild) {
						if ((!parent.classList.contains(CLASS_EDIT_BLOCK)) ||
								(n.nodeType == Node.ELEMENT_NODE && blocks.indexOf(n.localName) >= 0)) {
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
				var newList = document.createElement(listType);
				var li;
				while (li = blockNode.firstChild) {
					newList.appendChild(li);
				}
				parent.replaceChild(newList, blockNode);
				Edit.savedRange.selectNode(newList);
			}
			Edit.updateUI();
		},
		imageAction: function() {
			if (typeof Edit.imagePromiseCallback == 'function') {
				new Promise(Edit.imagePromiseCallback).then(function(imageAttributes) {
					Edit.restoreSelection();
					var block = Edit.getBlockNodeForSelection();
					var newBlock = document.createElement('div');
					newBlock.setAttribute('draggable', 'true');
					newBlock.contentEditable = false;
					var image = document.createElement('img');
					image.setAttribute('src', imageAttributes.src);
					if (imageAttributes.width) {
						image.setAttribute('width', imageAttributes.width);
					}
					if (imageAttributes.height) {
						image.setAttribute('height', imageAttributes.height);
					}
					newBlock.appendChild(image);
					block.parentNode.insertBefore(newBlock, block);
				});
			} else {
				console.error('No Edit.imagePromiseCallback.');
			}
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
			this.content.onfocus = function() {
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
			this.content.onblur = function() {
				for (var i = 0; i < this.childNodes.length; i++) {
					var node = this.childNodes[i];
					if (node.nodeType == Node.TEXT_NODE) {
						if (node.nodeValue.trim()) {
							this.replaceChild(createElement('p', node.nodeValue), node);
						} else {
							node.remove();
							i--;
						}
					}
				}
				delete this._placeholder;
				this.classList.remove(CLASS_PLACEHOLDER);
				if (this.textContent == '') {
					this.innerHTML = '<p>Edit this text</p>';
					this._placeholder = this.firstChild;
					this.classList.add(CLASS_PLACEHOLDER);
				} else if (this.textContent == 'Edit this text') {
					this._placeholder = this.firstChild;
					this.classList.add(CLASS_PLACEHOLDER);
				}

				setTimeout(function() {
					var element = document.activeElement;
					while (element) {
						if (element.nodeType == Node.ELEMENT_NODE) {
							if (element.classList.contains(CLASS_EDIT_BLOCK)) {
								Edit.setCurrentBlock(element);
								return;
							}
							if (element.id == 'edit_toolbar') {
								return;
							}
						}
						element = element.parentNode;
					}
					Edit.setCurrentBlock(null);
				}, 0);
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
			var draggedThing = null;
			this.content.ondragstart = function(event) {
				// console.log(event);
				if (event.target.localName == 'img') {
					event.dataTransfer.effectAllowed = 'move';
					event.dataTransfer.clearData();
					event.dataTransfer.setData('text/html', event.target.parentNode.outerHTML);
					draggedThing = event.target.parentNode;
				}
				// console.log(event);
			};
			this.content.ondragenter = function(event) {
				event.preventDefault();
			};
			this.content.ondrop = function(event) {
				event.preventDefault();

				var target = event.target;
				// console.log(target);
				if (this.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_CONTAINED_BY) {
					while (target.parentNode != this) {
						target = target.parentNode;
						// console.log(target);
					}
					this.insertBefore(draggedThing, target);
					return;
				}

				var bottom = this.getBoundingClientRect().bottom;
				for (var i = event.clientY; i < bottom; i += 5) {
					target = document.elementFromPoint(event.clientX, i);
					// console.log(i, target);
					if (target != this) {
						while (target.parentNode != this) {
							target = target.parentNode;
						}
						this.insertBefore(draggedThing, target);
						return;
					}
				}
				this.appendChild(draggedThing);
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
			var images = this.content.querySelectorAll('div > img');
			for (var i = 0; i < images.length; i++) {
				var div = images[i].parentNode;
				div.setAttribute('draggable', 'true');
				div.contentEditable = false;
			}
		},
		output: function() {
			return serialize(this.content, false);
		}
	};

	var Edit = {
		scriptPath: scriptPath,
		currentBlock: null,
		savedRange: null,

		Actions: Actions,
		ToolbarUI: ToolbarUI,
		NodeTypeUI: NodeTypeUI,
		EditArea: EditArea,

		setCurrentBlock: function(div) {
			if (div == this.currentBlock) {
				return;
			}
			if (this.currentBlock) {
				this.currentBlock.classList.remove(CLASS_CURRENT);
			}
			this.currentBlock = div;
			this.range = null;
			if (this.currentBlock) {
				this.currentBlock.classList.add(CLASS_CURRENT);
				ToolbarUI.show();
			} else {
				ToolbarUI.hide();
				ToolbarUI.setInactive();
			}
		},
		updateUI: function() {
			var range = Edit.getRange();
			var node = range.startContainer;
			var collapsed = range.collapsed;

			if (node.nodeType == Node.ELEMENT_NODE) {
				node = node.childNodes[range.startOffset];
			} else if (node.nodeType == Node.TEXT_NODE && range.startOffset == node.length && node.nextSibling) {
				node = node.nextSibling;
			} else if (node.childNodes.length == 1) {
				node = node.firstChild;
			}

			if (!node) {
				return;
			}

			var chain = [];
			var blockNode = null;
			var bold = false;
			var italic = false;
			var underline = false;
			var link = false;
			var uList = false;
			var oList = false;
			var image = node.nodeType == Node.ELEMENT_NODE && node.localName == 'img';

			do {
				var name;
				if (node.nodeType == Node.ELEMENT_NODE) {
					name = node.localName;
					if (node.id) {
						name += '#' + node.id;
					}
					if (node.classList) {
						for (var i = 0; i < node.classList.length; i++) {
							name += '.' + node.classList[i];
						}
					}
					if (node.localName == 'b' || node.localName == 'strong' || node.style.fontWeight == 'bold') {
						bold = true;
					}
					if (node.localName == 'i' || node.localName == 'em' || node.style.fontStyle == 'italic') {
						italic = true;
					}
					if (node.localName == 'u' || node.style.textDecoration == 'underline') {
						underline = true;
					}
					if (node.localName == 'a') {
						link = true;
					}
					if (node.localName == 'ul' && !oList) {
						uList = true;
					}
					if (node.localName == 'ol' && !uList) {
						oList = true;
					}
				} else if (node.nodeType == Node.TEXT_NODE) {
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
			ToolbarUI.setButtonState('indent', false, !uList && !oList);
			ToolbarUI.setButtonState('outdent', false, !uList && !oList);
			ToolbarUI.setButtonState('image', false, image);

			NodeTypeUI.setNodeType(blockNode.localName);
		},
		getBlockNodeForSelection: function() {
			var node;
			var range = this.getRange();
			if (!range) {
				return null;
			}

			node = range.startContainer;
			if (node.nodeType == Node.ELEMENT_NODE) {
				node = node.childNodes[range.startOffset];
			}

			var blockNode = null;
			while (node) {
				if (node.nodeType == Node.ELEMENT_NODE && node.classList.contains(CLASS_EDIT_BLOCK)) {
					break;
				}
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
			return null;
		},
		saveSelection: function() {
			Edit.savedRange = Edit.getRange();
		},
		restoreSelection: function() {
			if (!Edit.savedRange) {
				return;
			}

			var selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(Edit.savedRange);
			Edit.currentBlock.focus();
			setTimeout(Edit.updateUI, 0);
		}
	};

	ToolbarUI.init();

	window.Edit = Edit;
})();
