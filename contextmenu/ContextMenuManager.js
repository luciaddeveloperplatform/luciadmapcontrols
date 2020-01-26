var UNDEFINED_HANDLE = "UNDEFINED_HANDLE";

function ContextMenuManager() {
  var self = this;
  this._contextMenuMap = {};
  document.body.addEventListener("click", function(event) {
    self.hideAll();
    event.stopPropagation();
  }, false);
}

ContextMenuManager.prototype = Object.create(Object.prototype);
ContextMenuManager.prototype.constructor = ContextMenuManager;

ContextMenuManager.prototype.registerContextMenu = function(contextMenu, handle) {
  handle = handle || UNDEFINED_HANDLE;
  if (!this._contextMenuMap[handle]) {
    this._contextMenuMap[handle] = [];
  }
  if (this._contextMenuMap[handle].indexOf(contextMenu) < 0) {
    this._contextMenuMap[handle].push(contextMenu);
  }
  contextMenu._handle = handle;
};

/**
 * Shows a context menu, while hiding all other menus with the same handle
 */
ContextMenuManager.prototype.showOnly = function(contextMenu, x, y, anchor) {
  var handle = contextMenu._handle;
  this.hideAll(handle);
  contextMenu.show(x, y, anchor);
};

ContextMenuManager.prototype.hideAll = function(handle) {
  handle = handle || UNDEFINED_HANDLE;
  if (this._contextMenuMap[handle]) {
    this._contextMenuMap[handle].forEach(function(contextMenu) {
      contextMenu.hide();
    });
  }
};

export {ContextMenuManager};