const chai = require('chai');
const libPolyhash = require('../src/polyhash');
const expect = chai.expect;

describe('Deflate', function () {
  it('deflate() should remove common prefixes and group locationIds by precision', function () {
    const locationIdList = ['drsv', 'drtjb', 'drtj8', 'drtj2', 'drtj0']
    const polyhashList = libPolyhash.deflate(locationIdList);
    expect(polyhashList).to.eql([
      { precision: 4, data: ['drsv'] },
      { precision: 5, data: ['tjb', '8', '2', '0'] }
    ]);
  });
});

describe('groupByPrefix', function () {
  it('groupByPrefix() should remove common prefixes and group locationIds by precision', function () {
    const locationIdList = ['drsv', 'drtjb', 'drtj8', 'drtj2', 'drtj0']
    const polyhashList = libPolyhash.groupByPrefix(locationIdList);
    expect(polyhashList).to.eql([['drsv'], ['drtjb', '8', '2', '0']])
  });
});

describe('inflate', function () {
  it('inflate() should convert polyhash to a full locationId', function () {
    const polyhashList = [{ precision: 4, data: ['drsv'] }, { precision: 5, data: ['tjb', '8', '2', '0'] }]
    const locationIdList = libPolyhash.inflate(polyhashList);
    expect(locationIdList).to.eql(['drsv', 'drtjb', 'drtj8', 'drtj2', 'drtj0']);
  });
});

describe('Block header test', function () {
  it('Test block header', function () {
    const polyhash = [{ precision: 2, data: ['m9'] }, { precision: 1, data: ['m'] }]
    const compressed = libPolyhash.compressPolyhash(polyhash);
    const buffer = Buffer.from(compressed, 'base64');
    const binarydata = buffer.readUInt32BE()
    // First block header is located at bit 0, expected to be set
    expect((binarydata & (1 << (31 - 0))) != 0).to.be.true
    // Next block header is located after block count [4] and 2 chars [2*6] = 16
    expect((binarydata & (1 << (31 - 16))) != 0).to.be.true
  });
});

describe('LocationId char terminator', function () {
  it('Test locationId char terminator', function () {
    const polyhash = [{ precision: 2, data: ['m9'] }]
    const compressed = libPolyhash.compressPolyhash(polyhash);
    const buffer = Buffer.from(compressed, 'base64');
    // First char tarminator for 'm' bit is located after block header [1] and block count [4] at position 5
    // expected to be unset
    const binarydata = buffer.readUInt16BE()
    expect((binarydata & (1 << (15 - 5))) == 0).to.be.true
    // Next char terminator for '9' is located after 1 char [5] = 11
    expect((binarydata & (1 << (15 - 11))) != 0).to.be.true
  });
});

describe('Precision Limit', function () {
  it('Should return null if precision is bigger than 16', function () {

    const polyHash = libPolyhash.toPolyhash([], 19);
    expect(polyHash).to.eql(null);

    const cluster = libPolyhash.toCluster([], 19);
    expect(cluster).to.eql(null);

  });
});

describe('toPolyhash', function () {
  it('Convert coordinates to a polyhash', function () {
    const coords = [
      [42.9252986, -72.2794631],
      [42.9251827, -72.2794363],
      [42.9252043, -72.2790635],
      [42.9248076, -72.2789964],
      [42.9248272, -72.2788462],
      [42.9251297, -72.2788945],
      [42.9251572, -72.2784975],
      [42.9252691, -72.2785324],
      [42.9252416, -72.2788891],
      [42.9253595, -72.2789240],
      [42.9253575, -72.2790098],
      [42.9253261, -72.2790071],
      [42.9252986, -72.2794631]
    ]
    const polyHash = libPolyhash.toPolyhash(coords, 9);

    expected = ['drss5nr9y', 'drss5nr9r', 'drss5nrcr', 'drss5q0p1',
      'drss5q0ph', 'drss5q215', 'drss5q23h', 'drss5q23u', 'drss5q21e',
      'drss5q246', 'drss5q243', 'drss5q241', 'drss5nr9y']

    expect(libPolyhash.inflate(polyHash)).to.eql(expected);
  });
});

describe("toCluster", function () {
  it('Convert coordinates to a cluster', function () {
    const coords = [
      [42.9252986, -72.2794631],
      [42.9251827, -72.2794363],
      [42.9252043, -72.2790635],
      [42.9248076, -72.2789964],
      [42.9248272, -72.2788462],
      [42.9251297, -72.2788945],
      [42.9251572, -72.2784975],
      [42.9252691, -72.2785324],
      [42.9252416, -72.2788891],
      [42.9253595, -72.2789240],
      [42.9253575, -72.2790098],
      [42.9253261, -72.2790071],
      [42.9252986, -72.2794631]
    ]

    const cluster = libPolyhash.toCluster(coords, 8);
    expected = ["drss5nr9", "drss5nrc", "drss5nrd", 
      "drss5nrf", "drss5q0p", "drss5q20", "drss5q21", 
      "drss5q23", "drss5q24"]
    expect(libPolyhash.inflate(cluster)).to.eql(expected);
  });
});

describe('toCluster Tiny Area High Precision', function () {
  it('Convert coordinates to a cluster', function () {
    const coords = [
      [4.8983333, 52.3718141],
      [4.8983333, 52.3718116],
      [4.8983379, 52.3718116],
      [4.8983379, 52.3718141],
      [4.8983333, 52.3718141]
    ]

    expect(libPolyhash.inflate(libPolyhash.toCluster(coords, 9)).length).to.be.lessThan(1);
    expect(libPolyhash.inflate(libPolyhash.toCluster(coords, 13)).length).to.be.greaterThan(1300);
  });
});

describe('compress', function () {
  it('Return a compresed polyhash in base64 format', function () {
    const polyhashList = libPolyhash.deflate(['d', 'dr'])
    /*
      |--------+--------+----------+------+-------+--------+-----------+------+-------+---------|
      |        | block  |    block | char | char  | block  |     block | char | char  | padding |
      | Header | header | prcision | term |       | header | precision | term |       |         |
      |--------+--------+----------+------+-------+--------+-----------+------+-------+---------|
      | Value  | True   |        1 | True | 'd'   | True   |         2 | True | 'r'   |         |
      |--------+--------+----------+------+-------+--------+-----------+------+-------+---------|
      | Binary | 1      |     0001 | 1    | 01100 | 1      |      0010 | 1    | 10111 |      00 |
      |--------+--------+----------+------+-------+--------+-----------+------+-------+---------|

      Base64
      |--------+--------+--------+--------|
      |      j |      Z |      L |      c |
      |--------+--------+--------+--------|
      | 100011 | 011001 | 001011 | 011100 |
      |--------+--------+--------+--------|
      */

    const base64CompressedPolyhash = libPolyhash.compressPolyhash(polyhashList);
    expect(base64CompressedPolyhash).to.eql("jZLc");
  });
});

describe('decompress', function () {
  it('Return a compresed polyhash in base64 format', function () {
    const decompressed = libPolyhash.decompressPolyhash("jZLc")
    expect(['d', 'dr']).to.eql(decompressed);
  });
});

describe('compress and decompress - plain locationIds', function () {
  it('compress then decompress should return the original input', function () {
    const locationIdList = ['drsv', 'drtjb', 'drtj8', 'drtj2', 'drtj0']

    const compressed = libPolyhash.compressPolyhash(libPolyhash.deflate(locationIdList));
    const decompressed = libPolyhash.decompressPolyhash(compressed)
    expect(locationIdList).to.eql(decompressed);
  });
});

describe('compress and decompress - coords', function () {
  it('compress then decompress should return the original input', function () {
    const coords = [
      [42.9252986, -72.2794631],
      [42.9251827, -72.2794363],
      [42.9252043, -72.2790635],
      [42.9248076, -72.2789964],
      [42.9248272, -72.2788462],
      [42.9251297, -72.2788945],
      [42.9251572, -72.2784975],
      [42.9252691, -72.2785324],
      [42.9252416, -72.2788891],
      [42.9253595, -72.2789240],
      [42.9253575, -72.2790098],
      [42.9253261, -72.2790071],
      [42.9252986, -72.2794631]
    ]
    const cluster = libPolyhash.toCluster(coords, 9);
    const compressedCluster = libPolyhash.compressPolyhash(cluster);
    const decompressedCluster = libPolyhash.decompressPolyhash(compressedCluster);
    expect(libPolyhash.inflate(cluster)).to.eql(decompressedCluster);
  });
});


describe('compress and decompress - very large area', function () {
  it('compress then decompress should return the original input', function () {
    const coords = [
      [54.140625, 34.3071439],
      [-18.984375, 34.8859309],
      [-18.984375, -36.0313318],
      [54.84375, -36.0313318],
      [54.140625, 34.3071439]
    ];
    const cluster = libPolyhash.toCluster(coords, 5);
    const compressedCluster = libPolyhash.compressPolyhash(cluster);
    const decompressedCluster = libPolyhash.decompressPolyhash(compressedCluster);
    expect(libPolyhash.inflate(cluster)).to.eql(decompressedCluster);
  });
});


describe('toCluster polygon with an empty space in the middle ', function () {
  it('compress then decompress should return the original input', function () {
    const feature = { "type": "FeatureCollection", "features": [ { "id": "46c5c3d3204d8afa8897daeffe91ebc9", "type": "Feature", "properties": {}, "geometry": { "coordinates": [ [ [ 24.709158754793236, 46.77376085206123 ], [ 24.711213562504298, 46.77260731634826 ], [ 24.707912396016837, 46.772722671031545 ], [ 24.709158754793236, 46.77376085206123 ] ], [ [ 24.709158754793236, 46.773414793941726 ], [ 24.70865347420778, 46.773091804357335 ], [ 24.70952929388872, 46.77302259205115 ], [ 24.709158754793236, 46.773414793941726 ] ] ], "type": "Polygon" } } ]}
    const cluster = libPolyhash.toCluster(feature, 10);
    const compressedCluster = libPolyhash.compressPolyhash(cluster);
    const decompressedCluster = libPolyhash.decompressPolyhash(compressedCluster);
    expect(libPolyhash.inflate(cluster)).to.eql(decompressedCluster);
  });
});


describe("toCluster polygon and toCluster coords comparision", function () {
  it("Clustering a polygon represented as a list coords or a polygon object should return the same cluster", function () {

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

    // Array of points representing the same geometry
    const coords = [
      [-72.2794631, 42.9252986],
      [-72.2794363, 42.9251827],
      [-72.2790635, 42.9252043],
      [-72.2789964, 42.9248076],
      [-72.2788462, 42.9248272],
      [-72.2788945, 42.9251297],
      [-72.2784975, 42.9251572],
      [-72.2785324, 42.9252691],
      [-72.2788891, 42.9252416],
      [-72.278924, 42.9253595],
      [-72.2790098, 42.9253575],
      [-72.2790071, 42.9253261],
      [-72.2794631, 42.9252986],
    ];

    const clusterFromPoly = libPolyhash.toCluster(polygon, 12);
    const clusterFromCoords = libPolyhash.toCluster(coords, 12);
    const compressedclusterFromPoly = libPolyhash.compressPolyhash(
      clusterFromPoly
    );
    const compressedclusterFromCoords = libPolyhash.compressPolyhash(
      clusterFromCoords
    );
    expect(compressedclusterFromPoly).to.eql(compressedclusterFromCoords);
  });
});


