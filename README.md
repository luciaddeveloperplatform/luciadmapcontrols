# Luciad Map controls
 
## Description 
This is a set of ready to use controls for LuciadRIA 2020 created as part of the LuciadRIA tutorial

## How to use.  
Install the package from Github
```
npm install luciaddevelopmentplatform/luciadmapcontrols --save
```

Once installed you only need to import them the ES6 way:
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

import { ScaleIndicator, ZoomControl, MouseLocationComponent, LayerTreeControl , SimpleBalloonContentProvider} from "luciadmapcontrols";
import "luciadmapcontrols/styles.css"

...

const map = new WebGLMap(mapElement, {reference: ReferenceProvider.getReference("EPSG:4978")});
const layerControlElement = document.createElement("div");
layerControlElement.id =  'layer-control-id';
mapElement.appendChild(layerControlElement)

...

// Creating a div element to hold the layer control
const layerControlElement = document.createElement("div");
layerControlElement.id = 'layer-control-id';
mapElement.appendChild(layerControlElement)

// Adding a layer control at element with id="layer-control-id"
new LayerTreeControl(map, {
    noLayerDelete: true,
    domId: "layer-control-id"
});

// Adding other map controls
new ScaleIndicator(map);
new ZoomControl(map);
new MouseLocationComponent(map);

// Adding a feature layer to test balloon...
const store = new UrlStore({target: './resources/states.json'});
const model = new FeatureModel(store)
const layer = new FeatureLayer(model, {label: "USA"});

// Assign our Balloon controller  to a feature layer
layer.balloonContentProvider = SimpleBalloonContentProvider;

```
