# Luciad Map controls
 
## Description 
This is a set of ready to use controls for LuciadRIA 2020 created as part of the LuciadRIA tutorial. 
You will require a copy of LuciadRIA2020.x installed in your main project to use this library. 

## How to use.  
* 1 Create a project. 
* 2 Make sure you LuciadRIA2020.x (or above) is already installed 
* 3 Install luciadmapcontrols from npm or from github

Install the package from npm (this is the latest stable version)
```
npm install luciadmapcontrols --save
```

* 4 Once installed you only need to import the modules the ES6 way:
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


## Example:
```
...
// Import Luciad Map controlsfrom this library
import { ScaleIndicator, ZoomControl, MouseLocationComponent, LayerTreeControl , SimpleBalloonContentProvider} from "luciadmapcontrols";
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

// Add a feature layer to test...
const store = new UrlStore({target: './resources/states.json'});
const model = new FeatureModel(store)
const layer = new FeatureLayer(model, {label: "USA", selectable: true});

// Assign our the Balloon controller  to a feature layer
layer.balloonContentProvider = SimpleBalloonContentProvider;

// Add the feature layer to the map
map.layerTree.addChild(layer);

```
