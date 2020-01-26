import {EVENT_IGNORED, EVENT_HANDLED} from "@luciad/ria/view/controller/HandleEventResult";
import {GestureEventType} from "@luciad/ria/view/input/GestureEventType";
import {Controller} from "@luciad/ria/view/controller/Controller";

function TooltipHoverController() {
  this._tooltipNode = null;
}

TooltipHoverController.prototype = Object.create(Controller.prototype);
TooltipHoverController.prototype.constructor = TooltipHoverController;

TooltipHoverController.prototype.createTooltipDOMNode = function() {
  var tooltipNode = document.createElement("div");
  tooltipNode.setAttribute('role', 'tooltip');
  return tooltipNode;
};

TooltipHoverController.prototype.onActivate = function(map) {
  Controller.prototype.onActivate.call(this, map);
  this._tooltipNode = this.createTooltipDOMNode();
  map.domNode.appendChild(this._tooltipNode);
};

TooltipHoverController.prototype.onDeactivate = function() {
  this.map.domNode.removeChild(this._tooltipNode);
  this._tooltipNode = null;
  Controller.prototype.onDeactivate.call(this);
};

TooltipHoverController.prototype.onGestureEvent = function(event) {
  if (event.type === GestureEventType.MOVE) {
    var x = event.viewPosition[0];
    var y = event.viewPosition[1];
    var pickInfo = this.map.pickClosestObject(x, y, 0);
    if (pickInfo && this.shouldShowTooltip(x, y, pickInfo)) {
      this.showTooltip(x, y, pickInfo);
    } else {
      this.hideTooltip(x, y);
    }
    return EVENT_HANDLED;
  }
  if (event.type === GestureEventType.DRAG) { //hide the tooltip when a drag comes in
    this.hideTooltip(event.viewPosition[0], event.viewPosition[1]);
    return EVENT_IGNORED;
  }
  return EVENT_IGNORED;
};

TooltipHoverController.prototype.shouldShowTooltip = function(x, y, pickInfo) {
  return true;
};

TooltipHoverController.prototype.showTooltip = function(x, y, pickInfo) {
  var feature = pickInfo.objects[0];
  this._tooltipNode.classList.add("show");
  this._tooltipNode.style.left = x + 10 + "px";
  this._tooltipNode.style.top = y + 10 + "px";
  if (Object.keys(feature.properties).length > 0) {
    this._tooltipNode.innerHTML = this.showTooltipContent(feature);
  } else {
    this._tooltipNode.innerHTML = "";
  }
};

TooltipHoverController.prototype.showTooltipContent = function(feature) {
  var contents = "<h3 class='featureID'><span class='featureIDLabel'>Feature id: </span><span class='featureIDValue'>" + feature.id + "</span></h3>";

  contents += "<ul class='properties'>";
  for (var propKey in feature.properties) {
    contents += "<li class='property'><span class='propertyLabel'>" + propKey +
      ": </span><span class='propertyValue'>" + feature.properties[propKey] + "</span></li>";
  }
  contents += "</ul>";
  return contents;
};

TooltipHoverController.prototype.hideTooltip = function(x, y) {
  this._tooltipNode.classList.remove("show");
};

export {TooltipHoverController};