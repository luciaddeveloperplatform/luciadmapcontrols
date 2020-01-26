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
import "./index.scss";

//  Luciad Map controls NPM library
import { ScaleIndicator, ZoomControl, MouseLocationComponent, LayerTreeControl , SimpleBalloonContentProvider} from "luciadmapcontrols";
import "luciadmapcontrols/styles.css"

// LuciadRIA API
import { WebGLMap } from "@luciad/ria/view/WebGLMap";
import * as ReferenceProvider from '@luciad/ria/reference/ReferenceProvider';
import { createBounds } from "@luciad/ria/shape/ShapeFactory";
import {UrlStore} from "@luciad/ria/model/store/UrlStore";
import {FeatureModel} from "@luciad/ria/model/feature/FeatureModel";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";

// Create a dom element to hold the map
const mapElement = document.createElement("div");
mapElement.classList.add("LuciadMap");

// Add it to root
const root = document.getElementById("root");
root.appendChild(mapElement);

// Create a map and got to boounds
const map =new WebGLMap(mapElement, {reference: ReferenceProvider.getReference("EPSG:4978")});
map.mapNavigator.fit({bounds: createBounds(ReferenceProvider.getReference("CRS:84"), [-122, 60, 25, 20])});

// Create an element to hold the layer control
const layerControlElement = document.createElement("div");
layerControlElement.id =  'layer-control-id';
mapElement.appendChild(layerControlElement)
new LayerTreeControl(map, {
    noLayerDelete: true,
    domId: "layer-control-id"
});

// Add other map controls when needed
new ScaleIndicator(map);
new ZoomControl(map);
new MouseLocationComponent(map);

// Add a layer to test...
const store = new UrlStore({target: './resources/states.json'});
const model =  new FeatureModel(store)
const layer = new FeatureLayer(model, {label: "USA", selectable: true});

// Assign our Balloon controller  to a layer
layer.balloonContentProvider = SimpleBalloonContentProvider;

// Add layer to map
map.layerTree.addChild(layer);

```
