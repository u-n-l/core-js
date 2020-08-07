# UNL CORE JS

Functions to convert a locationId to/from a latitude/longitude point,
and to determine bounds of a locationId cell and find neighbours of a locationId
with elevation features (floor and heightincm)

## API

- `UnlCore.encode(lat, lon, [precision], [options])`: encode latitude/longitude point to locationId of given precision
  (number of characters in resulting locationId); Default precision is 9.
  options: {
  elevation: int,
  elevationType: floor'@'|heightincm'#' default: floor
  }
- `UnlCore.decode(locationId)`: return { lat, lon, elevation, elevationType } of centre of given locationId, to appropriate precision.
- `UnlCore.bounds(locationId)`: return { sw, ne, elevation, elevationType } bounds of given locationId.
- `UnlCore.adjacent(locationId, direction)`: return adjacent cell to given locationId in specified direction (N/S/E/W) with elevation.
- `UnlCore.neighbours(locationId)`: return all 8 adjacent cells (n/ne/e/se/s/sw/w/nw) and elevation to given locationId.
- `UnlCore.gridLines(bounds, [precision])`: returns the vertical and horizontal lines that can be used to draw a UNL grid in the given bounds.
  Each line is represented by an array of two coordinates in the format: [[startLon, startLat], [endLon, endLat]]. Default precision is 9.

Note to obtain neighbours as an array, you can use

    const neighboursObj = UnlCore.neighbours(locationId);
    const neighboursArr = Object.keys(neighboursObj).map(n => neighboursObj[n]);

The parent of a locationId is simply `locationId.slice(0, -1)`.

If you want the locationId converted from Base32 to Base4, you can e.g.:

    parseInt(UnlCore.encode(52.20, 0.12, 6), 32).toString(4);

## Install

```sh
npm install unl-core
```

```sh
yarn add unl-core
```

## TypeScript

```sh
npm install @types/unl-core --save-dev
```

```sh
yarn add @types/unl-core --dev
```

## Usage

You can either import certain functions from the package directly:

```js
import { encode } from "unl-core";
```

or load the whole library:

```js
import UnlCore from "unl-core";
```

## Usage in browser

UnlCore can be used in the browser by taking a local copy, or loading it from
[jsDelivr](https://www.jsdelivr.com/package/npm/unl-core): for example,

```html
<!DOCTYPE html><title>locationId example</title><meta charset="utf-8" />
<script type="module">
  import UnlCore from "https://cdn.jsdelivr.net/npm/unl-core@2.0.0";

  const locationId = UnlCore.encode(52.2, 0.12, 6);
  console.assert(locationId == "u120fw");

  const latlon = UnlCore.decode("u120fw");
  console.assert(JSON.stringify(latlon) == '{"lat":52.1988,"lon":0.115}');
</script>
```

## Usage in Node.js

UnlCore can be used in a Node.js app from [npm](https://www.npmjs.com/package/unl-core)
(currently the [esm](https://www.npmjs.com/package/esm) package is required to load ES-modules):

```shell
$ npm install unl-core esm
$ node -r esm
> import UnlCore from 'unl-core';
> const locationId = UnlCore.encode(52.20, 0.12, 6);
> console.assert(locationId == 'u120fw');
> const latlon = UnlCore.decode('u120fw');
> console.assert(JSON.stringify(latlon) == '{"lat":52.1988,"lon":0.115}');
```

## Upgrade to version 2.0 from version 1.0

In version 2.0 we renamed the concept of geohash to locationId. In order to upgrade from version 1.0 you need to:

- Import `UnlCore` instead of `Geohash` from `unl-core`
- Get `locationId` instead of `geohash` from the answer of methods which returned an object with `geohash` parameter
