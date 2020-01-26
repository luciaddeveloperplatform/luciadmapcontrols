/**
 * ControlGroup constructor.
 * @param map the map instance
 * @param options
 * @param [options.domId] reference to DOM id that will host the LayerTree UI
 * @constructor
 */
function ControlGroup(map, options) {
  options = options || {};

  this._map = map;
  this._domNodeId = options.domId || 'controlGroupId';
  this._holderNode = document.createElement('div');
  this._holderNode.id = this._domNodeId;

  map.domNode.appendChild(this._holderNode);

  this._createDOMStructure();
}

ControlGroup.prototype = Object.create(Object.prototype);
ControlGroup.prototype.constructor = ControlGroup;

ControlGroup.prototype._createDOMStructure = function() {
  this._holderNode.classList.add("controlGroup");
};

ControlGroup.prototype.getDomId = function() {
  return this._domNodeId;
};

export {ControlGroup};