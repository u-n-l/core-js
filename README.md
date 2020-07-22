# UNL CORE JS

Functions to convert a [geohash](http://en.wikipedia.org/wiki/Geohash) to/from a latitude/longitude
point, and to determine bounds of a geohash cell and find neighbours of a geohash with elevation
features (floor and heightincm)

## API

- `Geohash.encode(lat, lon, [precision], [options])`: encode latitude/longitude point to geohash of given precision
  (number of characters in resulting geohash); if precision is not specified, it is inferred from
  precision of latitude/longitude values.
  options: {
  elevation: int,
  elevationType: floor'@'|heightincm'#' default: floor
  }
- `Geohash.decode(geohash)`: return { lat, lon, elevation, elevationType } of centre of given geohash, to appropriate precision.
- `Geohash.bounds(geohash)`: return { sw, ne, elevation, elevationType } bounds of given geohash.
- `Geohash.adjacent(geohash, direction)`: return adjacent cell to given geohash in specified direction (N/S/E/W) with elevation.
- `Geohash.neighbours(geohash)`: return all 8 adjacent cells (n/ne/e/se/s/sw/w/nw) and elevation to given geohash.

Note to obtain neighbours as an array, you can use

    const neighboursObj = Geohash.neighbours(geohash);
    const neighboursArr = Object.keys(neighboursObj).map(n => neighboursObj[n]);

The parent of a geocode is simply `geocode.slice(0, -1)`.

If you want the geohash converted from Base32 to Base4, you can e.g.:

    parseInt(Geohash.encode(52.20, 0.12, 6), 32).toString(4);

## Usage in browser

Geohash can be used in the browser by taking a local copy, or loading it from
[jsDelivr](https://www.jsdelivr.com/package/npm/unl-core): for example,

```html
<!DOCTYPE html><title>geohash example</title><meta charset="utf-8" />
<script type="module">
  import Geohash from "https://cdn.jsdelivr.net/npm/unl-core@1.0.0";

  const geohash = Geohash.encode(52.2, 0.12, 6);
  console.assert(geohash == "u120fw");

  const latlon = Geohash.decode("u120fw");
  console.assert(JSON.stringify(latlon) == '{"lat":52.1988,"lon":0.115}');
</script>
```

## Usage in Node.js

Geohash can be used in a Node.js app from [npm](https://www.npmjs.com/package/unl-core)
(currently the [esm](https://www.npmjs.com/package/esm) package is required to load ES-modules):

```shell
$ npm install unl-core esm
$ node -r esm
> import Geohash from 'unl-core';
> const geohash = Geohash.encode(52.20, 0.12, 6);
> console.assert(geohash == 'u120fw');
> const latlon = Geohash.decode('u120fw');
> console.assert(JSON.stringify(latlon) == '{"lat":52.1988,"lon":0.115}');
```

## Further details about geohash in general

More information (with interactive conversion) at
[www.movable-type.co.uk/scripts/geohash.html](http://www.movable-type.co.uk/scripts/geohash.html).

Full JsDoc at [www.movable-type.co.uk/scripts/js/unl-core/docs/Geohash.html](http://www.movable-type.co.uk/scripts/js/unl-core/docs/Geohash.html).
