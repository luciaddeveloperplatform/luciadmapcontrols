import {TileSetAttributionProvider} from "@luciad/ria/view/tileset/TileSetAttributionProvider";

/**
 * Create an attribution component
 * to visualize attribution information for all tilesets that are visible in the given map.
 *
 * @param map  The map to create the attribution component for.
 * @param options An options literal. The following options are supported:
 *        <ul>
 *          <li><b>options.domId</b> The dom ID of the DIV that is the attribution component.
 *             When omitted, this div will be created for you inside the map's DOM node.
 *             When specified and an element with that ID exists, that element will be used.
 *             When specified and no element with that ID exists, that ID will be assigned to the
 *              DOM node that was created for you inside the map's DOM node.</li>
 *        </ul>
 * @constructor
 */
function AttributionComponent(map, options) {
  this._attributionProvider = new TileSetAttributionProvider(map);
  options = options || {};
  var domElement = document.getElementById(options.domId);
  if (!domElement) {
    domElement = document.createElement('div');
    if (options.domId) {
      domElement.id = options.domId;
    }
    map.domNode.appendChild(domElement);
  }
  this._domNode = domElement;
  this._domNode.className = "attribution";
  var self = this;
  this._handles = [
    self._attributionProvider.on("AttributionLogosChanged", function() {
      self._update();
    }),
    self._attributionProvider.on("AttributionStringsChanged", function() {
      self._update();
    })
  ];
  this._update();
}

AttributionComponent.prototype._update = function() {
  var i, l;
  this._domNode.innerHTML = "";
  var strings = this._attributionProvider.getAttributionStrings();
  for (i = 0, l = strings.length; i < l; i++) {
    var elem = document.createElement("p");
    elem.innerHTML = strings[i];
    elem.className = "attribution-string";
    this._domNode.appendChild(elem);
  }
  var logos = this._attributionProvider.getAttributionLogos();
  for (i = 0, l = logos.length; i < l; i++) {
    var elem = document.createElement("img");
    elem.src = logos[i];
    elem.className = "attribution-logo";
    this._domNode.appendChild(elem);
  }
};

AttributionComponent.prototype.destroy = function() {
  for (var i = 0; i < this._handles.length; i++) {
    this._handles[i].remove();
  }
  this._handles = [];
  this._domNode.parentNode.removeChild(this._domNode);
};

export {AttributionComponent};
