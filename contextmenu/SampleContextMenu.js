import {ContextMenu} from "./ContextMenu";
import {ContextMenuManager} from "./ContextMenuManager";

function SampleContextMenu(map) {
  this._contextMenuManager = new ContextMenuManager();
  map.onShowContextMenu = SampleContextMenu.prototype.onShowContextMenu.bind(this);
  this._map = map;
}

SampleContextMenu.prototype.onShowContextMenu = function(position, contextMenu) {
  var sampleContextMenu = this._createContextMenu(contextMenu);
  this._contextMenuManager.showOnly(sampleContextMenu, position[0], position[1], "topLeft");

};

SampleContextMenu.prototype._createContextMenu = function(contextMenu) {
  var sampleContextMenu = new ContextMenu();
  var items = contextMenu.items;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.separator) {
      sampleContextMenu.addItem(this._createSeparator());
    } else {
      if (item.checked !== undefined) {
        sampleContextMenu.addItem(this._createCheckItem(item));
      } else {
        sampleContextMenu.addItem(this._createItem(item));
      }
    }
  }
  this._contextMenuManager.registerContextMenu(sampleContextMenu);
  return sampleContextMenu;
};

SampleContextMenu.prototype._createSeparator = function() {
  var separator = document.createElement("div");
  separator.classList.add("separator");
  return separator;
};

SampleContextMenu.prototype._createItem = function(options) {
  var domNode = document.createElement("div");
  var title = document.createElement("span");
  title.innerHTML = options.label;
  domNode.appendChild(title);
  if (options.iconClass) {
    var icon = document.createElement("span");
    icon.classList.add(options.iconClass);
    domNode.appendChild(icon);
  }

  var self = this;
  domNode.addEventListener("click", function(event) {
    options.action();
    self._contextMenuManager.hideAll();
    event.stopPropagation();
  }, false);

  return domNode;
};

SampleContextMenu.prototype._createCheckItem = function(options) {
  var domNode = document.createElement("div");
  var input = document.createElement("input");
  input.type = "checkbox";
  input.checked = !!options.checked;
  input.classList.add("checkbox");
  var self = this;
  input.addEventListener("click", function(event) {
    options.action();
    self._contextMenuManager.hideAll();
    event.stopPropagation();
  }, false);

  var title = document.createElement("span");
  title.innerHTML = options.label;
  title.appendChild(input);
  domNode.appendChild(title);
  return domNode;
}

export {SampleContextMenu};