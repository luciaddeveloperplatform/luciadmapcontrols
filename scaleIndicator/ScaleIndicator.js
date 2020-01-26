import {DistanceUnit} from "../DistanceUnit";
import {ScaleUtil} from "../ScaleUtil";

var DEFAULT_NUMBER_FOREGROUND_TICKS = 2;

/**
 * Creates a scale indicator for the given map.
 * See ScaleIndicator.css for styling options.
 * The scale indicator is essentially a div with the following structure:
 *  -.scaleIndicator
 *    -.scaleIndicatorText //the node containing the scale text
 *    -.scaleIndicatorBackground //a single node containing the background color (default white)
 *      - .scaleIndicatorForeground //a number (options.foregroundTicks) of nodes containing the foreground color (default black)
 * @param map The map to create the scale indicator for.
 * @param options An options literal. The following options are supported:
 *        <ul>
 *          <li><b>options.domId</b> The dom ID of the DIV that is the scale indicator.
 *             When omitted, this div will be created for you inside the map's DOM node.
 *             When specified and an element with that ID exists, that element will be used.
 *             When specified and no element with that ID exists, that ID will be assigned to the
 *              DOM node that was created for you inside the map's DOM node.</li>
 *           <li><b>options.distanceUnit</b> The distance unit that is used by the scale indicator. Defaults to DistanceUnit.METRE.</li>
 *           <li><b>options.foregroundTicks</b> The number of foreground ticks (black bars) that is shown on the scale indicator. Defaults to 2.</li>
 *        </ul>
 *
 * @constructor
 */
function ScaleIndicator(map, options) {
  options = options || {};
  this._map = map;

  var domElement = document.getElementById(options.domId);
  if (!domElement) {
    domElement = document.createElement('div');
    if (options.domId) {
      domElement.id = options.domId;
    }
    map.domNode.appendChild(domElement);
  }
  domElement.classList.add("scaleIndicator");
  this._scaleIndicatorNode = domElement;

  this._distanceUnit = options.distanceUnit || DistanceUnit.METRE;

  this._textNode = document.createElement("div");
  this._textNode.classList.add("scaleIndicatorText");
  this._scaleIndicatorNode.appendChild(this._textNode);

  this._backgroundNode = document.createElement("div");
  this._backgroundNode.classList.add("scaleIndicatorBackground");
  this._scaleIndicatorNode.appendChild(this._backgroundNode);

  var numberOfForegroundTicks = options.foregroundTicks || DEFAULT_NUMBER_FOREGROUND_TICKS;
  this._foregroundNodes = [];
  for (var i = 0; i < numberOfForegroundTicks; i++) {
    var foregroundNode = document.createElement("div");
    foregroundNode.classList.add("scaleIndicatorForeground");
    var leftPercentage = i * (100 / numberOfForegroundTicks);
    foregroundNode.style.left = leftPercentage + (leftPercentage > 0 ? "%" : "");
    foregroundNode.style.width = (100 / (numberOfForegroundTicks * 2)) + "%";
    this._backgroundNode.appendChild(foregroundNode);
    this._foregroundNodes.push(foregroundNode);
  }

  this._onMapChangeHandle = this._map.on("MapChange", this._onScaleChange.bind(this));
}

ScaleIndicator.prototype = Object.create(Object.prototype);
ScaleIndicator.prototype.constructor = ScaleIndicator;

ScaleIndicator.prototype._onScaleChange = function() {
  var scalePixelsPerMeter = ScaleUtil.getScaleAtMapCenter(this._map);
  var maxWidthPixels = this._scaleIndicatorNode.getBoundingClientRect().width;
  var barWidthInMeter = maxWidthPixels / scalePixelsPerMeter;
  var barWidthInDistanceUnit = this._distanceUnit.convertFromStandard(barWidthInMeter);
  var localDistanceUnit = this._getBestDistanceUnit(this._distanceUnit, barWidthInDistanceUnit, barWidthInMeter);
  barWidthInDistanceUnit = localDistanceUnit.convertFromStandard(barWidthInMeter);
  //convert to round number
  barWidthInDistanceUnit = this._findLower_1_2_5(barWidthInDistanceUnit);
  var barWidthInPixels = scalePixelsPerMeter * localDistanceUnit.convertToStandard(barWidthInDistanceUnit);
  this._backgroundNode.style.width = barWidthInPixels + "px";
  this._backgroundNode.style.left = (maxWidthPixels - barWidthInPixels) / 2 + "px";
  this._textNode.innerHTML = barWidthInDistanceUnit + ' ' + localDistanceUnit.uomSymbol;
};

ScaleIndicator.prototype._getBestDistanceUnit = function(aCurrentDistanceUnit, aLengthInDistanceUnit,
  aLengthInMeter) {
  if (DistanceUnit.METRE === aCurrentDistanceUnit && aLengthInDistanceUnit > 1000) {
    return DistanceUnit.KM;
  }
  if (DistanceUnit.KM === aCurrentDistanceUnit && aLengthInDistanceUnit < 1) {
    return DistanceUnit.METRE;
  }
  if (DistanceUnit.FT === aCurrentDistanceUnit && DistanceUnit.MILE_US.convertFromStandard(aLengthInMeter) > 1) {
    return DistanceUnit.MILE_US;
  }
  if (DistanceUnit.MILE_US === aCurrentDistanceUnit && aLengthInDistanceUnit < 1) {
    return DistanceUnit.FT;
  }
  return aCurrentDistanceUnit;
};

ScaleIndicator.prototype._findLower_1_2_5 = function(value) {
  //10^exponent = aInput  =>  exponent = log(aInput) / log(10)
  var lowestValue = Math.pow(10, Math.floor(Math.log(value) / Math.log(10)));
  if (value > 5 * lowestValue) {
    return 5 * lowestValue;
  }
  if (value > 2 * lowestValue) {
    return 2 * lowestValue;
  }
  return lowestValue;
};

ScaleIndicator.prototype.destroy = function() {
  this._onMapChangeHandle.remove();
  this._scaleIndicatorNode.parentNode.removeChild(this._scaleIndicatorNode);
};

export {ScaleIndicator};