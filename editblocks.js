function DraggableImageBlock(aElement) {
	this.init(aElement, false);
	aElement.onclick = function() {
		var range = document.createRange();
		range.selectNode(aElement.querySelector('img'));
		var selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		Edit.updateUI();
		Edit.setCurrentBlock(aElement.parentNode);
	};
}
DraggableImageBlock.prototype = new DraggableObject;
DraggableImageBlock.prototype.customMouseMove = function(aEvent) {
	if (!this.holder) {
		this.holder = createElement('div.draggingholder');
		var image = this.domNode.firstElementChild;
		this.holder.style.width = image.offsetWidth + 'px';
		this.holder.style.height = image.offsetHeight + 'px';
		if (image.classList.contains('alignleft')) {
			this.holder.classList.add('alignleft');
		} else if (image.classList.contains('aligncenter')) {
			this.holder.classList.add('aligncenter');
		} else if (image.classList.contains('alignright')) {
			this.holder.classList.add('alignright');
		}
		this.parent = this.domNode.parentNode;
		this.parent.insertBefore(this.holder, this.domNode);
		this.domNode.style.width = this.domNode.offsetWidth + 'px';
		this.domNode.classList.add('dragging');
		document.body.appendChild(this.domNode);
	}

	this.domNode.style.left = aEvent.pageX - this.dragStartX + 'px';
	this.domNode.style.top = aEvent.pageY - this.dragStartY + 'px';

	var domNodeBCR = DraggableObject.fixBCR(this.domNode);
	var holderBCR = DraggableObject.fixBCR(this.holder);

	var things = this.parent.children;
	var seenHolder = false;
	for (var i = 0; i < things.length; i++) {
		var thing = things[i];
		if (thing == this.holder) {
			seenHolder = true;
			continue;
		}
		var thingBCR = DraggableObject.fixBCR(thing);
		if (seenHolder) {
			if (holderBCR.bottom > thingBCR.bottom) {
				continue;
			} else if (domNodeBCR.bottom > thingBCR.bottom) {
				thing.parentNode.insertBefore(this.holder, thing.nextSibling);
			} else {
				return;
			}
		} else {
			if (domNodeBCR.top < thingBCR.top) {
				thing.parentNode.insertBefore(this.holder, thing);
				return;
			}
		}
	}
};
DraggableImageBlock.prototype.customMouseUp = function(aEvent) {
	if (this.holder) {
		this.parent.replaceChild(this.domNode, this.holder);
		this.domNode.classList.remove('dragging');
		this.domNode.style.left = this.domNode.style.top = this.domNode.style.width = '';
		delete this.holder;
		this.parent = null;
	}
};

Edit.EditArea.prototype.oldInit = Edit.EditArea.prototype.init;
Edit.EditArea.prototype.init = function() {
	this.oldInit();

	function strip(aElement) {
		for (var i = 0; i < aElement.childNodes.length;) {
			var child = aElement.childNodes[i];
			if (child.nodeType == 3 && !child.nodeValue.trim()) {
				aElement.removeChild(child);
			} else if (child.nodeType == 1) {
				strip(child);
				i++;
			} else {
				i++;
			}
		}
	}

	strip(this.content);
	var imageBlocks = this.content.querySelectorAll('.imageblock');
	for (var i = 0; i < imageBlocks.length; i++) {
		new DraggableImageBlock(imageBlocks[i]);
	}
};
// Note that there is no overridden destroy function here, because I have no
// need for it at this stage, and writing it opens a whole other can of worms.
Edit.EditArea.prototype.imageBlock = function(aURL, aAttributes, aPrevious) {
	if (aAttributes)
		aAttributes['src'] = aURL;
	else
		aAttributes = { 'src': aURL };

	var i = createElement('div.imageblock');
	i.append('img', null, aAttributes);
	new DraggableImageBlock(i);
	if (aPrevious) {
		this.content.insertBefore(i, aPrevious.nextElementSibling);
	} else {
		this.content.appendChild(i);
	}
};
