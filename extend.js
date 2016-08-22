/* exported _loadList, $, addHandlers, createElement */
var _loadList = [];

(function() {
	window.addEventListener('DOMContentLoaded', callLoadFunctions, false);
	document.addEventListener('readystatechange', callLoadFunctions, false);
	window.addEventListener('load', callLoadFunctions, false);

	function callLoadFunctions(event) {
		if (event.type == 'readystatechange' && document.readyState != 'complete') {
			return;
		}

		// if (console && 'info' in console)
		// 	console.info('Performing load functions on ' + event.type + ' event');

		window.removeEventListener('DOMContentLoaded', callLoadFunctions, false);
		document.removeEventListener('readystatechange', callLoadFunctions, false);
		window.removeEventListener('load', callLoadFunctions, false);

		for (var i = 0; i < _loadList.length; i++) {
			try {
				_loadList[i]();
			} catch (e) {
				if (console && 'error' in console) {
					console.error(e);
				}
			}
		}
	}
})();

function $(id) {
	return document.getElementById(id);
}

function addHandlers(handlers) {
	var idRegExp = /^#\w+$/;
	var classRegExp = /^\.\w+$/;

	for (var eventType in handlers) {
		for (var selector in handlers[eventType]) {
			var nodes;
			if (idRegExp.test(selector)) {
				var node = $(selector.substring(1));
				if (node) {
					nodes = [node];
				} else {
					continue;
				}
			} else if (classRegExp.test(selector)) {
				nodes = document.getElementsByClassName(selector.substring(1));
			} else {
				nodes = document.querySelectorAll(selector);
			}

			for (var i = 0, iCount = nodes.length; i < iCount; i++) {
				nodes[i]['on' + eventType] = handlers[eventType][selector];
			}
		}
	}
}

function createElement(selector, textContent, attributes) {
	var match = /^([\w-]+)(#[\w-]+)?((\.[\w-]+)*)$/.exec(selector);
	if (!match) {
		if (console && 'error' in console) {
			console.error('Invalid selector string in call to .createElement()');
		}
		return null;
	}

	var element = document.createElement(match[1]);
	if (match[2]) {
		element.id = match[2].substr(1);
	}

	var remainder = match[3];

	while (match = /^(\.[\w-]+\b)(.*)$/.exec(remainder)) {
		element.classList.add(match[1].substr(1));
		remainder = match[2];
	}

	if (typeof textContent == 'string' || typeof textContent == 'number') {
		element.appendChild(document.createTextNode(textContent));
	}

	for (var a in attributes) {
		element.setAttribute(a, attributes[a]);
	}

	return element;
}

Element.prototype.clearChildNodes = function() {
	while (this.lastChild) {
		this.removeChild(this.lastChild);
	}
};

Element.prototype.append = function(selector, textContent, attributes) {
	var node;
	if (selector) {
		node = createElement(selector, textContent, attributes);
	} else {
		node = document.createTextNode(textContent);
	}

	this.appendChild(node);
	return node;
};

Element.prototype.appendMany = function(args) {
	var nodes = [];
	for (var i = 0; i < args.length; i++) {
		nodes.push(this.append(args[i][0], args[i][1], args[i][2]));
	}
	return nodes;
};

Element.prototype.ancestor = function(selector) {
	// This differs from the regexp in createElement in that the node name is optional.
	var match = /^([\w-]+)?(#[\w-]+)?((\.[\w-]+)*)$/.exec(selector);
	if (!match) {
		if (console && 'error' in console) {
			console.error('Invalid selector string in call to .ancestor()');
		}
		return null;
	}

	var localName = match[1] ? match[1].toLowerCase() : null;
	var id = match[2] ? match[2].substr(1) : null;

	var remainder = match[3];
	var classList = [];

	while (match = /^(\.[\w-]+\b)(.*)$/.exec(remainder)) {
		classList.push(match[1].substr(1));
		remainder = match[2];
	}

	var element = this.parentNode;
	while (element && element.nodeType == 1) {
		if ((!localName || element.localName == localName) &&
				(!id || element.id == id)) {
			var matches = true;
			for (var i = 0; i < classList.length; i++) {
				if (!element.classList.contains(classList[i])) {
					matches = false;
					break;
				}
			}
			if (matches) {
				return element;
			}
		}
		element = element.parentNode;
	}

	return null;
};
