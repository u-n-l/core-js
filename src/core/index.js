/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* LocationId encoding/decoding and associated functions   (c) Emre Turan 2019 / MIT Licence  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
"use strict";
const https = require('https');
const baseUrl = "api.unl.global"
global.API_KEY = ""; // set this with UnlCore.authenticate(key)
const LOCATION_ID_REGEX = /^[0123456789bcdefghjkmnpqrstuvwxyz]{3,16}[@#]?[0-9]{0,3}$/
const COORDINATES_REGEX = /^-?[0-9]{0,2}\.?[0-9]{0,16},\s?-?[0-9]{0,3}\.?[0-9]{0,16}$/

/**
 * UnlCore: UNL’s geocoding system.
 */
var Core = {};
Core.base32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * Encodes latitude/longitude coordinates to locationId, either to specified precision or
 * to default precision. Elevation information can be optionally specified in options parameter.
 *
 * @param   {number} lat - Latitude in degrees.
 * @param   {number} lon - Longitude in degrees.
 * @param   {number} [precision] - Number of characters in resulting locationId. Default value is 9.
 * @param   {object} [options] - Number of options. Including elevation
 * @returns {string} LocationId of supplied latitude/longitude.
 * @throws  Invalid coordinates.
 *
 * @example
 *     var locationId = UnlCore.encode(52.205, 0.119, 7); // => 'u120fxw'
 *     var locationId = UnlCore.encode(52.205, 0.119, 7, { elevation: 9, elevationType: 'floor'}); // => 'u120fxw@9'
 */
Core.encode = function (lat, lon, precision, options) {
  // infer precision?
  if (typeof precision == "undefined") {
    // refine locationId until it matches precision of supplied lat/lon
    for (var p = 1; p <= 9; p++) {
      var hash = Core.encode(lat, lon, p);
      var posn = Core.decode(hash);
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
      locationId += Core.base32.charAt(idx);
      bit = 0;
      idx = 0;
    }
  }

  var elevation = (options && options.elevation) || 0;
  var elevationType = (options && options.elevationType) || "floor";

  return Core.appendElevation(locationId, elevation, elevationType);
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
 *     var latlon = UnlCore.decode('u120fxw'); // => { lat: 52.205, lon: 0.1188, elevation:0, elevationType: floor, bounds: {elevation:0, elevationType:floor, ne: {lat: 52.205657958984375, lon: 0.119476318359375}, sw: {lat: 52.20428466796875, lon: 0.11810302734375}}}
 *     var latlon = UnlCore.decode('u120fxw@3'); // => { lat: 52.205, lon: 0.1188, elevation:3, elevationType: floor,  bounds: {elevation:0, elevationType:floor, ne: {lat: 52.205657958984375, lon: 0.119476318359375}, sw: {lat: 52.20428466796875, lon: 0.11810302734375}}}
 *     var latlon = UnlCore.decode('u120fxw#87'); // => { lat: 52.205, lon: 0.1188, elevation:87, elevationType: heightincm,  bounds: {elevation:0, elevationType:floor, ne: {lat: 52.205657958984375, lon: 0.119476318359375}, sw: {lat: 52.20428466796875, lon: 0.11810302734375}}}
 */
Core.decode = function (locationId) {
  var locationIdWithElevation = Core.excludeElevation(locationId);
  var bounds = Core.bounds(locationIdWithElevation.locationId); // <-- the hard work
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
 * Returns SW/NE latitude/longitude bounds of specified locationId cell.
 *
 * @param   {string} locationId - Cell that bounds are required of.
 * @returns {{sw: {lat: number, lon: number}, ne: {lat: number, lon: number}}, elevation: number, elevationType: string}
 * @throws  Invalid locationId.
 */
Core.bounds = function (locationId) {
  var locationIdWithElevation = Core.excludeElevation(locationId);

  var locationIdWithoutElevation = locationIdWithElevation.locationId;

  var evenBit = true;
  var latMin = -90,
    latMax = 90;
  var lonMin = -180,
    lonMax = 180;

  for (var i = 0; i < locationIdWithoutElevation.length; i++) {
    var chr = locationIdWithoutElevation.charAt(i);
    var idx = Core.base32.indexOf(chr);
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
Core.adjacent = function (locationId, direction) {
  // based on github.com/davetroy/geohash-js

  var locationIdWithoutElevation = Core.excludeElevation(locationId)
    .locationId;
  var elevation = Core.excludeElevation(locationId).elevation;
  var elevationType = Core.excludeElevation(locationId).elevationType;

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
    parent = Core.adjacent(parent, direction);
  }

  // append letter for direction to parent
  var nextLocationId =
    parent + Core.base32.charAt(neighbour[direction][type].indexOf(lastCh));

  if (elevation && elevationType)
    return Core.appendElevation(nextLocationId, elevation, elevationType);

  return nextLocationId;
};

/**
 * Returns all 8 adjacent cells to specified locationId.
 *
 * @param   {string} locationId - LocationId neighbours are required of.
 * @returns {{n,ne,e,se,s,sw,w,nw: string}}
 * @throws  Invalid locationId.
 */
Core.neighbours = function (locationId) {
  return {
    n: Core.adjacent(locationId, "n"),
    ne: Core.adjacent(Core.adjacent(locationId, "n"), "e"),
    e: Core.adjacent(locationId, "e"),
    se: Core.adjacent(Core.adjacent(locationId, "s"), "e"),
    s: Core.adjacent(locationId, "s"),
    sw: Core.adjacent(Core.adjacent(locationId, "s"), "w"),
    w: Core.adjacent(locationId, "w"),
    nw: Core.adjacent(Core.adjacent(locationId, "n"), "w"),
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
Core.excludeElevation = function (locationIdWithElevation) {
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
Core.appendElevation = function (
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
 * Returns the vertical and horizontal lines that can be used to draw a UNL grid in the specified
 * SW/NE latitude/longitude bounds and precision. Each line is represented by an array of two
 * coordinates in the format: [[startLon, startLat], [endLon, endLat]].
 *
 * @param   {sw: {lat: number, lon: number}, ne: {lat: number, lon: number}} bounds - The bound within to return the grid lines.
 * @param   {number} [precision] - Number of characters to consider for the locationId of a grid cell. Default value is 9.
 * @returns {[[number, number],[number, number]][]}
 */
Core.gridLines = function (bounds, precision) {
  const lines = [];

  const lonMin = bounds.sw.lon;
  const lonMax = bounds.ne.lon;

  const latMin = bounds.sw.lat;
  const latMax = bounds.ne.lat;

  const encodePrecision = typeof precision == "undefined" ? 9 : precision;

  const swCellLocationId = Core.encode(
    bounds.sw.lat,
    bounds.sw.lon,
    encodePrecision
  );
  const swCellBounds = Core.bounds(swCellLocationId);

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

    currentCellLocationId = Core.adjacent(currentCellLocationId, "n");
    currentCellBounds = Core.bounds(currentCellLocationId);
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

    currentCellLocationId = Core.adjacent(currentCellLocationId, "e");
    currentCellBounds = Core.bounds(currentCellLocationId);
    currentCellEastLongitude = currentCellBounds.ne.lon;
  }

  return lines;
};

const _httpGet = options => {
  return new Promise((resolve, reject) => {
    https.get(options, res => {
      res.setEncoding('utf8');
      let body = ''; 
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
};

/**
 * Returns the human-readable address of a given location (either coordinates or UNL cell id)
 * 
 * @param {string} location - the location (Id or lat-lon coordinates) of the point for which you would like the address
 * @param {string} apiKey - Your UNL API key used to access the location APIs
 * @param {string} langCode - 2 letter language code of response (default: en)
 * @param {number} count - the number of words in the returned address (only valid for coordinate calls)
 */
Core.toWords = async (location, apiKey, langCode = "en", count = 3) => {
  if (!apiKey) { 
    throw new Error("API key not set. UnlCore.authenticate(...) required for toWords call")
  }
  let type = ""
  let addition = ""
  if (location.match(LOCATION_ID_REGEX)) type = "geohash"
  else if (location.match(COORDINATES_REGEX)) {
    addition = `?count=${count}`
    type = "coordinates"
  }
  else {
    console.error(`Could not interpret your input, ${location}. Expected a locationId or lat,lon coordinates.`)
    return;
  }

  let options = {
    host: baseUrl,
    path: `/v1/location/${type}/${location}?language=${langCode}${addition}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  }

  return JSON.parse(await _httpGet(options))
}

/**
 * Returns the coordinates of a given address
 * 
 * @param {string} words - the words representing the point for which you would like the coordinates
 * @param {string} apiKey - Your UNL API key used to access the location APIs
 * @param {string} langCode - 2 letter language code of response (default: en)
 */
Core.fromWords = async (words, apiKey, langCode = "en") => {
  if (!apiKey) { 
    throw new Error("API key not set. UnlCore.authenticate(...) required for fromWords call")
  }

  let options = {
    host: baseUrl,
    path: `/v1/location/words/${words}?language=${langCode}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  }
  return JSON.parse(await _httpGet(options))
}

if (typeof module != "undefined" && module.exports) module.exports = Core; // CommonJS, node.js