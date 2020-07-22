/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Geohash encoding/decoding and associated functions   (c) Emre Turan 2019 / MIT Licence  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
"use strict";

/**
 * Geohash: Gustavo Niemeyer’s geocoding system.
 */
var Geohash = {};
Geohash.base32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * Encodes latitude/longitude to geohash, either to specified precision or to automatically
 * evaluated precision.
 *
 * @param   {number} lat - Latitude in degrees.
 * @param   {number} lon - Longitude in degrees.
 * @param   {number} [precision] - Number of characters in resulting geohash.
 * @param   {object} [options] - Number of options. Including elevation
 * @returns {string} Geohash of supplied latitude/longitude.
 * @throws  Invalid geohash.
 *
 * @example
 *     var geohash = Geohash.encode(52.205, 0.119, 7); // => 'u120fxw'
 *     var geohash = Geohash.encode(52.205, 0.119, 7, { elevation: 9, elevationType: 'floor'}); // => 'u120fxw@9'
 */
Geohash.encode = function (lat, lon, precision, options) {
  // infer precision?
  if (typeof precision == "undefined") {
    // refine geohash until it matches precision of supplied lat/lon
    for (var p = 1; p <= 12; p++) {
      var hash = Geohash.encode(lat, lon, p);
      var posn = Geohash.decode(hash);
      if (posn.lat == lat && posn.lon == lon) return hash;
    }
    precision = 12; // set to maximum
  }

  lat = Number(lat);
  lon = Number(lon);
  precision = Number(precision);

  if (isNaN(lat) || isNaN(lon) || isNaN(precision))
    throw new Error("Invalid geohash");

  var idx = 0; // index into base32 map
  var bit = 0; // each char holds 5 bits
  var evenBit = true;
  var geohash = "";

  var latMin = -90,
    latMax = 90;
  var lonMin = -180,
    lonMax = 180;

  while (geohash.length < precision) {
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
      geohash += Geohash.base32.charAt(idx);
      bit = 0;
      idx = 0;
    }
  }

  var elevation = (options && options.elevation) || 0;
  var elevationType = (options && options.elevationType) || "floor";

  return Geohash.appendElevation(geohash, elevation, elevationType);
};

/**
 * Decode geohash to latitude/longitude and elevation (location is approximate centre of geohash cell,
 *     to reasonable precision).
 *
 * @param   {string} geohash - Geohash string to be converted to latitude/longitude.
 * @returns {{lat:number, lon:number, elevation:number, elevationType:string}} (Center of and elevation) geohashed location.
 * @throws  Invalid geohash.
 *
 * @example
 *     var latlon = Geohash.decode('u120fxw'); // => { lat: 52.205, lon: 0.1188, elevation:0, elevationType:floor }
 *     var latlon = Geohash.decode('u120fxw@3'); // => { lat: 52.205, lon: 0.1188, elevation:3, elevationType:floor }
 *     var latlon = Geohash.decode('u120fxw#87'); // => { lat: 52.205, lon: 0.1188, elevation:87, elevationType:heightincm }
 */
Geohash.decode = function (geohash) {
  var geohashWithElevation = Geohash.excludeElevation(geohash);
  var bounds = Geohash.bounds(geohashWithElevation.geohash); // <-- the hard work
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
    elevation: Number(geohashWithElevation.elevation),
    elevationType: geohashWithElevation.elevationType,
  };
};

/**
 * Returns SW/NE latitude/longitude bounds of specified geohash.
 *
 * @param   {string} geohash - Cell that bounds are required of.
 * @returns {{sw: {lat: number, lon: number}, ne: {lat: number, lon: number}}, elevation: number, elevationType: string}
 * @throws  Invalid geohash.
 */
Geohash.bounds = function (geohash) {
  var geohashWithElevation = Geohash.excludeElevation(geohash);

  var geohashWithoutElevation = geohashWithElevation.geohash;

  var evenBit = true;
  var latMin = -90,
    latMax = 90;
  var lonMin = -180,
    lonMax = 180;

  for (var i = 0; i < geohashWithoutElevation.length; i++) {
    var chr = geohashWithoutElevation.charAt(i);
    var idx = Geohash.base32.indexOf(chr);
    if (idx == -1) throw new Error("Invalid geohash");

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
    elevation: geohashWithElevation.elevation,
    elevationType: geohashWithElevation.elevationType,
  };

  return bounds;
};

/**
 * Determines adjacent cell in given direction.
 *
 * @param   geohash - Cell to which adjacent cell is required.
 * @param   direction - Direction from geohash (N/S/E/W).
 * @returns {string} Geocode of adjacent cell.
 * @throws  Invalid geohash.
 */
Geohash.adjacent = function (geohash, direction) {
  // based on github.com/davetroy/geohash-js

  var geohashWithoutElevation = Geohash.excludeElevation(geohash).geohash;
  var elevation = Geohash.excludeElevation(geohash).elevation;
  var elevationType = Geohash.excludeElevation(geohash).elevationType;

  direction = direction.toLowerCase();

  if (geohashWithoutElevation.length === 0) throw new Error("Invalid geohash");
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

  var lastCh = geohashWithoutElevation.slice(-1); // last character of hash
  var parent = geohashWithoutElevation.slice(0, -1); // hash without last character

  var type = geohashWithoutElevation.length % 2;

  // check for edge-cases which don't share common prefix
  if (border[direction][type].indexOf(lastCh) != -1 && parent !== "") {
    parent = Geohash.adjacent(parent, direction);
  }

  // append letter for direction to parent
  var nextGeohash =
    parent + Geohash.base32.charAt(neighbour[direction][type].indexOf(lastCh));

  if (elevation && elevationType)
    return Geohash.appendElevation(nextGeohash, elevation, elevationType);

  return nextGeohash;
};

/**
 * Returns all 8 adjacent cells to specified geohash.
 *
 * @param   {string} geohash - Geohash neighbours are required of.
 * @returns {{n,ne,e,se,s,sw,w,nw: string}}
 * @throws  Invalid geohash.
 */
Geohash.neighbours = function (geohash) {
  return {
    n: Geohash.adjacent(geohash, "n"),
    ne: Geohash.adjacent(Geohash.adjacent(geohash, "n"), "e"),
    e: Geohash.adjacent(geohash, "e"),
    se: Geohash.adjacent(Geohash.adjacent(geohash, "s"), "e"),
    s: Geohash.adjacent(geohash, "s"),
    sw: Geohash.adjacent(Geohash.adjacent(geohash, "s"), "w"),
    w: Geohash.adjacent(geohash, "w"),
    nw: Geohash.adjacent(Geohash.adjacent(geohash, "n"), "w"),
  };
};

/**
 * Returns geohash and elevation properties.
 * It is mainly used by internal functions
 *
 * @param   {string} geohashWithElevation - Geohash with elevation chars.
 * @returns {geohash: string, elevation: Number, elevationType: string }
 * @throws  Invalid geohash.
 */
Geohash.excludeElevation = function (geohashWithElevation) {
  if (geohashWithElevation.length < 0) throw new Error("Invalid geohash");
  if (geohashWithElevation.includes("#") && geohashWithElevation.includes("@"))
    throw new Error("Invalid geohash");

  var geohashWithoutElevation = geohashWithElevation.toLocaleLowerCase();
  var elevationType = "floor";
  var elevation = 0;

  if (geohashWithElevation.includes("#")) {
    geohashWithoutElevation = geohashWithElevation.split("#")[0];
    elevation = geohashWithElevation.split("#")[1];
    elevationType = "heightincm";
  }

  if (geohashWithElevation.includes("@")) {
    geohashWithoutElevation = geohashWithElevation.split("@")[0];
    elevation = geohashWithElevation.split("@")[1];
  }

  return {
    geohash: geohashWithoutElevation,
    elevation: Number(elevation),
    elevationType,
  };
};

/**
 * Adds elevation chars and elevation
 * It is mainly used by internal functions
 *
 * @param   {string} geohashWithoutElevation - Geohash without elevation chars.
 * @param   {string} elevation - Height of the elevation.
 * @param   {string} elevationType - floor | heightincm.
 * @returns {string}
 * @throws  Invalid geohash.
 */
Geohash.appendElevation = function (
  geohashWithoutElevation,
  elevation,
  elevationType
) {
  if (geohashWithoutElevation.length < 0) throw new Error("Invalid geohash");
  if (elevation === 0) return geohashWithoutElevation;
  var elevationChar = "@";
  if (elevationType === "heightincm") elevationChar = "#";
  return `${geohashWithoutElevation}${elevationChar}${elevation}`;
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

if (typeof module != "undefined" && module.exports) module.exports = Geohash; // CommonJS, node.js
