# UNL CORE JS

Functions to convert a locationId to/from a latitude/longitude
point, and to determine bounds of a locationId cell and find neighbours of a locationId with elevation
features (floor and heightincm)

## API

- `LocationId.encode(lat, lon, [precision], [options])`: encode latitude/longitude point to locationId of given precision
  (number of characters in resulting locationId); if precision is not specified, it is inferred from
  precision of latitude/longitude values.
  options: {
  elevation: int,
  elevationType: floor'@'|heightincm'#' default: floor
  }
- `LocationId.decode(locationId)`: return { lat, lon, elevation, elevationType } of centre of given locationId, to appropriate precision.
- `LocationId.bounds(locationId)`: return { sw, ne, elevation, elevationType } bounds of given locationId.
- `LocationId.adjacent(locationId, direction)`: return adjacent cell to given locationId in specified direction (N/S/E/W) with elevation.
- `LocationId.neighbours(locationId)`: return all 8 adjacent cells (n/ne/e/se/s/sw/w/nw) and elevation to given locationId.

Note to obtain neighbours as an array, you can use

    const neighboursObj = LocationId.neighbours(locationId);
    const neighboursArr = Object.keys(neighboursObj).map(n => neighboursObj[n]);

The parent of a geocode is simply `geocode.slice(0, -1)`.

If you want the locationId converted from Base32 to Base4, you can e.g.:

    parseInt(LocationId.encode(52.20, 0.12, 6), 32).toString(4);

## Usage in browser

LocationId can be used in the browser by taking a local copy, or loading it from
[jsDelivr](https://www.jsdelivr.com/package/npm/unl-core): for example,

```html
<!DOCTYPE html><title>locationId example</title><meta charset="utf-8" />
<script type="module">
  import LocationId from "https://cdn.jsdelivr.net/npm/unl-core@2.0.0";

  const locationId = LocationId.encode(52.2, 0.12, 6);
  console.assert(locationId == "u120fw");

  const latlon = LocationId.decode("u120fw");
  console.assert(JSON.stringify(latlon) == '{"lat":52.1988,"lon":0.115}');
</script>
```

## Usage in Node.js

LocationId can be used in a Node.js app from [npm](https://www.npmjs.com/package/unl-core)
(currently the [esm](https://www.npmjs.com/package/esm) package is required to load ES-modules):

```shell
$ npm install unl-core esm
$ node -r esm
> import LocationId from 'unl-core';
> const locationId = LocationId.encode(52.20, 0.12, 6);
> console.assert(locationId == 'u120fw');
> const latlon = LocationId.decode('u120fw');
> console.assert(JSON.stringify(latlon) == '{"lat":52.1988,"lon":0.115}');
```

## Further details about locationId in general

More information (with interactive conversion) at
[www.movable-type.co.uk/scripts/locationId.html](http://www.movable-type.co.uk/scripts/locationId.html).

Full JsDoc at [www.movable-type.co.uk/scripts/js/unl-core/docs/LocationId.html](http://www.movable-type.co.uk/scripts/js/unl-core/docs/LocationId.html).
