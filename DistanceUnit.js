function UnitObject(uomName, uomSymbol, toMetreFactor) {
  this.uomName = uomName;
  this.uomSymbol = uomSymbol;
  this._toMetreFactor = toMetreFactor;
}

UnitObject.prototype = Object.create(Object.prototype);
UnitObject.prototype.constructor = UnitObject;

UnitObject.prototype.convertToStandard = function(aValue) {
  return aValue * this._toMetreFactor;
};
UnitObject.prototype.convertFromStandard = function(aValue) {
  return aValue / this._toMetreFactor;
};

export var DistanceUnit = {
  METRE: new UnitObject("Metre", "m", 1),
  KM: new UnitObject("Kilometre", "km", 1000),
  NM: new UnitObject("NauticalMile", "NM", 1852.0),
  MILE_US: new UnitObject("MileUS", "mi", 1609.3472186944375),
  FT: new UnitObject("Feet", "ft", 0.30480060960121924)
};