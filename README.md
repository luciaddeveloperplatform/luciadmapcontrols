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

import { WebGLMap } from "@luciad/ria/view/WebGLMap";
import * as ReferenceProvider from '@luciad/ria/reference/ReferenceProvider';
import { createBounds } from "@luciad/ria/shape/ShapeFactory";

import { ScaleIndicator, ZoomControl, MouseLocationComponent, LayerTreeControl , SimpleBalloonContentProvider} from "luciadmapcontrols";
import "luciadmapcontrols/styles.css"

import ModelFactory from "./factories/ModelFactory";
import LayerFactory from "./factories/LayerFactory";

const root = document.getElementById("root");

const mapElement = document.createElement("div");
mapElement.classList.add("LuciadMap");
root.appendChild(mapElement);

const map =new WebGLMap(mapElement, {reference: ReferenceProvider.getReference("EPSG:4978")});
const layerControlElement = document.createElement("div");
layerControlElement.id =  'layer-control-id';
mapElement.appendChild(layerControlElement)


new ScaleIndicator(map);
new ZoomControl(map);
new MouseLocationComponent(map);

const layerConntroller = new LayerTreeControl(map, {
    noLayerDelete: true,
    domId: "layer-control-id"
});

map.mapNavigator.fit({bounds: createBounds(ReferenceProvider.getReference("CRS:84"), [-122, 60, 25, 20])});
const model = ModelFactory.createURLFeatureModel({target: './resources/states.json'});
const layer =LayerFactory.createFeatureLayer( model, {label: "USA", selectable: true});;
layer.balloonContentProvider = SimpleBalloonContentProvider;
map.layerTree.addChild(layer);
```
