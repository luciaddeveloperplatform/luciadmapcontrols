import {EventedSupport} from "@luciad/ria/util/EventedSupport";

function ContextMenu() {
  EventedSupport.call(this);
  this._contextMenuNode = document.createElement("div");
  this._contextMenuNode.classList.add("contextMenu");
  this.hide();
  this.domNode = this._contextMenuNode;
}

ContextMenu.prototype = Object.create(EventedSupport.prototype);
ContextMenu.prototype.constructor = ContextMenu;

/**
 * Adds an item to the context menu
 * @param domNode a DOM node (not attached to DOM yet). This node will be inserted at the end of the contextMenu.
 *        A ".contextMenuItem" CSS class will be added to the DOM node.
 */
ContextMenu.prototype.addItem = function(domNode) {
  domNode.classList.add("contextMenuItem");
  this._contextMenuNode.appendChild(domNode);
};

/**
 * Shows the context menu at the given coordinates (client coordinates).
 * The `anchor` corner of the context menu will be at the passed coordinates, unless the context menu will
 * not fit on the screen at that location. In that case, the context menu will be shifted so it does fit on the screen.
 * @param x the x coordinate of the location where to show the context menu. 0 is left.
 * @param y the y coordinate of the location where to show the context menu. 0 is top.
 * @param {String} anchor specifies at what position the contextmenu will be anchored to the passed coordinate.
 *        Must be one of "topLeft", "topRight", "bottomLeft" or "bottomRight".
 */
ContextMenu.prototype.show = function(x, y, anchor) {
  var wasOpen = this._open;
  this._open = true;
  anchor = anchor || "topLeft";
  document.body.appendChild(this._contextMenuNode);
  this._contextMenuNode.classList.remove("contextMenuClosed");
  this._contextMenuNode.classList.add("contextMenuOpen");
  var clientRect = this._contextMenuNode.getBoundingClientRect();
  var topLeftLocation = this._getLocationOfContextMenu(x, y, clientRect.width, clientRect.height, anchor);
  this._contextMenuNode.style.left = topLeftLocation.x + "px";
  this._contextMenuNode.style.top = topLeftLocation.y + "px";
  if (!wasOpen) {
    this.emit("ContextMenuOpened");
  }
};

ContextMenu.prototype._getLocationOfContextMenu = function(x, y, width, height, anchor) {
  var topLeftLocation = {
    x: anchor.toLowerCase().indexOf("left") >= 0 ? x : x - width,
    y: anchor.toLowerCase().indexOf("top") >= 0 ? y : y - height
  };
  //make sure it's always visible
  topLeftLocation.x = Math.max(Math.min(topLeftLocation.x, window.innerWidth - width), 0);
  topLeftLocation.y = Math.max(Math.min(topLeftLocation.y, window.innerHeight - height), 0);
  return topLeftLocation;
};

ContextMenu.prototype.clear = function() {
  this._contextMenuNode.innerHTML = '';
};

/**
 * Hides the context menu. Will only have effect if the context menu is open.
 */
ContextMenu.prototype.hide = function() {
  var wasOpen = this._open;
  this._open = false;
  this._contextMenuNode.classList.remove("contextMenuOpen");
  this._contextMenuNode.classList.add("contextMenuClosed");
  if (wasOpen) {
    document.body.removeChild(this._contextMenuNode);
    this.emit("ContextMenuClosed");
  }
};

ContextMenu.prototype.isOpen = function() {
  return this._open;
};

export {ContextMenu};