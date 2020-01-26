import {NavigationEventUtil} from "./NavigationEventUtil";

/**
 * Creates a zoom control for the given map.
 * It consists of a single div that contains 2 buttons :
 * a plus to zoom in and a minus to zoom out.
 *
 * The default styling can be found in ZoomControl.css.
 *
 * @param map  The map to create the zoom control for.
 * @param options An options literal. The following options are supported:
 *        <ul>
 *          <li><b>options.domId</b> The dom ID of the DIV that is the zoom control.
 *             When omitted, this div will be created for you inside the map's DOM node.
 *             When specified and an element with that ID exists, that element will be used.
 *             When specified and no element with that ID exists, that ID will be assigned to the
 *              DOM node that was created for you inside the map's DOM node.</li>
 *          <li><b>options.touch</b> If the zoom control should be used with a touch screen.</li>
 *        </ul>
 * @constructor
 */
function ZoomControl(map, options) {
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
  this._initNode(!!options.touch);
}

ZoomControl.prototype = Object.create(Object.prototype);
ZoomControl.prototype.constructor = ZoomControl;

ZoomControl.prototype.destroy = function() {
  this._domNode.parentNode.removeChild(this._domNode);
};

ZoomControl.prototype._initNode = function(touch) {
  this._domNode.classList.add(touch ? "TouchZoomControl" : "MouseZoomControl");

  var zoomIn = document.createElement('div');
  zoomIn.classList.add("Zoom", "ZoomIn");
  this._domNode.appendChild(zoomIn);

  NavigationEventUtil.onContinuousMouseDown(zoomIn, this.zoomIn.bind(this));

  var zoomOut = document.createElement('div');
  zoomOut.classList.add("Zoom", "ZoomOut");
  this._domNode.appendChild(zoomOut);
  NavigationEventUtil.onContinuousMouseDown(zoomOut, this.zoomOut.bind(this));
};

ZoomControl.prototype.zoomIn = function(scaleFactor) {
  if (scaleFactor) {
    this._map.mapNavigator.zoom({
      targetScale: this._map.mapScale[0] * scaleFactor,
      animate: {
        duration: 250
      }
    });
  } else {
    this._map.mapNavigator.zoom({
      factor: 2,
      animate: {
        duration: 250
      }
    });
  }
};

ZoomControl.prototype.zoomOut = function(scaleFactor) {
  if (scaleFactor) {
    this._map.mapNavigator.zoom({
      targetScale: this._map.mapScale[0] / scaleFactor,
      animate: {
        duration: 250
      }
    });
  } else {
    //#snippet zoomout
    //#description use the mapNavigator to zoom
    this._map.mapNavigator.zoom({
      factor: 0.5,
      animate: {
        duration: 250
      }
    });
    //#endsnippet zoomout
  }
};

export {ZoomControl};