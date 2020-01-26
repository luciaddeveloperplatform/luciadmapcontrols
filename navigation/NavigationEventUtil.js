var isTouch = 'ontouchstart' in window;

function onContinuousMouseDown(node, doAction) {

  if (isTouch) { //only allow discrete zooming on mobile devices
    node.addEventListener('touchend', function(event) {
      doAction();
    }, false)
    return;
  }

  var continuousStarted = false;
  var timing = 120;
  var initialWait = 150;
  var over = false;

  node.addEventListener('mouseenter', function(event) {
    over = true;
  }, false);

  node.addEventListener('mousedown', function(event) {
    over = true;
    setTimeout(function() {
      (function fire() {
        if (over) {
          continuousStarted = true;
          doAction();
          setTimeout(fire, timing);
        }
      }());
    }, initialWait);
  }, false)

  node.addEventListener('mouseup', function(event) {
    over = false;
    doAction();
    continuousStarted = false;
  }, false);

  node.addEventListener('mouseout', function(event) {
    over = false;
    continuousStarted = false;
  }, false);
}

export var NavigationEventUtil = {
  onContinuousMouseDown: onContinuousMouseDown
};