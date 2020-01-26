import {OutOfBoundsError} from "@luciad/ria/error/OutOfBoundsError";
import {LonLatPointFormat} from "@luciad/ria/shape/format/LonLatPointFormat";
import {createPoint} from "@luciad/ria/shape/ShapeFactory";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {createTransformation} from "@luciad/ria/transformation/TransformationFactory";

/**
 * Creates a mouse location readout for the given map.
 * It consists of a single div, with class .mouseLocationComponent.
 * The default styling can be found in MouseLocationComponent.css.
 * @param map The map to create the mouse location readout for.
 * @param options An options literal. The following options are supported:
 *        <ul>
 *          <li><b>options.domId</b> The dom ID of the DIV that is the mouse location readout.
 *             When omitted, this div will be created for you inside the map's DOM node.
 *             When specified and an element with that ID exists, that element will be used.
 *             When specified and no element with that ID exists, that ID will be assigned to the
 *              DOM node that was created for you inside the map's DOM node.</li>
 *           <li><b>options.outReference</b> Points under the mouse cursor will be transformed
 *             to this reference. Points passed to the formatter will be in this reference.
 *             Defaults to EPSG:4326.</li>
 *           <li><b>options.formatter</b> The {@link luciad.view.format format} used to covert
 *             points to a string. Defaults to {@link luciad.view.format.LonLatPointFormat}.</li>
 *           <li><b>options.heightProvider</b> Height provider to retrieve the height of the terrain.
 *             This service is used asynchronously and therefore the height value might be displayed with a delay.
 *             The height value is displayed in 2D and 3D.  Its accuracy depends on the service.
 *             If not set, the height data of the model is used.  This is faster but only available in 3D and might be less accurate.
 *             An example height provider can be found in samples/terrainservices/HeightProvider.</li>
 *        </ul>
 * @constructor
 */
function MouseLocationComponent(map, options) {
  this._map = map;
  options = options || {};
  this._domNode = document.getElementById(options.domId);
  if (!this._domNode) {
    this._domNode = document.createElement('div');
    if (options.domId) {
      this._domNode.id = options.domId;
    }
    map.domNode.appendChild(this._domNode);
  }
  this._domNode.className = "mouseLocation";
  this._coordinatesNode = document.createElement("span");
  this._coordinatesNode.className = "coordinates";
  this._domNode.appendChild(this._coordinatesNode);
  this._heightNode = document.createElement("span");
  this._heightNode.className = "height";
  this._domNode.appendChild(this._heightNode);
  this._outRef = options.outReference || getReference("EPSG:4326");
  this._formatter = options.formatter || new LonLatPointFormat({
    pattern: "lat(+DMS), lon(+DMS)"
  });
  try {
    this._transformation = createTransformation(this._map.reference, this._outRef);
  } catch (e) {
    //Fallback for failed transformation
    this._transformation = createTransformation(this._map.reference, this._map.reference);
    this._formatter = {
      //Fallback formatter that outputs points.
      format: function(point) {
        return "( x:" + Number(point.x).toFixed(2) + ", y:" + Number(point.y).toFixed(2) + ")";
      }
    };
    this._outRef = this._map._reference;
  }
  this._tempViewPoint = createPoint(null, [0, 0]);
  this._tempMapPoint = createPoint(this._map.reference, [0, 0]);
  this._tempModelPoint = createPoint(this._outRef, [0, 0]);
  this._heightProvider = options.heightProvider;
  this.displayHeight = (typeof options.displayHeight !== "undefined") ? options.displayHeight : (this._map.reference.identifier === "EPSG:4978") ? true : !!this._heightProvider;
  this._heightProviderRequestResolved = true;
  this._mapNodePosition = this._map.domNode.getBoundingClientRect();
  this._mouseMovedListener = this._mouseMoved.bind(this);
  this._map.domNode.addEventListener("mousemove", this._mouseMovedListener, false);
  this._map.domNode.addEventListener("mousedrag", this._mouseMovedListener, false);
}

MouseLocationComponent.prototype = Object.create(Object.prototype);
MouseLocationComponent.prototype.constructor = MouseLocationComponent;

MouseLocationComponent.prototype._mouseMoved = function(event) {
  try {
    //#snippet transformations
    //transform points from view coordinates (in pixels) to map coordinates (in meters)
    this._tempViewPoint.move2D(
      event.clientX - this._mapNodePosition.left,
      event.clientY - this._mapNodePosition.top
    );
    this._map.viewToMapTransformation.transform(this._tempViewPoint, this._tempMapPoint);
    //transform the point in map coordinates to the output reference (latitude/longitude)
    this._transformation.transform(this._tempMapPoint, this._tempModelPoint);
    //#endsnippet transformations
    if (this._heightProvider) {
      this._setValueWithHeightProvider(this._tempModelPoint);
    } else {
      this.setValue(this._tempModelPoint);
    }
  } catch (e) {
    if (!(e instanceof OutOfBoundsError)) {
      throw e;
    } else {
      this.setValue();
    }
  }
};

MouseLocationComponent.prototype._setValueWithHeightProvider = function(point) {
  var self = this;
  var modelPoint = createPoint(this._outRef, [point.x, point.y, point.z]);
  if (this._heightProviderRequestResolved) {
    this._heightProviderRequestResolved = false;
    this._heightProvider.getHeight(modelPoint).then(function(height) {
      self._heightProviderRequestResolved = true;
      if (!modelPoint.equals(self._tempModelPoint)) {
        self._setValueWithHeightProvider(self._tempModelPoint);
      } else {
        if (!isNaN(height)) {
          modelPoint.z = height;
        }
        self.setValue(modelPoint);
      }
    }).catch(function() {
      modelPoint.z = parseFloat(self._heightNode.innerHTML);
      self.setValue(modelPoint);
    });
  } else {
    modelPoint.z = parseFloat(self._heightNode.innerHTML);
    self.setValue(modelPoint);
  }
};

MouseLocationComponent.prototype.setValue = function(val) {
  if (typeof val === 'object') {
    if (this.displayHeight && typeof val.z === 'number') {
      this._heightNode.innerHTML = Math.round(val.z) + " m";
    } else {
      this._heightNode.innerHTML = "";
    }
    this._coordinatesNode.innerHTML = this._formatter.format(val);
  } else {
    this._coordinatesNode.innerHTML = "";
    this._heightNode.innerHTML = "";
  }
};

MouseLocationComponent.prototype.destroy = function() {
  this._map.domNode.removeEventListener("mousemove", this._mouseMovedListener);
  this._map.domNode.removeEventListener("mousedrag", this._mouseMovedListener);
  this._domNode.removeChild(this._coordinatesNode);
  this._domNode.removeChild(this._heightNode);
  this._domNode.parentNode.removeChild(this._domNode);
};

Object.defineProperty(MouseLocationComponent.prototype, 'displayHeight', {
  get: function() {
    return this._displayHeight;
  },
  set: function(value) {
    this._displayHeight = !!value;
    this._heightNode.classList.toggle("hidden", !this._displayHeight);
  }
});

export {MouseLocationComponent};