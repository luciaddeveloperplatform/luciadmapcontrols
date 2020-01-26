/**
 * A function that creates an HTML snippet for a Feature, listing all its properties.
 *
 * Usage:
 * <pre>
 *       featureLayer.balloonContentProvider = SimpleBalloonContentProvider;
 * </pre>
 */
export var SimpleBalloonContentProvider = function(feature) {
  var content = "<table style='width:100%'> <tr> <td style='vertical-align: top; padding:2px; padding-bottom: 6px; font-weight: bold;'> PROPERTIES </td> </tr>";

  var properties = feature.properties;
  for (var property in properties) {
    if (properties.hasOwnProperty(property)) {
      var propertyText = property.replace(/_/g, " ");
      content += "<tr style=''>";
      content += "<td style='vertical-align: top; padding:2px; font-weight: bold'>" + propertyText + ":  </td>" +
        "<td style='vertical-align: top; padding:2px'> " + properties[property] + "</td>";
      content += "</tr>";
    }
  }

  content += "</table>";

  return content;
};