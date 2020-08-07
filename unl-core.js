/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* LocationId encoding/decoding and associated functions   (c) Emre Turan 2019 / MIT Licence  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
"use strict";

/**
 * LocationId: UNL’s geocoding system.
 */
var LocationId = {};
LocationId.base32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * Encodes latitude/longitude to locationId, either to specified precision or to automatically
 * evaluated precision.
 *
 * @param   {number} lat - Latitude in degrees.
 * @param   {number} lon - Longitude in degrees.
 * @param   {number} [precision] - Number of characters in resulting locationId. Default value is 9.
 * @param   {object} [options] - Number of options. Including elevation
 * @returns {string} LocationId of supplied latitude/longitude.
 * @throws  Invalid coordinates.
 *
 * @example
 *     var locationId = LocationId.encode(52.205, 0.119, 7); // => 'u120fxw'
 *     var locationId = LocationId.encode(52.205, 0.119, 7, { elevation: 9, elevationType: 'floor'}); // => 'u120fxw@9'
 */
LocationId.encode = function (lat, lon, precision, options) {
  // infer precision?
  if (typeof precision == "undefined") {
    // refine locationId until it matches precision of supplied lat/lon
    for (var p = 1; p <= 9; p++) {
      var hash = LocationId.encode(lat, lon, p);
      var posn = LocationId.decode(hash);
      if (posn.lat == lat && posn.lon == lon) return hash;
    }
    precision = 9; // set to maximum
  }

  lat = Number(lat);
  lon = Number(lon);
  precision = Number(precision);

  if (isNaN(lat) || isNaN(lon) || isNaN(precision))
    throw new Error("Invalid coordinates");

  var idx = 0; // index into base32 map
  var bit = 0; // each char holds 5 bits
  var evenBit = true;
  var locationId = "";

  var latMin = -90,
    latMax = 90;
  var lonMin = -180,
    lonMax = 180;

  while (locationId.length < precision) {
    if (evenBit) {
      // bisect E-W longitude
      var lonMid = (lonMin + lonMax) / 2;
      if (lon >= lonMid) {
        idx = idx * 2 + 1;
        lonMin = lonMid;
      } else {
        idx = idx * 2;
        lonMax = lonMid;
      }
    } else {
      // bisect N-S latitude
      var latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        idx = idx * 2 + 1;
        latMin = latMid;
      } else {
        idx = idx * 2;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;

    if (++bit == 5) {
      // 5 bits gives us a character: append it and start over
      locationId += LocationId.base32.charAt(idx);
      bit = 0;
      idx = 0;
    }
  }

  var elevation = (options && options.elevation) || 0;
  var elevationType = (options && options.elevationType) || "floor";

  return LocationId.appendElevation(locationId, elevation, elevationType);
};

/**
 * Decode locationId to latitude/longitude and elevation (location is approximate centre of locationId cell,
 *     to reasonable precision).
 *
 * @param   {string} locationId - LocationId string to be converted to latitude/longitude.
 * @returns {{lat:number, lon:number, elevation:number, elevationType:string, bounds:{sw: {lat: number, lon: number}, ne: {lat: number, lon: number}, elevation: number, elevationType: string}}} Center of locationId, elevation and SW/NE latitude/longitude bounds of the locationId.
 * @throws  Invalid locationId.
 *
 * @example
 *     var latlon = LocationId.decode('u120fxw'); // => { lat: 52.205, lon: 0.1188, elevation:0, elevationType: floor, bounds: {elevation:0, elevationType:floor, ne: {lat: 52.205657958984375, lon: 0.119476318359375}, sw: {lat: 52.20428466796875, lon: 0.11810302734375}}}
 *     var latlon = LocationId.decode('u120fxw@3'); // => { lat: 52.205, lon: 0.1188, elevation:3, elevationType: floor,  bounds: {elevation:0, elevationType:floor, ne: {lat: 52.205657958984375, lon: 0.119476318359375}, sw: {lat: 52.20428466796875, lon: 0.11810302734375}}}
 *     var latlon = LocationId.decode('u120fxw#87'); // => { lat: 52.205, lon: 0.1188, elevation:87, elevationType: heightincm,  bounds: {elevation:0, elevationType:floor, ne: {lat: 52.205657958984375, lon: 0.119476318359375}, sw: {lat: 52.20428466796875, lon: 0.11810302734375}}}
 */
LocationId.decode = function (locationId) {
  var locationIdWithElevation = LocationId.excludeElevation(locationId);
  var bounds = LocationId.bounds(locationIdWithElevation.locationId); // <-- the hard work
  // now just determine the centre of the cell...

  var latMin = bounds.sw.lat,
    lonMin = bounds.sw.lon;
  var latMax = bounds.ne.lat,
    lonMax = bounds.ne.lon;

  // cell centre
  var lat = (latMin + latMax) / 2;
  var lon = (lonMin + lonMax) / 2;

  // round to close to centre without excessive precision: ⌊2-log10(Δ°)⌋ decimal places
  lat = lat.toFixed(Math.floor(2 - Math.log(latMax - latMin) / Math.LN10));
  lon = lon.toFixed(Math.floor(2 - Math.log(lonMax - lonMin) / Math.LN10));

  return {
    lat: Number(lat),
    lon: Number(lon),
    elevation: Number(locationIdWithElevation.elevation),
    elevationType: locationIdWithElevation.elevationType,
    bounds,
  };
};

/**
 * Returns SW/NE latitude/longitude bounds of specified locationId.
 *
 * @param   {string} locationId - Cell that bounds are required of.
 * @returns {{sw: {lat: number, lon: number}, ne: {lat: number, lon: number}}, elevation: number, elevationType: string}
 * @throws  Invalid locationId.
 */
LocationId.bounds = function (locationId) {
  var locationIdWithElevation = LocationId.excludeElevation(locationId);

  var locationIdWithoutElevation = locationIdWithElevation.locationId;

  var evenBit = true;
  var latMin = -90,
    latMax = 90;
  var lonMin = -180,
    lonMax = 180;

  for (var i = 0; i < locationIdWithoutElevation.length; i++) {
    var chr = locationIdWithoutElevation.charAt(i);
    var idx = LocationId.base32.indexOf(chr);
    if (idx == -1) throw new Error("Invalid locationId");

    for (var n = 4; n >= 0; n--) {
      var bitN = (idx >> n) & 1;
      if (evenBit) {
        // longitude
        var lonMid = (lonMin + lonMax) / 2;
        if (bitN == 1) {
          lonMin = lonMid;
        } else {
          lonMax = lonMid;
        }
      } else {
        // latitude
        var latMid = (latMin + latMax) / 2;
        if (bitN == 1) {
          latMin = latMid;
        } else {
          latMax = latMid;
        }
      }
      evenBit = !evenBit;
    }
  }

  var bounds = {
    sw: { lat: latMin, lon: lonMin },
    ne: { lat: latMax, lon: lonMax },
    elevation: locationIdWithElevation.elevation,
    elevationType: locationIdWithElevation.elevationType,
  };

  return bounds;
};

/**
 * Determines adjacent cell in given direction.
 *
 * @param   locationId - Cell to which adjacent cell is required.
 * @param   direction - Direction from locationId (N/S/E/W).
 * @returns {string} LocationId of adjacent cell.
 * @throws  Invalid locationId.
 */
LocationId.adjacent = function (locationId, direction) {
  // based on github.com/davetroy/geohash-js

  var locationIdWithoutElevation = LocationId.excludeElevation(locationId)
    .locationId;
  var elevation = LocationId.excludeElevation(locationId).elevation;
  var elevationType = LocationId.excludeElevation(locationId).elevationType;

  direction = direction.toLowerCase();

  if (locationIdWithoutElevation.length === 0)
    throw new Error("Invalid locationId");
  if ("nsew".indexOf(direction) == -1) throw new Error("Invalid direction");

  var neighbour = {
    n: ["p0r21436x8zb9dcf5h7kjnmqesgutwvy", "bc01fg45238967deuvhjyznpkmstqrwx"],
    s: ["14365h7k9dcfesgujnmqp0r2twvyx8zb", "238967debc01fg45kmstqrwxuvhjyznp"],
    e: ["bc01fg45238967deuvhjyznpkmstqrwx", "p0r21436x8zb9dcf5h7kjnmqesgutwvy"],
    w: ["238967debc01fg45kmstqrwxuvhjyznp", "14365h7k9dcfesgujnmqp0r2twvyx8zb"],
  };
  var border = {
    n: ["prxz", "bcfguvyz"],
    s: ["028b", "0145hjnp"],
    e: ["bcfguvyz", "prxz"],
    w: ["0145hjnp", "028b"],
  };

  var lastCh = locationIdWithoutElevation.slice(-1); // last character of hash
  var parent = locationIdWithoutElevation.slice(0, -1); // hash without last character

  var type = locationIdWithoutElevation.length % 2;

  // check for edge-cases which don't share common prefix
  if (border[direction][type].indexOf(lastCh) != -1 && parent !== "") {
    parent = LocationId.adjacent(parent, direction);
  }

  // append letter for direction to parent
  var nextLocationId =
    parent +
    LocationId.base32.charAt(neighbour[direction][type].indexOf(lastCh));

  if (elevation && elevationType)
    return LocationId.appendElevation(nextLocationId, elevation, elevationType);

  return nextLocationId;
};

/**
 * Returns all 8 adjacent cells to specified locationId.
 *
 * @param   {string} locationId - LocationId neighbours are required of.
 * @returns {{n,ne,e,se,s,sw,w,nw: string}}
 * @throws  Invalid locationId.
 */
LocationId.neighbours = function (locationId) {
  return {
    n: LocationId.adjacent(locationId, "n"),
    ne: LocationId.adjacent(LocationId.adjacent(locationId, "n"), "e"),
    e: LocationId.adjacent(locationId, "e"),
    se: LocationId.adjacent(LocationId.adjacent(locationId, "s"), "e"),
    s: LocationId.adjacent(locationId, "s"),
    sw: LocationId.adjacent(LocationId.adjacent(locationId, "s"), "w"),
    w: LocationId.adjacent(locationId, "w"),
    nw: LocationId.adjacent(LocationId.adjacent(locationId, "n"), "w"),
  };
};

/**
 * Returns locationId and elevation properties.
 * It is mainly used by internal functions
 *
 * @param   {string} locationIdWithElevation - LocationId with elevation chars.
 * @returns {locationId: string, elevation: Number, elevationType: string }
 * @throws  Invalid locationId.
 */
LocationId.excludeElevation = function (locationIdWithElevation) {
  if (locationIdWithElevation.length < 0) throw new Error("Invalid locationId");
  if (
    locationIdWithElevation.includes("#") &&
    locationIdWithElevation.includes("@")
  )
    throw new Error("Invalid locationId");

  var locationIdWithoutElevation = locationIdWithElevation.toLocaleLowerCase();
  var elevationType = "floor";
  var elevation = 0;

  if (locationIdWithElevation.includes("#")) {
    locationIdWithoutElevation = locationIdWithElevation.split("#")[0];
    elevation = locationIdWithElevation.split("#")[1];
    elevationType = "heightincm";
  }

  if (locationIdWithElevation.includes("@")) {
    locationIdWithoutElevation = locationIdWithElevation.split("@")[0];
    elevation = locationIdWithElevation.split("@")[1];
  }

  return {
    locationId: locationIdWithoutElevation,
    elevation: Number(elevation),
    elevationType,
  };
};

/**
 * Adds elevation chars and elevation
 * It is mainly used by internal functions
 *
 * @param   {string} locationIdWithoutElevation - LocationId without elevation chars.
 * @param   {string} elevation - Height of the elevation.
 * @param   {string} elevationType - floor | heightincm.
 * @returns {string}
 * @throws  Invalid locationId.
 */
LocationId.appendElevation = function (
  locationIdWithoutElevation,
  elevation,
  elevationType
) {
  if (locationIdWithoutElevation.length < 0)
    throw new Error("Invalid locationId");
  if (elevation === 0) return locationIdWithoutElevation;
  var elevationChar = "@";
  if (elevationType === "heightincm") elevationChar = "#";
  return `${locationIdWithoutElevation}${elevationChar}${elevation}`;
};

/**
 * Returns grid lines for specified SW/NE latitude/longitude bounds and precision.
 *
 * @param   {sw: {lat: number, lon: number}, ne: {lat: number, lon: number}} bounds - The bound whithin to return the grid lines.
 * @param   {number} [precision] - Number of characters to consider for the locationId of a grid cell. Default value is 9.
 * @returns {[[number, number],[number, number]][]}
 */
LocationId.gridLines = function (bounds, precision) {
  const lines = [];

  const lonMin = bounds.sw.lon;
  const lonMax = bounds.ne.lon;

  const latMin = bounds.sw.lat;
  const latMax = bounds.ne.lat;

  const encodePrecision = typeof precision == "undefined" ? 9 : precision;

  const swCellLocationId = LocationId.encode(
    bounds.sw.lat,
    bounds.sw.lon,
    encodePrecision
  );
  const swCellBounds = LocationId.bounds(swCellLocationId);

  const latStart = swCellBounds.ne.lat;
  const lonStart = swCellBounds.ne.lon;

  let currentCellLocationId = swCellLocationId;
  let currentCellBounds = swCellBounds;
  let currentCellNorthLatitude = latStart;

  while (currentCellNorthLatitude <= latMax) {
    lines.push([
      [lonMin, currentCellNorthLatitude],
      [lonMax, currentCellNorthLatitude],
    ]);

    currentCellLocationId = LocationId.adjacent(currentCellLocationId, "n");
    currentCellBounds = LocationId.bounds(currentCellLocationId);
    currentCellNorthLatitude = currentCellBounds.ne.lat;
  }

  currentCellLocationId = swCellLocationId;
  currentCellBounds = swCellBounds;
  let currentCellEastLongitude = lonStart;

  while (currentCellEastLongitude <= lonMax) {
    lines.push([
      [currentCellEastLongitude, latMin],
      [currentCellEastLongitude, latMax],
    ]);

    currentCellLocationId = LocationId.adjacent(currentCellLocationId, "e");
    currentCellBounds = LocationId.bounds(currentCellLocationId);
    currentCellEastLongitude = currentCellBounds.ne.lon;
  }

  return lines;
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

if (typeof module != "undefined" && module.exports) module.exports = LocationId; // CommonJS, node.js
