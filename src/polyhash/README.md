# Polyhash

Encoding geographical areas as locationId based polygons. These polygons are far more space efficient than latitude-longitude polygons.

## API

### toPolyhash(points, precision)

Converts an array of LatLng coordinates to a locationId trie.

```js
const coordinates = [
  [ 20.6955, 73.976 ], // tester
  [ 20.6955, 74.009 ], // testsp
  [ 20.6845, 74.009 ], // testsj
  [ 20.679, 73.976 ],  // testek
  [ 20.6955, 73.976 ]  // tester
];

const polyhash = toPolyhash(coordinates);

/*
  polyhash = [{precision:6, data:['tester','sp','j','ek','er']}]
*/
```

### toCluster(points, precision)

Convert a polygon to a cluster of locationIds

```js
const coordinates = [
  [ 20.6955, 73.976 ], // tester
  [ 20.6955, 74.009 ], // testsp
  [ 20.6845, 74.009 ], // testsj
  [ 20.679, 73.976 ],  // testek
  [ 20.6955, 73.976 ]  // tester

const cluster = toCluster(polyhash, 6);

/*
cluster = [{precision:6, data:["testek","m","q","r","s","t","v","w","x","y","z","sj","n","p"]}]
*/
```

### compressPolyhash(polyhash)

Compress a polyhash and return in base64 format.

```js
const polyhash = ['tester','sp','j','ek','er'];
const compressed = compressPolyhash(polyhash);

/*
  compressed = 'ZNYZN3Y1xNyA'
*/
```

### decompressPolyhash(compressedPolyhash)

Decompress a polyhash.

```js
const compressedPolyhash = 'ZNYZN3Y1xNyA';
const polyhash = decompressPolyhash(compressedPolyhash);

/*
  polyhash = ['tester','sp','j','ek']
*/
```

### toCoordinates(polyhash)

Convert a polyhash back into coordinates.

```js
const polyhash = ['tester','sp','j','ek','er'];
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

### inflate(polyhash)

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

### deflate(locationIds)

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



