# Luciad Map controls
 
## Description 
This is a package of ready to use web controls for LuciadRIA 2020 created as part of the LuciadRIA tutorial. 
https://dev.luciad.com

To use this package you require a copy of LuciadRIA2020.x previously installed as a dependency in your npm project.

LuciadRIA is commercial software developed by Hexagon. To use LuciadRIA you will need to acquire a copy of LuciadRIA from your local distributor. 
For more information on how to acquire a copy of LuciadRIA refer to https://www.hexagongeospatial.com/

## How to use.  
- 1 Create a new project or reuse an existing one. 
- 2 Make sure the LuciadRIA2020.x(or above) is already installed in your project
- 3 Then Install luciadmapcontrols with npm from github link below

IMPORTANT: Use the 'tarball' link below (you can replace /master to request a specific version)
```
npm install https://github.com/luciaddeveloperplatform/luciadmapcontrols/tarball/master
```

* 4 Once luciadmapcontrols is installed you can import the modules the ES6 way:  

IMPORTANT:  Don'r forget to import the CSS.
```
    import { ScaleIndicator, ZoomControl, MouseLocationComponent, LayerTreeControl } from "luciadmapcontrols";
    import "luciadmapcontrols/styles.css"
```

## Controls currently available:
 * LayerTreeControl
 * Control
 * ScaleIndicator
 * ZoomControl
 * PanControl
 * MouseLocationComponent
 * SimpleBalloonContentProvider
 * ControlGroup
 * TooltipHoverController
 * ContextMenu
 * SampleContextMenu
 * AttributionComponent


## Examples:
Example 1: Basic controls
```
...
// Import the Luciad Map Controls from the luciadmapcontrols package
import { ScaleIndicator, ZoomControl, MouseLocationComponent, LayerTreeControl } from "luciadmapcontrols";
import "luciadmapcontrols/styles.css";

...

// Create a map and fit to bounds
const map = new WebGLMap(mapElement, {reference: ReferenceProvider.getReference("EPSG:4978")});
map.mapNavigator.fit({bounds: createBounds(ReferenceProvider.getReference("CRS:84"), [-122, 60, 25, 20])});

// Create an html element to hold the layer control
const layerControlElement = document.createElement("div");
layerControlElement.id = 'layer-control-id';
mapElement.appendChild(layerControlElement);

// Create a new LayerTreeControl
new LayerTreeControl(map, {
    noLayerDelete: true,
    domId: "layer-control-id"
});

// Add other map controls when needed
new ScaleIndicator(map);
new ZoomControl(map);
new MouseLocationComponent(map);

```
Example 2: A balloon controller

```
// Import the Luciad Map Controls from the luciadmapcontrols package
import { SimpleBalloonContentProvider } from "luciadmapcontrols";
import "luciadmapcontrols/styles.css";

// Add a feature layer to test...
const store = new UrlStore({target: './resources/states.json'});
const model = new FeatureModel(store)
const layer = new FeatureLayer(model, {label: "USA", selectable: true});

// Assign our the Balloon controller  to a feature layer
layer.balloonContentProvider = SimpleBalloonContentProvider;

// Add the feature layer to the map
map.layerTree.addChild(layer);

```
