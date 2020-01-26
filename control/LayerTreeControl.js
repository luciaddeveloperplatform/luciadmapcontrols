import {RasterDataType} from "@luciad/ria/model/tileset/RasterDataType";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {GridLayer} from "@luciad/ria/view/grid/GridLayer";
import {RasterImageLayer} from "@luciad/ria/view/image/RasterImageLayer";
import {LayerTreeNode} from "@luciad/ria/view/LayerTreeNode";
import {LayerTreeNodeType} from "@luciad/ria/view/LayerTreeNodeType";
import {LayerTreeVisitor} from "@luciad/ria/view/LayerTreeVisitor";
import {PaintRepresentation} from "@luciad/ria/view/PaintRepresentation";
import {RasterTileSetLayer} from "@luciad/ria/view/tileset/RasterTileSetLayer";
import {ContextMenu} from "../contextmenu/ContextMenu";
import {ContextMenuManager} from "../contextmenu/ContextMenuManager";
import {Control} from "./Control";

/**
 * A layertree control that only uses the HTML5 DOM API.
 * It does not depend on third-party UI libraries.
 *
 * To use it outside of the RIA samples, just copy the samples/common/LayerTreeControl directory
 * (including the icons directory) to your project,
 * and make sure the styles in LayerTreeControl.scss are included in your page.
 *
 * The control can be styled using the included SCSS file. At the top of that file you will find some variables
 * that easily allow you to change the colors of the layertree control (background, text and icon colors).
 *
 * The control can be instantiated as follows:
 *
 * <code>
 *   var layercontrol = new LayerTreeControl(map, options);
 * </code>
 *
 * The map argument is mandatory and must be a luciad/view/Map or a luciad/view/WebGLMap.
 *
 * The options argument is optional and has 1 optional property: options.domId. If options.domId is set,
 * the LayerTreeControl will insert itself into the DOM node with that id, if it exists.
 * If that node does not exist, it will set the id of the root DOM element of the layer tree control to options.domId.
 * If not specified, the control will insert itself into map.domNode and not set an id attribute.
 *
 * The layer control provides the following method calls:
 * <li>
 *   <ul>open(): opens the layer tree control</ul>
 *   <ul>close(): closes (collapses) the layer tree control</ul>
 *   <ul>toggle(): toggles the layer tree control</ul>
 * </li>
 *
 * DOM structure and CSS classes:
 *    - .control
 *       - .controlHeader
 *          - .lcdIcon (.lcdIcon*)
 *          - .controlHeaderTitle
 *          - .controlButton .controlCollapseAction
 *       - .controlBody
 *          - .controlPanel
 *            -.layerTreeNode (.layerTreeLayer | .layerTreeGroup)
 *              - .lcdIcon (.lcdIcon*)
 *              - .layerTreeNodeLabel
 *              - .layerTreeVisibleToggle
 *              - .controlButton
 *                 .layerTreeFitAction
 *                 .layerTreeMoreAction
 *              - .layerTreeGroupChildren? (in case of layerTreeGroup)
 *                - .layerTreeNode (.layerTreeLayer | .layerTreeGroup)
 */

var LAYERNODE_DOM_ID_PREFIX = "layerTreeNode_";

function preventBubbling(event) {
  event.stopPropagation();
  event.preventDefault();
};

/**
 * LayerTreeControl constructor.
 * @param map the map instance
 * @param options
 * @param [options.domId] reference to DOM id that will host the LayerTree UI
 * @param [options.noLayerDelete] if true, none of layers can be deleted (delete element will not be present).
 *                                by default layers can be deleted
 * @constructor
 */
function LayerTreeControl(map, options) {
  Control.call(this, map, options);
}

LayerTreeControl.prototype = Object.create(Control.prototype);
LayerTreeControl.prototype.constructor = LayerTreeControl;

LayerTreeControl.prototype.init = function(map, options) {
  options = options || {};
  options.title = options.title || "MAP LAYERS";
  options.icon = options.icon || "lcdIconLayer";
  Control.prototype.init.call(this, map, options);
  this.canDelete = !options.noLayerDelete;
}

LayerTreeControl.prototype._wireEventListeners = function() {
  Control.prototype._wireEventListeners.call(this);
  var self = this;
  this._nodeRemovedHandle = this._map.layerTree.on("NodeRemoved", function(event) {
    var domNode = self._getDOMElementForLayerNode(event.node);
    domNode.parentNode.removeChild(domNode);
  });
  this._nodeMovedHandle = this._map.layerTree.on("NodeMoved", function(event) {
    var movedLayer = event.node;
    var parentLayer = event.path[event.path.length - 1] || self._map.layerTree;
    self._moveOrAddLayerDomNodeInDOM(movedLayer, parentLayer, event.index);
  });
  this._nodeAddedHandle = this._map.layerTree.on("NodeAdded", function(event) {
    var addedLayer = event.node;
    var parentLayer = event.path[event.path.length - 1] || self._map.layerTree;
    self._moveOrAddLayerDomNodeInDOM(addedLayer, parentLayer, event.index);
  });
  this._selectionHoverEnabled = true;
  this._moveMoveAction = function(event) {
    if (self._selectionHoverEnabled && self._isValidLayerTreeNodeInteractionTarget(event.target)) {
      var layer = self._getLayerForDomElement(event.target);
      self.setSelected(layer);
    }
  }.bind(this);
  this._panelNode.addEventListener("mousemove", this._moveMoveAction, false);
};

LayerTreeControl.prototype._removeEventListeners = function() {
  this._nodeRemovedHandle.remove();
  this._nodeMovedHandle.remove();
  this._nodeAddedHandle.remove();
  this._selectionHoverEnabled = undefined;
  this._panelNode.removeEventListener("mousemove", this._moveMoveAction, false);
  Control.prototype._removeEventListeners.call(this);
};

LayerTreeControl.prototype.setSelected = function(layer) {
  if (this._selectedLayer !== layer) {
    var layerDomNodes = this._panelNode.querySelectorAll('.layerTreeNode');
    [].forEach.call(layerDomNodes, function(layerDomNode) {
      layerDomNode.classList.remove("layerTreeSelectedNode");
      layerDomNode.querySelector('.layerTreeNodeButtons').classList.add('hidden');
    });
    this._selectedLayer = layer;
    if (!this._selectedLayer) {
      return;
    }
    var selectedDomNode = this._getDOMElementForLayerNode(this._selectedLayer);
    selectedDomNode.classList.add("layerTreeSelectedNode");
    selectedDomNode.querySelector('.layerTreeNodeButtons').classList.remove('hidden');

    var selectedLayerNode = this._getDOMElementForLayerNode(this._selectedLayer);
    var visibleToggle = selectedLayerNode.querySelector(".visible-toggle");
    visibleToggle.classList.toggle("layerTreeDisabled", !this._selectedLayer.visible);

    //update enabled/disabled state of fit action
    var boundsToFitOn = (layer.model && layer.model.bounds) || layer.bounds;
    var fitAction = selectedDomNode.querySelector('.layerTreeFitLayerAction');
    if (layer.treeNodeType === LayerTreeNodeType.LAYER) {
      fitAction.classList.toggle("layerTreeDisabled", !boundsToFitOn);
      fitAction.title = !!boundsToFitOn ? "Fit to data." : "Cannot fit to layer. No data loaded (yet).";
    } else {
      fitAction.classList.add("hidden");
    }

    var self = this;
    if (this._removeSelectionOnLeaveListener) {
      this._removeSelectionOnLeaveListener.remove();
    }
    this._removeSelectionOnLeaveListener = selectedDomNode.addEventListener("mouseleave", function(event) {
      if (self._selectionHoverEnabled) {
        self.setSelected(null);
      }
    }, false);
  }
};

/**
 * Populates the layertreecontrol DOM node based on the map's layerTree contents.
 * @private
 */
LayerTreeControl.prototype._renderBody = function() {
  Control.prototype._renderBody.call(this);
  this._contextMenuManager = new ContextMenuManager();
  var layerTreeControl = this;
  var layerTreeVisitor = {
    visitLayer: function(layer) {
      layerTreeControl._moveOrAddLayerDomNodeInDOM(layer, layer.parent);
      return LayerTreeVisitor.ReturnValue.CONTINUE;
    },
    visitLayerGroup: function(layerGroup) {
      layerTreeControl._moveOrAddLayerDomNodeInDOM(layerGroup, layerGroup.parent);
      return LayerTreeVisitor.ReturnValue.CONTINUE;
    }
  };
  this._map.layerTree.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
};

/**
 * Creates a .layerTreeNode DIV for a given layer.
 * Does not insert it into the DOM.
 * @param layer The layer to create a DOM node for
 * @returns {Element} The DOM node representing the layer in the layerTree control
 * @private
 */
LayerTreeControl.prototype._createLayerDiv = function(layer) {
  var self = this;
  //1. main layerTreeNode div
  var layerDiv = document.createElement("div");
  layerDiv.id = this._getDOMIdForLayerNode(layer);
  layerDiv.classList.add("layerTreeNode");
  layerDiv.setAttribute("draggable", true);
  var layerClass = (layer.treeNodeType === LayerTreeNodeType.LAYER) ? "layerTreeLayer" : "layerTreeGroup";
  layerDiv.classList.add(layerClass);

  //2. layer type icon
  var icon = this._createLayerIcon(layer);
  layerDiv.appendChild(icon);
  if (layer.treeNodeType === LayerTreeNodeType.LAYER_GROUP) {
    icon.addEventListener("click", function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      var childrenDiv = layerDiv.querySelector(".layerTreeGroupChildren");
      if (childrenDiv) {
        var isClosed = childrenDiv.classList.toggle("hidden");
        icon.classList.toggle("lcdIconFolder", !isClosed);
        icon.classList.toggle("lcdIconFolderClosed", isClosed);
      }
    }, false);
  }

  //3. layer label
  var layerLabelText = document.createElement("span");
  layerLabelText.innerHTML = layer.label;
  layerLabelText.title = layer.label;
  layerLabelText.classList.add("layerTreeNodeLabel");
  layerDiv.appendChild(layerLabelText);

  //4. extra buttons (visibile on selected)
  var layerButtonsDiv = document.createElement("div");
  layerButtonsDiv.classList.add("layerTreeNodeButtons", "hidden");

  //4.1 contextMenuaction
  var contextMenuAction = document.createElement("span");
  contextMenuAction.classList.add("layerTreeMoreAction");
  contextMenuAction.classList.add("controlButton");
  contextMenuAction.title = "Other actions";

  contextMenuAction.appendChild(this._createIconElement({
    className: "lcdIconDots"
  }));

  //4.1.1. context menu
  var contextMenu = this._createLayerContextMenu(layer, layerDiv);
  var actionListener = function(event) {
    if (!contextMenu.isOpen()) {
      // var rect = moreAction.getBoundingClientRect();
      self._contextMenuManager.showOnly(contextMenu, event.clientX, event.clientY, "topRight");
    } else {
      contextMenu.hide();
      self.setSelected(layer);
    }
    event.stopPropagation();
    event.preventDefault();
  };

  contextMenuAction.addEventListener("click", actionListener, false);
  // Prevent double-click from bubbling up
  // This avoids a fit operation being triggered when rapidly clicking this button
  contextMenuAction.addEventListener("dblclick", preventBubbling, false);

  layerDiv.addEventListener("contextmenu", actionListener, false);
  layerButtonsDiv.appendChild(contextMenuAction);

  //4.2 fit action button
  var fitAction = document.createElement("div");
  fitAction.classList.add("layerTreeFitLayerAction", "controlButton");
  fitAction.title = "Fit to layer";
  fitAction.appendChild(this._createIconElement({
    className: "lcdIconFit"
  }));
  layerButtonsDiv.appendChild(fitAction);

  if (layer.treeNodeType === LayerTreeNodeType.LAYER) {
    var fitActionListener = fitAction.addEventListener("click", function(event) {
      var boundsToFitOn = (layer.model && layer.model.bounds) || layer.bounds;
      if (boundsToFitOn) {
        self._map.mapNavigator.fit({
          bounds: boundsToFitOn,
          animate: true
        });
      } else {
        throw new Error("No bounds to fits on!");
      }
      event.stopPropagation();
      event.preventDefault();
    }, false);
  }

  layerDiv.appendChild(layerButtonsDiv);

  //5. visibility toggle
  var visibleToggle = document.createElement("div");
  visibleToggle.appendChild(this._createIconElement({
    className: "lcdIconVisible"
  }));
  visibleToggle.classList.add("layerTreeAction", "visible-toggle", "controlButton");
  visibleToggle.classList.toggle("layerTreeDisabled", !layer.visible);
  visibleToggle.title = "Toggle layer visibility";
  layerDiv.appendChild(visibleToggle);
  layerDiv.classList.toggle("layerTreeTextDisabled", !layer.visible);
  visibleToggle.addEventListener("click", function(event) {
    layer.visible = !layer.visible;
    event.stopPropagation();
    event.preventDefault();
  }, false);
  // Prevent double-click from bubbling up
  // This avoids a fit operation being triggered when rapidly clicking this button
  visibleToggle.addEventListener("dblclick", preventBubbling, false);
  //#snippet visibilitychanged
  layer.on("VisibilityChanged", function(value) {
    visibleToggle.classList.toggle("layerTreeDisabled", !value);
    layerDiv.classList.toggle("layerTreeTextDisabled", !value);
  });
  //#endsnippet visibilitychanged
  layer.on("LabelChanged", function(value) {
    layerDiv.querySelector(".layerTreeNodeLabel").innerHTML = value;
  });

  //6. layer children
  var layerChildrenDiv;
  if (layer.treeNodeType === LayerTreeNodeType.LAYER_GROUP) {
    layerChildrenDiv = document.createElement("div");
    layerChildrenDiv.classList.add("layerTreeGroupChildren");
    layerDiv.appendChild(layerChildrenDiv);
  }
  for (var i = layer.children.length - 1; i >= 0; i--) { //children's orginal order is bottom -> top, we want to append from top -> bottom
    var child = layer.children[i];
    this._moveOrAddLayerDomNodeInDOM(child, layerDiv);
  }

  //7. wire DOM event listeners
  this._wireDragAndDropListeners(layerDiv);

  layerDiv.addEventListener("dblclick", function(event) {
    if (self._isValidLayerTreeNodeInteractionTarget(event.target) && !event.target.classList.contains("visible-toggle") && self._getLayerForDomElement(event.target) === layer && self._selectedLayer == layer && layer.treeNodeType !== LayerTreeNodeType.LAYER_GROUP) {
      self._map.mapNavigator.fit({
        bounds: (layer.model && layer.model.bounds) || layer.bounds,
        animate: true
      });
    }
  }, false);
  return layerDiv;
};

LayerTreeControl.prototype._createLayerContextMenu = function(layer, layerDiv) {
  var self = this;
  var contextMenu = new ContextMenu();

  if (this.canDelete) {
    var deleteItem = document.createElement("div");
    var deleteItemIcon = document.createElement("span");
    deleteItemIcon.classList.add("layerTreeAction", "remove-layer");
    deleteItemIcon.appendChild(this._createIconElement({
      className: "lcdIconDelete"
    }));
    deleteItem.appendChild(deleteItemIcon);
    var deleteItemLabel = document.createElement("span");
    deleteItemLabel.innerHTML = "Delete";
    var removeActionListener = deleteItem.addEventListener("click", function(event) {
      layer.parent.removeChild(layer);
      self._contextMenuManager.hideAll();
      event.stopPropagation();
      event.preventDefault();
    }, false);
    deleteItem.appendChild(deleteItemLabel);
    contextMenu.addItem(deleteItem);
  }

  if (layer.isPaintRepresentationSupported(PaintRepresentation.LABEL)) {
    //labeled toggle
    var labeledToggle = document.createElement("div");
    var labeledToggleIcon = document.createElement("span");
    labeledToggleIcon.classList.add("layerTreeAction", "labeled-toggle");
    var layerLabeled = layer.isPaintRepresentationVisible(PaintRepresentation.LABEL);
    labeledToggleIcon.classList.toggle("layerTreeDisabled", !layerLabeled);
    labeledToggleIcon.appendChild(this._createIconElement({
      className: "lcdIconLabel"
    }));
    labeledToggle.appendChild(labeledToggleIcon);
    var labeledToggleLabel = document.createElement("span");
    labeledToggleLabel.classList.toggle("layerTreeTextDisabled", !layerLabeled);
    labeledToggleLabel.innerHTML = "Labeled";
    labeledToggle.appendChild(labeledToggleLabel);
    labeledToggle.addEventListener("click", function(event) {
      if (layer.isPaintRepresentationSupported(PaintRepresentation.LABEL)) {
        var layerLabeled = layer.isPaintRepresentationVisible(PaintRepresentation.LABEL);
        layer.setPaintRepresentationVisible(PaintRepresentation.LABEL, !layerLabeled);
      }
      event.stopPropagation();
      event.preventDefault();
    }, false);
    layer.on("PaintRepresentationVisibilityChanged", function(value, paintRepresentation) {
      if (paintRepresentation === PaintRepresentation.LABEL) {
        labeledToggleIcon.classList.toggle("layerTreeDisabled", !value);
        labeledToggleLabel.classList.toggle("layerTreeTextDisabled", !value);
      }
    });
    contextMenu.addItem(labeledToggle);
  }

  //selectable toggle
  if (layer instanceof FeatureLayer) {
    //editable toggle
    var editableToggle = document.createElement("div");
    var editableToggleIcon = document.createElement("div");
    editableToggleIcon.classList.add("layerTreeAction", "editable-toggle");
    editableToggleIcon.classList.toggle("layerTreeDisabled", !layer.editable);
    editableToggleIcon.appendChild(this._createIconElement({
      className: "lcdIconEdit"
    }));
    editableToggle.appendChild(editableToggleIcon);
    var editableToggleLabel = document.createElement("span");
    editableToggleLabel.innerHTML = "Editable";
    editableToggleLabel.classList.toggle("layerTreeTextDisabled", !layer.editable);
    editableToggle.appendChild(editableToggleLabel);
    editableToggle.addEventListener("click", function(event) {
      layer.editable = !layer.editable;
      event.stopPropagation();
      event.preventDefault();
    }, false);
    layer.on("EditableChanged", function(value) {
      editableToggleIcon.classList.toggle("layerTreeDisabled", !value);
      editableToggleLabel.classList.toggle("layerTreeTextDisabled", !value);
    });
    contextMenu.addItem(editableToggle);

    var selectableToggle = document.createElement("div");
    var selectableToggleIcon = document.createElement("div");
    selectableToggleIcon.classList.add("layerTreeAction", "selectable-toggle");
    selectableToggleIcon.classList.toggle("layerTreeDisabled", !layer.selectable);
    selectableToggleIcon.appendChild(this._createIconElement({
      className: "lcdIconSelectable"
    }));
    selectableToggle.appendChild(selectableToggleIcon);
    layer.on("SelectableChanged", function(value) {
      selectableToggleIcon.classList.toggle("layerTreeDisabled", !value);
      selectableToggleLabel.classList.toggle("layerTreeTextDisabled", !value);
    });

    var selectableToggleLabel = document.createElement("span");
    selectableToggleLabel.innerHTML = "Selectable";
    selectableToggleLabel.classList.toggle("layerTreeTextDisabled", !layer.selectable);
    selectableToggle.appendChild(selectableToggleLabel);
    selectableToggle.addEventListener("click", function(event) {
      layer.selectable = !layer.selectable;
      event.stopPropagation();
      event.preventDefault();
    }, false);
    contextMenu.addItem(selectableToggle);
  }
  self._contextMenuManager.registerContextMenu(contextMenu);
  //keep stuff selected while contextmenu is open
  contextMenu.on("ContextMenuOpened", function() {
    self._selectionHoverEnabled = false;
  });
  contextMenu.on("ContextMenuClosed", function() {
    self._selectionHoverEnabled = true;
    self.setSelected(null);
  });
  return contextMenu;
};

LayerTreeControl.prototype._createLayerIcon = function(layer) {
  if (layer instanceof FeatureLayer) {
    return this._createIconElement({
      className: "lcdIconShapes",
      title: "Vector layer"
    });
  } else if (layer instanceof RasterTileSetLayer) {
    var isElevation = (layer.model.dataType && layer.model.dataType === RasterDataType.ELEVATION);
    return this._createIconElement({
      className: isElevation ? "lcdIconHeight" : "lcdIconRaster",
      title: isElevation ? "Elevation layer" : "Raster imagery layer"
    });
  } else if (layer instanceof RasterImageLayer) {
    return this._createIconElement({
      className: "lcdIconRaster",
      title: "Raster imagery layer"
    });
  } else if (layer instanceof GridLayer) {
    return this._createIconElement({
      className: "lcdIconGrid",
      title: "Grid layer"
    });
  } else if (layer.treeNodeType === LayerTreeNodeType.LAYER_GROUP) {
    return this._createIconElement({
      className: "lcdIconFolder",
      title: "Layer group"
    });
  }
  return this._createIconElement({
    className: "lcdIconUnknown",
    title: "Unknown layer type"
  })
};

LayerTreeControl.prototype._moveOrAddLayerDomNodeInDOM = function(layer, parentLayer, index) {
  var layerDiv = this._getDOMElementForLayerNode(layer) || this._createLayerDiv(layer);
  var parentLayerDOMNode = parentLayer instanceof Node ? parentLayer : this._getDOMElementForLayerNode(parentLayer);
  var domNodeToInsertInto = parentLayerDOMNode ? parentLayerDOMNode.querySelector(".layerTreeGroupChildren") : this._panelNode;
  var layerTreeNodeList = domNodeToInsertInto.children;
  var layerTreeNodesArr = Array.prototype.slice.call(layerTreeNodeList);
  var indexOfNodeToMoveOrAdd = layerTreeNodesArr.indexOf(layerDiv);
  if (indexOfNodeToMoveOrAdd >= 0) {
    //should move, remove it first
    layerTreeNodesArr.splice(indexOfNodeToMoveOrAdd, 1);
  } //else, just add
  if (index !== 0 && layerTreeNodesArr.length >= index) {
    var domNodeToMoveInFrontOf = layerTreeNodesArr[layerTreeNodesArr.length - index];
    domNodeToInsertInto.insertBefore(layerDiv, domNodeToMoveInFrontOf);
  } else {
    domNodeToInsertInto.appendChild(layerDiv);
  }
};

LayerTreeControl.prototype._getDOMIdForLayerNode = function(layerTreeNode) {
  return LAYERNODE_DOM_ID_PREFIX + layerTreeNode.id;
};

LayerTreeControl.prototype._getDOMElementForLayerNode = function(layerTreeNode) {
  var id = this._getDOMIdForLayerNode(layerTreeNode);
  return document.getElementById(id);
};

LayerTreeControl.prototype._getLayerDOMNodeForDomElement = function(domElement) {
  var currElem = domElement;
  //panelNode check to avoid going too far up the DOM
  //we know that if it hits the panelNode, we're already too far up the DOM to find layerTreeNodes
  while (currElem && currElem !== this._panelNode && !currElem.classList.contains("layerTreeNode")) {
    currElem = currElem.parentNode;
  }
  if (currElem && currElem !== this._panelNode && currElem.classList.contains("layerTreeNode")) {
    return currElem;

  }
  return null;
};

LayerTreeControl.prototype._getLayerForDomElement = function(domElement) {
  var layerDOMelem = this._getLayerDOMNodeForDomElement(domElement);
  if (layerDOMelem) {
    var layerId = layerDOMelem.id.substring(LAYERNODE_DOM_ID_PREFIX.length, layerDOMelem.id.length);
    return this._map.layerTree.findLayerTreeNodeById(layerId);
  }
  return null;
};

LayerTreeControl.prototype._isValidLayerTreeNodeInteractionTarget = function(domNode) {
  return domNode && domNode.classList && (domNode.classList.contains("layerTreeNode") ||
    domNode.classList.contains("layerTreeNodeLabel") ||
    domNode.classList.contains("lcdIcon") ||
    domNode.classList.contains("layerTreeAction", "visible-toggle"));
};

//handle the start of a drag. e.target is the element being dragged.
LayerTreeControl.prototype._handleDragStart = function(e) {
  if (this._isValidLayerTreeNodeInteractionTarget(e.target)) {
    e.target.classList.add("dragging");
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text', e.target.id);
  }
  e.stopPropagation();
};

//handle the end of a drag. e.target is the element being dragged.
LayerTreeControl.prototype._handleDragEnd = function(e) {
  var layerDomNodes = this._panelNode.querySelectorAll('.layerTreeNode');
  [].forEach.call(layerDomNodes, function(layerDomNode) {
    layerDomNode.classList.remove("dragging", "dragHover", "dragHoverBottom", "dragHoverTop");
    if (layerDomNode.classList.contains("layerTreeGroup")) {
      layerDomNode.querySelector(".layerTreeGroupChildren").classList.remove("dragHoverTop");
    }
  });
  e.stopPropagation();
};

//handle when a drag gesture goes over an element. e.target is the element being dragged over (not the element being dragged).
LayerTreeControl.prototype._handleDragEnter = function(e) {
  if (this._isValidLayerTreeNodeInteractionTarget(e.target)) {
    e.target.classList.add("dragHover");
  }
  e.stopPropagation();
};

//handle when a drag gesture leaves an element. e.target is element that the drag is leaving.
LayerTreeControl.prototype._handleDragLeave = function(e) {
  if (this._isValidLayerTreeNodeInteractionTarget(e.target)) {
    e.target.classList.remove("dragHover", "dragHoverBottom", "dragHoverTop");
    if (e.target.classList.contains("layerTreeGroup")) {
      e.target.querySelector(".layerTreeGroupChildren").classList.remove("dragHoverTop");
    }
  }
  e.stopPropagation();
};

LayerTreeControl.prototype._handleDragOver = function(e) {
  e.dataTransfer.dropEffect = 'move'; //change to none for default cursor
  if (this._isValidLayerTreeNodeInteractionTarget(e.target)) {
    //check if top or bottom half of div
    var layerTreeNode = this._getLayerDOMNodeForDomElement(e.target);
    var boundingRect = layerTreeNode.getBoundingClientRect();
    var middleOfDiv = boundingRect.top + 20;
    if (e.clientY < middleOfDiv) {
      layerTreeNode.classList.remove("dragHoverBottom");
      layerTreeNode.classList.add("dragHoverTop");
      this._insertPosition = "above";
    } else {
      layerTreeNode.classList.remove("dragHoverTop");
      if (layerTreeNode.classList.contains("layerTreeGroup")) {
        layerTreeNode.querySelector(".layerTreeGroupChildren").classList.add("dragHoverTop");
        this._insertPosition = "top";
      } else {
        layerTreeNode.classList.add("dragHoverBottom");
        this._insertPosition = "below";
      }
    }
  }

  e.preventDefault(); // Necessary. Allows us to drop.
  e.stopPropagation();
  return false;
};

LayerTreeControl.prototype._handleDrop = function(e) {
  var draggedElementId = e.dataTransfer.getData('text');
  var draggedElement = document.getElementById(draggedElementId);
  if (draggedElement) {
    draggedElement.classList.remove("dragging");
    if (this._isValidLayerTreeNodeInteractionTarget(e.target) && draggedElement !== e.target) {
      var layerToMove = this._getLayerForDomElement(draggedElement);
      var referenceLayer = this._getLayerForDomElement(e.target);
      try {
        if (this._insertPosition === "top" && referenceLayer.treeNodeType === LayerTreeNodeType.LAYER_GROUP) {
          referenceLayer.moveChild(layerToMove, "top");
        } else {
          referenceLayer.parent.moveChild(layerToMove, this._insertPosition, referenceLayer);
        }
      } catch (e) {
        console.warn(e.message);
      }
    }
  }
  e.preventDefault();
  e.stopPropagation();
  return false;
};

LayerTreeControl.prototype._wireDragAndDropListeners = function(layerDomNode) {
  var self = this;
  layerDomNode.addEventListener("dragstart", LayerTreeControl.prototype._handleDragStart.bind(self), false);
  layerDomNode.addEventListener("dragend", LayerTreeControl.prototype._handleDragEnd.bind(self), false);
  layerDomNode.addEventListener("dragover", LayerTreeControl.prototype._handleDragOver.bind(self), false);
  layerDomNode.addEventListener("dragenter", LayerTreeControl.prototype._handleDragEnter.bind(self), false);
  layerDomNode.addEventListener("dragleave", LayerTreeControl.prototype._handleDragLeave.bind(self), false);
  layerDomNode.addEventListener("drop", LayerTreeControl.prototype._handleDrop.bind(self), false);
};

LayerTreeControl.prototype.destroy = function() {
  Control.prototype.destroy.call(this);
  this._contextMenuManager = undefined;
  this.canDelete = undefined;
  this._nodeAddedHandle = undefined;
  this._nodeMovedHandle = undefined;
  this._nodeRemovedHandle = undefined;
};

export {LayerTreeControl};