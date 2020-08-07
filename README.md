# UNL CORE JS

This library can be used to convert a UNL locationId to/from a latitude/longitude point. It also contains helper functions like retrieving the bounds of a UNL cell or the UNL grid lines for a given boundingbox (these can be used to draw a UNL cell or a UNL grid).

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

UnlCore can be used in the browser by taking a local copy, or loading it from [jsDelivr](https://www.jsdelivr.com/package/npm/unl-core): for example,

```html
<!DOCTYPE html><title>locationId example</title><meta charset="utf-8" />
<script type="module">
  import UnlCore from "https://cdn.jsdelivr.net/npm/unl-core@2.0.2";

  const locationId = UnlCore.encode(52.2, 0.12, 6);
  console.assert(locationId == "u120fw");

  const latlon = UnlCore.decode("u120fw");
  console.assert(JSON.stringify(latlon) == '{"lat":52.1988,"lon":0.115}');
</script>
```

## Usage in Node.js

UnlCore can be used in a Node.js app from [npm](https://www.npmjs.com/package/unl-core) (currently the [esm](https://www.npmjs.com/package/esm) package is required to load ES-modules):

```shell
$ npm install unl-core esm
$ node -r esm
> import UnlCore from 'unl-core';
> const locationId = UnlCore.encode(52.20, 0.12, 6);
> console.assert(locationId == 'u120fw');
> const latlon = UnlCore.decode('u120fw');
> console.assert(JSON.stringify(latlon) == '{"lat":52.1988,"lon":0.115}');
```

## Interfaces

### `Direction`

```js
enum Direction {
    NORTH = 'N',
    SOUTH = 'S',
    EAST = 'E',
    WEST = 'W',
}
```

### `ElevationType`

```js
enum ElevationType {
    FLOOR = 'floor',
    HEIGHT_IN_CM = 'heightincm',
}
```

### `Neighbours`

```js
interface Neighbours {
  n: string;
  ne: string;
  e: string;
  se: string;
  s: string;
  sw: string;
  w: string;
  nw: string;
}
```

### `Point`

```js
interface Point {
  lat: number;
  lon: number;
}
```

### `Bounds`

```js
interface Bounds {
  sw: Point;
  ne: Point;
  elevation: number;
  elevationType: ElevationType;
}
```

### `Point`

```js
interface PointWithElevation extends Point {
  lat: number;
  lon: number;
  elevation: number;
  elevationType: ElevationType;
  bounds: Bounds;
}
```

### `EncodeOptions`

```js
interface EncodeOptions {
  elevation: number;
  elevationType: ElevationType;
}
```

### `LocationIdWithElevation`

```js
interface LocationIdWithElevation {
  elevation: number;
  elevationType: ElevationType;
  locationId: string;
}
```

## Functions

### `encode(lat: number, lon: number, precision?: number, options?: EncodeOptions): string`

Encodes lat/lon coordinates to locationId, either to specified precision or to default precision. Elevation information can be optionally specified in options parameter.

```js
UnlCore.encode(52.37686, 4.90065);
```

Returns a string:

```
"u173zwbt3"
```

### `decode(locationId: string): PointWithElevation`

Decodes a locationId to lat/lon (location is approximate centre of locationId cell, to reasonable precision).

```js
UnlCore.decode("u173zwbt3");
```

Returns a Point object:

```js
{
    lat: centerLat,
    lon: centerLon,
    bounds: {
        sw: {
            lat: minLat,
            lon: minLon
        },
        ne: {
            lat: maxLat,
            lon: maxLon
       }
    }
}
```

### `bounds(locationId: string): Bounds`

Returns SW/NE lat/lon bounds of specified locationId cell.

```js
UnlCore.bounds("u173zwbt3");
```

Returns a Bounds object:

```js
{
    sw: {
        lat: minLat,
        lon: minLon
    },
    ne: {
        lat: maxLat,
        lon: maxLon
    }
}
```

### `function gridLines(bounds: Bounds, precision?: number): Array<[[number, number], [number, number]]>`

Returns the vertical and horizontal lines that can be used to draw a UNL grid in the given bounds. Each line is represented by an array of two coordinates in the format: [[startLon, startLat], [endLon, endLat]].

```js
UnlCore.gridLines({
  sw: {
    lat: 52.369915397800824,
    lon: 4.88533463041897,
  },
  ne: {
    lat: 52.38788170348322,
    lon: 4.91476651006799,
  },
});
```

Returns an array of lines:

```js
[
   [[startLon, startLat], [endLon, endLat]]
   ...
]
```

### `adjacent(locationId: string, direction: Direction): string`

Determines adjacent cell in given direction.

```js
UnlCore.adjacent("ezzz@5", Direction.North);
```

Returns a string:

```
"gbpb@5"
```

### `neighbours(locationId: string): Neighbours`

Returns all 8 adjacent cells to specified locationId.

```js
UnlCore.neighbours("ezzz");
```

Returns a Neighbours object :

```js
{
    n: "gbpb",
    ne: "u000",
    e: "spbp",
    se: "spbn",
    s: "ezzy",
    sw: "ezzw",
    w: "ezzx",
    nw: "gbp8",
}
```

### `excludeElevation(locationIdWithElevation: string): LocationIdWithElevation`

Returns locationId and elevation properties. It is mainly used by internal functions.

```js
UnlCore.excludeElevation("6gkzwgjz@5");
```

Returns a LocationIdWithElevation object:

```js
{
    locationId: "6gkzwgjz",
    elevation: 5,
    elevationType: "floor",
}
```

### `appendElevation(locationIdWithoutElevation: string, elevation: number, elevationType: ElevationType): string`

Adds elevation chars and elevation. It is mainly used by internal functions.

```js
UnlCore.appendElevation("6gkzwgjz", 5);
```

Returns a string:

```
"6gkzwgjz@5"
```

## Note

To obtain neighbours as an array, you can use

    const neighboursObj = UnlCore.neighbours(locationId);
    const neighboursArr = Object.keys(neighboursObj).map(n => neighboursObj[n]);

The parent of a locationId is simply `locationId.slice(0, -1)`.

If you want the locationId converted from Base32 to Base4, you can e.g.:

    parseInt(UnlCore.encode(52.20, 0.12, 6), 32).toString(4);

## Upgrade to version 2.0 from version 1.0

In version 2.0 we renamed the concept of geohash to locationId. In order to upgrade from version 1.0 you need to:

- Import `UnlCore` instead of `Geohash` from `unl-core`
- Get `locationId` instead of `geohash` from the answer of methods which returned an object with `geohash` parameter
