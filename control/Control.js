/**
 * Control constructor.
 * "Control" is the generic name for the panels (eg. the layer tree control) in the LuciadRIA sample code at the top right of the screen.
 * "Panel" might be a better name, but we've chosen for "Control" instead, due to possible naming conflicts with Bootstrap's "panel".
 * Controls are collapsible and can be stacked by including them in a "ControlGroup".
 *
 * @param map the map instance
 * @param options
 * @param [options.domId] reference to DOM id that will host the LayerTree UI
 * @param [options.noLayerDelete] if true, none of layers can be deleted (delete element will not be present).
 *                                by default layers can be deleted
 * @constructor
 */
function Control(map, options) {
  this.init(map, options);
}

Control.prototype = Object.create(Object.prototype);
Control.prototype.constructor = Control;

Control.prototype.init = function(map, options) {
  if (this._rootNode) {
    this.destroy();
  }
  this._map = map;
  options = options || {};
  if (options.parentId) {
    this._parentNode = document.getElementById(options.parentId);
  }
  if (options.domId) {
    this._rootNode = document.getElementById(options.domId);
    if (!this._parentNode) {
      this._parentNode = this._rootNode.parentNode;
    } else {
      this._parentNode.appendChild(this._rootNode);
    }
  } else {
    this._rootNode = document.createElement('div');
    if (!this._parentNode) {
      this._parentNode = map.domNode.querySelector('#onmap');
    }
    this._parentNode.appendChild(this._rootNode);
  }

  this._createDOMStructure({
    title: options.title,
    icon: options.icon
  });
  this._renderBody();
  this._wireEventListeners();
  // By default, all panels will be closed / collapsed when width < 600px.
  // For larger widths, they will be open by default.
  var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
  this.toggle(options.open || width > 599);
};

Control.prototype._createDOMStructure = function(options) {
  var self = this;
  this._rootNode.classList.add("control");

  this._buttonMobile = document.createElement("div");
  this._buttonMobile.classList.add("controlToggle");
  this._parentNode.appendChild(this._buttonMobile);

  this._collapseActionNodeMobile = document.createElement("div");
  this._collapseActionNodeMobile.classList.add("controlToggleButton");
  this._collapseActionNodeMobile.classList.add("controlCollapseAction");
  this._collapseActionNodeMobile.appendChild(this._createIconElement({
    className: options.icon
  }));
  this._buttonMobile.appendChild(this._collapseActionNodeMobile);

  this._headerNode = document.createElement("div");
  this._headerNode.classList.add("controlHeader");
  this._rootNode.appendChild(this._headerNode);

  this._titleIconNode = document.createElement("div");
  this._titleIconNode.classList.add("controlHeaderIcon");
  this._titleIconNode.appendChild(this._createIconElement({
    className: options.icon
  }));
  this._headerNode.appendChild(this._titleIconNode);

  this._titleNode = document.createElement("div");
  this._titleNode.classList.add("controlHeaderTitle");
  this._titleNode.innerHTML = options.title;
  this._headerNode.appendChild(this._titleNode);

  this._collapseActionNode = document.createElement("div");
  this._collapseActionNode.classList.add("controlButton");
  this._collapseActionNode.classList.add("controlCollapseAction");
  this._collapseActionNode.appendChild(this._createIconElement({
    className: "lcdIconCaretDown"
  }));
  this._headerNode.appendChild(this._collapseActionNode);

  this._bodyNode = document.createElement("div");
  this._bodyNode.classList.add("controlBody");
  this._rootNode.appendChild(this._bodyNode);

  this._panelNode = document.createElement("div");
  this._panelNode.classList.add("controlPanel");
  this._bodyNode.appendChild(this._panelNode);
};

Control.prototype._renderBody = function() {};

Control.prototype._createIconElement = function(options) {
  options = options || {};
  var icon = document.createElement("span");
  icon.classList.add("lcdIcon");
  if (options.className) {
    icon.classList.add(options.className);
  }
  if (options.title) {
    icon.title = options.title;
  }
  return icon;
};

Control.prototype._wireEventListeners = function() {
  this._collapseAction = function() {
    this.toggle();
    event.stopPropagation();
    event.preventDefault();
  }.bind(this);
  this._collapseActionNodeMobile.addEventListener("click", this._collapseAction, false);
  // this._collapseActionNode.addEventListener("click", this._collapseAction, false);
  this._headerNode.addEventListener("click", this._collapseAction, false);
};

Control.prototype._removeEventListeners = function() {
  this._collapseActionNodeMobile.removeEventListener("click", this._collapseAction, false);
  // this._collapseActionNode.removeEventListener("click", this._collapseAction, false);
  this._headerNode.removeEventListener("click", this._collapseAction, false);
};

Control.prototype.toggle = function(state) {
  this._open = (typeof state !== "undefined") ? state : !this._open;
  this._updateCollapseState();
};

Control.prototype.close = function() {
  this._open = false;
  this._updateCollapseState();
};

Control.prototype.open = function() {
  this._open = true;
  this._updateCollapseState();
};

Control.prototype._updateCollapseState = function() {
  var self = this;
  self._collapseActionNode.classList.toggle("controlCollapseActionOpen", self._open);
  self._collapseActionNode.classList.toggle("controlCollapseActionClosed", !self._open);
  self._rootNode.classList.toggle("controlClosed", !self._open);
  self._bodyNode.classList.toggle("controlBodyClosed", !self._open);
  if (this._timeoutHandle) { //cancel the timeout if we already had one
    clearTimeout(this._timeoutHandle);
  }
};

Control.prototype.destroy = function() {
  this._removeEventListeners();

  this._map = undefined;
  this._open = undefined;

  this._bodyNode = undefined;
  this._collapseActionNode = undefined;
  this._collapseActionNodeMobile = undefined;
  this._headerNode = undefined;
  this._panelNode = undefined;
  this._parentNode = undefined;
  this._titleIconNode = undefined;
  this._titleNode = undefined;

  this._rootNode.parentNode.removeChild(this._rootNode);
  this._buttonMobile.parentNode.removeChild(this._buttonMobile);
  this._rootNode = undefined;
  this._buttonMobile = undefined;
};

export {Control};