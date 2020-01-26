import {createPoint} from "@luciad/ria/shape/ShapeFactory";
import {NavigationEventUtil} from "./NavigationEventUtil";

/**
 * Creates a pan control for the given map.
 *
 * The default styling can be found in PanControl.css.
 *
 * @param map  The map to create the pan control for.
 * @param options An options literal. The following options are supported:
 *        <ul>
 *          <li><b>options.domId</b> The dom ID of the DIV that is the pan control.
 *             When omitted, this div will be created for you inside the map's DOM node.
 *             When specified and an element with that ID exists, that element will be used.
 *             When specified and no element with that ID exists, that ID will be assigned to the
 *             DOM node that was created for you inside the map's DOM node.</li>
 *        </ul>
 * @constructor
 */
function PanControl(map, options) {
  this._map = map;
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
  this._initNode();
};

PanControl.prototype = Object.create(Object.prototype);
PanControl.prototype.constructor = PanControl;

PanControl.prototype._initNode = function() {

  this._domNode.classList.add("panDisplay");

  var panOptions = [{
    class: "panUp",
    action: this.panUp.bind(this)
  }, {
    class: "panLeft",
    action: this.panLeft.bind(this)
  }, {
    class: "panRight",
    action: this.panRight.bind(this)
  }, {
    class: "panDown",
    action: this.panDown.bind(this)
  }];

  var self = this;

  panOptions.forEach(function(panOption) {
    var panDiv = document.createElement('div');
    panDiv.classList.add("Pan", panOption.class);
    NavigationEventUtil.onContinuousMouseDown(panDiv, panOption.action);
    self._domNode.appendChild(panDiv);
  });
};

PanControl.prototype.destroy = function() {
  this._domNode.parentNode.removeChild(this._domNode);
};

PanControl.prototype.panUp = function() {
  this._centerAtRatio(1 / 2, 1 / 4);
};

PanControl.prototype.panDown = function() {
  this._centerAtRatio(1 / 2, 3 / 4);
};

PanControl.prototype.panLeft = function() {
  this._centerAtRatio(1 / 4, 1 / 2);
};

PanControl.prototype.panRight = function() {
  this._centerAtRatio(3 / 4, 1 / 2);
};

PanControl.prototype._centerAtRatio = function(xRatio, yRatio) {
  //#snippet navigate
  this._map.mapNavigator.pan({
    targetLocation: createPoint(null, [
      this._map.viewSize[0] * xRatio,
      this._map.viewSize[1] * yRatio
    ]),
    animate: {
      duration: 250
    }
  });
  //#endsnippet navigate
};

export {PanControl};

