import {OutOfBoundsError} from "@luciad/ria/error/OutOfBoundsError";
import {LineType} from "@luciad/ria/geodesy/LineType";
import {createEllipsoidalGeodesy} from "@luciad/ria/geodesy/GeodesyFactory";
import {getReference} from "@luciad/ria/reference/ReferenceProvider";
import {createPoint} from "@luciad/ria/shape/ShapeFactory";
import {createTransformation} from "@luciad/ria/transformation/TransformationFactory";

var WGS84 = getReference("CRS:84");
var geodesy = createEllipsoidalGeodesy(WGS84);
var INCH_TO_CM = 2.54;
var CM_TO_METER = 100;

function truncate(aNumber) {
  var value = 100000000;
  return Math.round(aNumber * value) / value;
}

function _calculateMapUnitPerMeterRatio(map) {
  var viewSize = map.viewSize;
  var viewPoint = [viewSize[0] / 2, viewSize[1] / 2];
  var worldReference = map.reference;
  var mapToModelTransformation = createTransformation(worldReference, WGS84);

  try {
    // The points on the world reference
    var mapLeftPoint = map.viewToMapTransformation.transform(
      createPoint(null, [viewPoint[0] - 50, viewPoint[1]]));
    var mapRightPoint = map.viewToMapTransformation.transform(
      createPoint(null, [viewPoint[0] + 50, viewPoint[1]]));

    // The points on the model reference
    var modelLeftPoint = mapToModelTransformation.transform(mapLeftPoint);
    var modelRightPoint = mapToModelTransformation.transform(mapRightPoint);

    // The distance between the points
    var distanceInMeters = geodesy.distance(modelLeftPoint, modelRightPoint, LineType.SHORTEST_DISTANCE);

    if (distanceInMeters === 0.0) {
      //This happens when we are zoomed in a lot
      return 1;
    } else {
      var mapDistance = Math.sqrt(Math.pow(mapLeftPoint.x - mapRightPoint.x, 2) +
        Math.pow(mapLeftPoint.y - mapRightPoint.y, 2));
      var mapUnitPerMeterRatio = mapDistance / distanceInMeters;

      // Now we discretize the results of the calculations.  This makes sure getting the map scale
      // after is was just set yields the same result.
      return truncate(mapUnitPerMeterRatio);
    }
  } catch (e) {
    if (e instanceof OutOfBoundsError) {
      return 1;
    } else {
      throw e;
    }
  }
}

export var ScaleUtil = {
  getScaleAtMapCenter: function(map, dpi) {
    var mapUnitPerMeter = _calculateMapUnitPerMeterRatio(map);
    // scale is mapscale -> how many real world cm are displayed in 1cm.
    // recalculate to pixels per meter, assume a 96dpi screen
    dpi = dpi || 96;
    return map.mapScale[0] * (dpi / INCH_TO_CM) * CM_TO_METER * mapUnitPerMeter;
  }
};