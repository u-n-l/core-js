# Polyhash

Encoding geographical areas as locationId based polygons. These polygons are far more space efficient than latitude-longitude polygons.

## API

### `toCoordinates`(geometry, precision)

Converts coordindates, locationIds, GeoJSON polygon or stringId to a list of coordinates
The list of coordinates is flattened.

```js
const locationIds = ["tester", "testsp", "testsj", "testek", "tester"];

const coordinates = tolocationIds(locationIds, 9);

/*
  coordinates = [[73.976,20.6955],[74.009,20.6955],[74.009,20.6845],[73.976,20.679],[73.976,20.6955]]
*/
```

### `toLocationIds`(geometry, precision)

Converts coordindates, locationIds, GeoJSON polygon or stringId to a list of locationIds

```js
const coordinates = [
  [ 20.6955, 73.976 ], // tester
  [ 20.6955, 74.009 ], // testsp
  [ 20.6845, 74.009 ], // testsj
  [ 20.679, 73.976 ],  // testek
  [ 20.6955, 73.976 ]  // tester
];

const locationIds = tolocationIds(coordinates, 9);

/*
  locationIds = ["umnsyfyj2", "umntnbyj8", "umntn8vvx", "umnsydcvr", "umnsyfyj2"]
*/
```

### `toPolyhash`(geometry, precision)

Converts coordindates, locationIds, GeoJSON polygon or stringId to a compressed string

```js
const coordinates = [
  [ 20.6955, 73.976 ], // tester
  [ 20.6955, 74.009 ], // testsp
  [ 20.6845, 74.009 ], // testsj
  [ 20.679, 73.976 ],  // testek
  [ 20.6955, 73.976 ]  // tester
];

const polyhash = toPolyhash(coordinates, 9);

/*
  polyhash = "y0mow8c8jEZUKeRoENt+mHjC29xzyMQ="
*/
```

### `toCluster`(geometry, precision)

Fill a geometry with a cluster of locationIds. The geometry must be a closed polygon and can be in the form of coordindates, locationIds, GeoJSON polygon or stringId.

```js
const coordinates = [
  [ 20.6955, 73.976 ], // tester
  [ 20.6955, 74.009 ], // testsp
  [ 20.6845, 74.009 ], // testsj
  [ 20.679, 73.976 ],  // testek
  [ 20.6955, 73.976 ]  // tester

const cluster = toCluster(coordinates, 6);

/*
cluster = ["umnsyd","umnsye","umnsyf","umnsyg","umnsys","umnsyt","umnsyu","umnsyv","umnsyw","umnsyx","umnsyy","umnsyz","umntn8","umntnb"]
*/
```

Passing GeoJson polygon

```js
    const polygon = {
      type: "FeatureCollection",
      features: [
        {
          id: "46c5c3d3204d8afa8897daeffe91ebc9",
          type: "Feature",
          properties: {},
          geometry: {
            coordinates: [
              [
                [42.9252986, -72.2794631],
                [42.9251827, -72.2794363],
                [42.9252043, -72.2790635],
                [42.9248076, -72.2789964],
                [42.9248272, -72.2788462],
                [42.9251297, -72.2788945],
                [42.9251572, -72.2784975],
                [42.9252691, -72.2785324],
                [42.9252416, -72.2788891],
                [42.9253595, -72.278924],
                [42.9253575, -72.2790098],
                [42.9253261, -72.2790071],
                [42.9252986, -72.2794631],
              ],
            ],
            type: "Polygon",
          },
        },
      ],
    };

const cluster = toCluster(polygon, 6);

/*
cluster = ["testek","testem","testeq","tester","testes","testet","testev","testew","testex","testey","testez","testesj","testen","testep"]
*/
```

### `compress`(locationIds)

Compress a polyhash and return in base64 format.

```js
const polyhash = ['tester','testsp','testsj','testek','tester'];
const compressed = compress(locationIds);

/*
  compressed = 'ZNYZN3Y1xNyA'
*/
```

### `decompress`(stringId)

Decompress a polyhash.

```js
const compressedPolyhash = 'ZNYZN3Y1xNyA';
const polyhash = decompress(compressedPolyhash);

/*
  polyhash = ['tester','testsp','testsj','testek']
*/
```

### `toCoordinates`(polyhash)

Convert a polyhash back into coordinates.

```js
const polyhash = ['tester','testsp','testsj','testek','tester'];
const points = toCoordinates(polyhash);

/*
coordinates = [
  [ 20.6955, 73.976 ],
  [ 20.6955, 74.009 ],
  [ 20.6845, 74.009 ],
  [ 20.679,  73.976 ],
  [ 20.6955, 73.976 ]
]
*/
```

### `inflate`(polyhash)

Convert a polyhash to full locationIds

```js
const polyhash = [['tester','sp','j','ek','er'], ['ab12', '34' ]];
const locationIds = inflate(polyhash);

/*
locationIds = [
  'tester',
  'testsp',
  'testsj',
  'testek',
  'tester',
  'ab12',
  'ab34'
]
*/
```

### `deflate`(locationIds)

Convert an array of locationIds to polyhash, used internally for binary compression

```js
const locationIds = ['drsv', 'drtjb', 'drtj8', 'drtj2', 'drtj0'];
const polyhash = deflate(locationIds);

/*
polyhash = [
      { precision: 4, data: ['drsv'] },
      { precision: 5, data: ['tjb', '8', '2', '0'] }
    ];
*/
```

### groupByPrefix(locationIds)

Convert an array of locationIds to polyhash

```js
const locationIds = ['drsv', 'drtjb', 'drtj8', 'drtj2', 'drtj0'];
const polyhash = groupByPrefix(locationIds);

/*
polyhash = [['drsv'], ['drtjb', '8', '2', '0']];
*/
```

## Compresseion

List of locationIds are grouped into blocks by precision. For each locationId block


LocationId is encoded in base 32, therefore we only require 5 bits to encode each character.

```
locationId:     t    e    s    t    s
bits:        1100101101110001100111000
```

A terminator bit is prefixed to each 5 bit sequence to indicate whether this is that last character in the locationId.

```
locationId:        t       e       s       t       s
bits:        [0]11001[0]01101[0]11000[0]11001[1]11000
```

A block flag bit is prefixed to each locationId to indicate if this is a new block of locationId. A block is a list of locationIds grouped by precision

```
locationId:         t     e     s     t     s
bits:        [1]011001001101011000011001111000
```

If the block header is 1, a 4 bit block precision header is prefixed to store the precision the locationIds
In this example `tests` length is 5, so the block precision is 5 `0101`

```
locationId:             t     e     s     t     s
bits:        1[0101]011001001101011000011001111000
```

Then a padding is applied to the end of the sequence to complete the final byte.

```
locationId:           t     e     s     t     s
bits:        10101011001001101011000011001111000[00]
```

The final structure looks like this:

```
|--------+-----------+------------+-------+------------+-------+------------+-------+------------+-------+------------+-------+---------|
| Block  | Block     | Char       |   't' | Char       |   'e' | Char       |   's' | Char       |   't' | Char       |   's' |         |
| header | precision | terminator |       | terminator |       | terminator |       | terminator |       | terminator |       | padding |
|--------+-----------+------------+-------+------------+-------+------------+-------+------------+-------+------------+-------+---------|
| 1      | 0101      | 0          | 11001 | 0          | 01101 | 0          | 11000 | 0          | 11001 | 1          | 11000 |   00    |
|--------+-----------+------------+-------+------------+-------+------------+-------+------------+-------+------------+-------+---------|
```



