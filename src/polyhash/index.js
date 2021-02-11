const unl = require("../core");
const turfBooleanContains = require("@turf/boolean-contains").default;
const turfBooleanOverlap = require("@turf/boolean-overlap").default;
const turfBooleanDisjoint = require("@turf/boolean-disjoint").default;
const turfIntersect = require("@turf/intersect").default;
const turfHelpers = require("@turf/helpers");
const turfMeta = require("@turf/meta");
const turfBboxPolygon = require("@turf/bbox-polygon").default;

const maxLocationIdPrecision = 16;

const encode = {
  '0': 0,  // 00000
  '1': 1,  // 00001
  '2': 2,  // 00010
  '3': 3,  // 00011
  '4': 4,  // 00100
  '5': 5,  // 00101
  '6': 6,  // 00110
  '7': 7,  // 00111
  '8': 8,  // 01000
  '9': 9,  // 01001
  'b': 10, // 01010
  'c': 11, // 01011
  'd': 12, // 01100
  'e': 13, // 01101
  'f': 14, // 01110
  'g': 15, // 01111
  'h': 16, // 10000
  'j': 17, // 10001
  'k': 18, // 10010
  'm': 19, // 10011
  'n': 20, // 10100
  'p': 21, // 10101
  'q': 22, // 10110
  'r': 23, // 10111
  's': 24, // 11000
  't': 25, // 11001
  'u': 26, // 11010
  'v': 27, // 11011
  'w': 28, // 11100
  'x': 29, // 11101
  'y': 30, // 11110
  'z': 31  // 11111
};
const decode = [
  '0',  // 00000
  '1',  // 00001
  '2',  // 00010
  '3',  // 00011
  '4',  // 00100
  '5',  // 00101
  '6',  // 00110
  '7',  // 00111
  '8',  // 01000
  '9',  // 01001
  'b', // 01010
  'c', // 01011
  'd', // 01100
  'e', // 01101
  'f', // 01110
  'g', // 01111
  'h', // 10000
  'j', // 10001
  'k', // 10010
  'm', // 10011
  'n', // 10100
  'p', // 10101
  'q', // 10110
  'r', // 10111
  's', // 11000
  't', // 11001
  'u', // 11010
  'v', // 11011
  'w', // 11100
  'x', // 11101
  'y', // 11110
  'z'  // 11111
];

/**
 * Converts an array of points into a polyhash, locationId-polygon
 *
 * @param {point[]} points
 * @param {int} locationIdPrecision
 */
function toPolyhash(points, locationIdPrecision = 9) {
  if (locationIdPrecision > maxLocationIdPrecision) {
    console.error(`Invalid locationId precision ${locationIdPrecision}. Maximum supported is ${maxLocationIdPrecision}`)
    return null
  }

  const polyhash = points.map(point => unl.encode(point[0], point[1], locationIdPrecision))
  return deflate(polyhash)
}

/**
 * Returns an array of coordinates, the polygon represented by the given polyhash
 *
 * @param {*} polyhash
 */
function toCoordinates(polyhash) {
  return inflate(polyhash).map(locationId => {
    const point = unl.decode(locationId);
    return [parseFloat(point.lon.toFixed(6)), parseFloat(point.lat.toFixed(6))]
  });
}

/**
 * Compress the given polyhash object
 *
 * @param {*} polyhash
 */
function compressPolyhash(polyhash) {
  const blockHeaderBitSize = 1;
  const blockPrecisionHeaderBitSize = 4;
  const charBitSize = 6;
  const requiredBits = Object.values(polyhash).map((block) => {
    // Block
    return (blockHeaderBitSize * block.data.length) + blockPrecisionHeaderBitSize + block.data.reduce((x, y) => {
      // Char
      return (x + (y.length * charBitSize))
    }, 0)
  }).reduce((a, b) => {
    return a + b
  }, 0)
  const arrayBuffer = new ArrayBuffer(Math.ceil(requiredBits / 8));
  const int8View = new Int8Array(arrayBuffer);

  let byteIndex = 0;
  let bitIndex = 0;

  function setNextBit(booleanValue) {
    int8View[byteIndex] = int8View[byteIndex] << 1;
    int8View[byteIndex] += booleanValue ? 1 : 0;
    bitIndex++;
    if (bitIndex === 8) {
      bitIndex = 0;
      byteIndex++;
    }
  }

  // For each block
  for (const polyHashBlock of polyhash) {
    // The first item in a block determines the precision of a block
    const polyHashBlockPrecision = polyHashBlock.precision
    // Set block header to 1 to flag a new block
    let blockHeader = 1;

    // for each locationId
    for (let locationId of polyHashBlock.data) {

      // Block header
      setNextBit(blockHeader)
      // Add block precision if this is the first block
      if (blockHeader) {
        // Block precision (max value 12, 4 bits)
        for (let j = 3; j >= 0; j--) {
          const result = polyHashBlockPrecision >> j;
          setNextBit(result & 1);
        }
        // Block header is 0 for the rest of the locationIds
        blockHeader = 0;
      }

      //for each character in the locationId
      for (let charIndex = 0; charIndex < locationId.length; charIndex++) {
        const character = locationId[charIndex];
        const value = encode[character];

        //set the terminator bit to 1 if it is the last character in the locationId
        setNextBit(charIndex === locationId.length - 1);

        //push the bits for this character value onto the buffer
        for (let j = 4; j >= 0; j--) {
          const result = value >> j;
          setNextBit(result & 1);
        }
      }
    }
  }

  //padd the end of the buffer with zeros
  const padding = 8 - requiredBits % 8;
  for (let i = 0; i < padding; i++) {
    setNextBit(false);
  }

  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return base64;
}

/**
 * Return the polyhash object represented by the compressed signature
 *
 * @param {*} compressedPolyhash
 */
function decompressPolyhash(compressedPolyhash) {
  const buffer = Buffer.from(compressedPolyhash, 'base64');

  const result = [];
  let locationId = [];
  let blockPrecision = 0
  let isTerminator = false;
  const blockPrecisionBitSize = 4;
  const charBitSize = 5;
  for (let bufferBitIndex = 0; bufferBitIndex < (buffer.length * 8) - 1; bufferBitIndex++) {
    // Read as a stream of bits, startwith MSB
    let byteIndex = Math.floor(bufferBitIndex / 8);
    let BytebitIndex = 7 - (bufferBitIndex % 8);

    // Read block header
    const isNewBlock = (buffer[byteIndex] & (1 << BytebitIndex)) != 0;
    if (isNewBlock) {

      // Read block precision
      blockPrecision = 0;
      for (let i = blockPrecisionBitSize - 1; i >= 0; i--) {
        bufferBitIndex++;
        byteIndex = Math.floor(bufferBitIndex / 8);
        BytebitIndex = 7 - (bufferBitIndex % 8);
        bit = (buffer[byteIndex] & (1 << BytebitIndex)) != 0
        blockPrecision |= bit << i;
      }

      // Blocks are grouped in arrays
      result.push({ precision: blockPrecision, data: [] })
    }

    // Read chars
    while (bufferBitIndex < (buffer.length * 8) - 1) {
      // Read char terminator
      bufferBitIndex++;
      byteIndex = Math.floor(bufferBitIndex / 8);
      BytebitIndex = 7 - (bufferBitIndex % 8);
      isTerminator = (buffer[byteIndex] & (1 << BytebitIndex)) != 0

      let encodedChar = 0
      for (let i = charBitSize - 1; i >= 0; i--) {
        bufferBitIndex++;
        byteIndex = Math.floor(bufferBitIndex / 8);
        BytebitIndex = 7 - (bufferBitIndex % 8);
        bit = (buffer[byteIndex] & (1 << BytebitIndex)) != 0
        encodedChar |= bit << i;
      }

      locationId.push(decode[encodedChar]);
      if (isTerminator) {
        result[result.length - 1].data.push(locationId.join(''));
        locationId = [];
        break;
      }
    }
  }
  return inflate(result);
}

/**
 * Helper function to convert GeoJSON or list of coordinates to turf polygon
 * @param {Object|list} inputPolygon input polygon
 * @returns {list} list of polygons
 */
function _toTurfPolygon(inputPolygon) {
    let polygons = []

  try {
    // If the polygon is a GeoJSON feature
    if (inputPolygon.features) {
      if (inputPolygon.features.length) {
          polygons.push(turfHelpers.polygon(
          inputPolygon.features[0].geometry.coordinates.map((arr) =>
            arr.map((coords) => [coords[1], coords[0]])
          )
          ));
      }
    }
    else if (inputPolygon.geometry && inputPolygon.geometry.type === "MultiPolygon") {
        const largestPolygon = inputPolygon.geometry.coordinates.forEach(coords => {
            polygons.push(turfHelpers.polygon(coords))
        }
    );

    }
    else if (inputPolygon.geometry && inputPolygon.geometry.type === "Polygon") {
        polygons.push(turfHelpers.polygon(inputPolygon.geometry.coordinates))
    }
    else {
      // Polygon is an array of points
        polygons.push(turfHelpers.polygon([inputPolygon]));
    }

  }
  catch (err) {
    console.error(`Failed to generate a polygon, reason: ${err}`);
    return null;
  }

  return polygons
}


/**
 * Convert the given polygon into a cluster of locationIds
 *
 * @param {*} polygon, Array of coordinates or GeoJSON polygon
 * @param {*} locationIdPrecision
 */
function toCluster(inputPolygon, locationIdPrecision) {

  const cellAlphabet = "bcdefghjkmnpqrstuvwxyz0123456789";
  const clusterCells = [];

  // Convert to turf polygon
  const polygons = _toTurfPolygon(inputPolygon);

  if (!polygons) {
    return null
  }

  polygons.forEach( polygon => {
  const queue = [[cellAlphabet.split(''), polygon]];

  // Breadth First Search
  while (queue.length) {

    if (!queue[0][0].length) {
      queue.shift()
      continue
    }

    // Pop the first cell in the queue
    const _cell = queue[0][0].shift()
    const _testPolygon = queue[0][1]
    // Convert to bounding box polygon
    const { n, e, s, w } = unl.bounds(_cell);
    const cellPolygon = turfBboxPolygon([w,s,e,n]);

    // Check if Cell and polygon are intersecting
    const intersection = _isIntersecting(_testPolygon, cellPolygon);

    if (intersection) {
      // If the cell is inside the polygon, there is no need to search subcells
      // or max precsion is reached
      if ((_cell.length === locationIdPrecision || _cell.length <= locationIdPrecision && _isInside(polygon, cellPolygon))) {
        clusterCells.push(_cell)
      }
      else {
        // First the intersection is calculated, returning points that represent intersection area
        const _newTestPolygon = _getIntesection(_testPolygon, cellPolygon)
        if (!_newTestPolygon) {
          continue
        }

        // Then convert intersection polygon points into locationIds
        const intersectionLocationIdsCells = turfMeta.coordAll(_newTestPolygon).map(x => unl.encode(x[1], x[0], locationIdPrecision))

        // Then get the locationId that bounds the intersection polygon
        // Done by getting the longest common prefix in all the locationIds
        const uniq = [...new Set(intersectionLocationIdsCells)].sort()
        const first = uniq[0];
        const last = uniq.pop();
        const length = first.length;
        let index = 0;
        while (index < length && first[index] === last[index]) {
          index++;
        }
        const boundingLocationIdCell = first.substring(0, index);

        // If the bounding cell size is larger (precision is lower) than the original cell
        // then ignore it and expand the current cell.
        const targetCell = boundingLocationIdCell.length < _cell.length ? _cell : boundingLocationIdCell

        // If the bounding cell reach the target precision, don't search subcells
        if (targetCell.length === locationIdPrecision) {
          continue
        }

        // Increment the search precision, by pushing all the possible locationId subcells and the intersection polygon
        const subcells = []
        for (const subcell of cellAlphabet) {
          subcells.push(`${targetCell}${subcell}`)
        }
        queue.push([subcells, _newTestPolygon])
      }
    }
  }
})
  const sortedClusterCells = clusterCells.sort(function (a, b) {
    // Sort string by length then alphabetically
    return a.length - b.length || a.localeCompare(b)
  })
  return deflate(sortedClusterCells);
}

/**
 * Convert a list of deflated locationIds into its full-length equivalent
 * @param {*} deflatedList
 */
function inflate(deflatedList) {
  const res = []
  let last = null

  for (const polyhash of deflatedList) {
    const precision = polyhash.precision
    const result = []

    for (const current of polyhash.data) {
      const locationId = !last ? current : last.slice(0, precision - current.length) + current;
      result.push(locationId);
      last = locationId;
    }

    for (const r of result) {
      res.push(r)
    }
  }
  return res
}

/**
 * Return a deflated list of locationIds
 *
 * @param {*} locationIds
 */
function deflate(locationIds) {
  return locationIds.reduce((result, current, currentIndex, values) => {
    const head = values[currentIndex - 1];

    // Ignore identical strings
    if (head && head === current) {
      return result;
    }

    let new_block = (!head || current.length != head.length)
    if (!head) {
      result.push({ precision: current.length, data: [current] });
    }
    else {
      let i = 0;
      while (i < Math.min(head.length, current.length) && head[i] === current[i]) {
        i++;
      }

      if (new_block) {
        result.push({ precision: current.length, data: [] })
        new_block = false;
      }

      result[result.length - 1].data.push(current.slice(i));
    }

    return result;
  }, []);
}

/**
 * Convert locationId array into polyhash, removes the common prefix and group them by precision
 * @param {*} locationIds
 */
function groupByPrefix(locationIds) {
  return locationIds.reduce((result, current, currentIndex, values) => {
    const head = values[currentIndex - 1];
    const new_block = (!head || current.length != head.length)

    if (!head || head === current) {
      result.push([current]);
    }
    else {
      let i = 0;

      while (i < Math.min(head.length, current.length) && head[i] === current[i]) {
        i++;
      }

      if (new_block) {
        result.push([current])
      } else {
        result[result.length - 1].push(current.slice(i));
      }
    }

    return result;
  }, []);
}

// Return true if polygon1 intersects polygon2
function _isIntersecting(polygon1, polygon2) {
  return !turfBooleanDisjoint(polygon1, polygon2)
}

// Return true of polygon2 is inside polygon1
function _isInside(polygon1, polygon2) {
  // turf overlap is a workaround due to a bug in turfBooleanContain, see https://github.com/Turfjs/turf/issues/1988
  // Note: turfBooleanOverlap slows downs clustering
  // TODO: Remove once https://github.com/Turfjs/turf/issues/1988 is fixed.
  return turfBooleanContains(polygon1, polygon2) && !turfBooleanOverlap(polygon1, polygon2);
}

// Return intersection area of two polygons
function _getIntesection(polygon1, polygon2) {
  return turfIntersect(polygon1, polygon2);
}

// Exports
module.exports = {
  toPolyhash,
  toCoordinates,
  compressPolyhash,
  decompressPolyhash,
  toCluster,
  inflate,
  deflate,
  groupByPrefix
}
