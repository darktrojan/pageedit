if (typeof Array.prototype.indexOf != 'function') {
  Array.prototype.indexOf = function(e) {
    for (var i = 0, iCount = this.length; i < iCount; i++)
      if (this[i] == e)
        return i;
    return -1;
  };
}

if (typeof Date.now != 'function') {
  Date.now = function() {
    return new Date().valueOf();
  };
}

if (typeof String.prototype.trim != 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s*/, '').replace(/\s*$/, '');
  };
}

if (!('classList' in Element.prototype)) {
  ClassList = function(aElement) {
    this.element = aElement;
  };
  ClassList.prototype = {
    add: function(aClassName) {
      var list = this._getList();
      if (list.indexOf(aClassName) < 0)
        list.push(aClassName);
      this.element.className = list.join(' ');
    },
    remove: function(aClassName) {
      var list = this._getList();
      var index = list.indexOf(aClassName);
      if (index >= 0)
        list.splice(index, 1);
      this.element.className = list.join(' ');
    },
    contains: function(aClassName) {
      var list = this._getList();
      return list.indexOf(aClassName) >= 0;
    },
    _getList: function() {
      var list = this.element.className.split(/\s+/);
      if (list.length && list[0] == '')
        list.shift();
      if (list.length && list[list.length - 1] == '')
        list.pop();
      return list;
    }
  };
  Object.defineProperty(Element.prototype, 'classList', {
    'get': function() {
      return new ClassList(this);
    },
    'enumerable': false,
    'configurable': true
  });
}

if (!('textContent' in Element.prototype)) {
  Object.defineProperty(Element.prototype, 'textContent', {
    'get': function() {
      return this.innerText;
    },
    'set': function(value) {
      this.innerText = value;
    },
    'enumerable': false,
    'configurable': true
  });
}

if (!('localName' in Element.prototype)) {
  Object.defineProperty(Element.prototype, 'localName', {
    'get': function() {
      return this.nodeName.toLowerCase();
    },
    'enumerable': false,
    'configurable': true
  });
}

if (!('addEventListener' in Element.prototype)) {
  Element.prototype.addEventListener = function(aEventName, aHandler, aUseCapture) {
    this.attachEvent('on' + aEventName, aHandler);
  };
}

if (!('getElementsByClassName' in document)) {
  document.getElementsByClassName = function(aClassName) {
    return this.querySelectorAll('.' + aClassName);
  };
}
