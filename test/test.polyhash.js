const chai = require("chai");
const libPolyhash = require("../src/polyhash");
const expect = chai.expect;

describe("Polyhash", function () {
  it("deflate() should remove common prefixes and group locationIds by precision", function () {
    const locationIdList = ["drsv", "drtjb", "drtj8", "drtj2", "drtj0"];
    const polyhashList = libPolyhash.deflate(locationIdList);
    expect(polyhashList).to.eql([
      { precision: 4, data: ["drsv"] },
      { precision: 5, data: ["tjb", "8", "2", "0"] },
    ]);
  });

  it("groupByPrefix() should remove common prefixes and group locationIds by precision", function () {
    const locationIdList = ["drsv", "drtjb", "drtj8", "drtj2", "drtj0"];
    const polyhashList = libPolyhash.groupByPrefix(locationIdList);
    expect(polyhashList).to.eql([["drsv"], ["drtjb", "8", "2", "0"]]);
  });

  it("inflate() should convert polyhash to a full locationId", function () {
    const polyhashList = [
      { precision: 4, data: ["drsv"] },
      { precision: 5, data: ["tjb", "8", "2", "0"] },
    ];
    const locationIdList = libPolyhash.inflate(polyhashList);
    expect(locationIdList).to.eql(["drsv", "drtjb", "drtj8", "drtj2", "drtj0"]);
  });

  it("Block header", function () {
    const polyhash = ["m9", "mmm"];
    const compressed = libPolyhash.compress(polyhash);
    const buffer = Buffer.from(compressed, "base64");
    const binarydata = buffer.readUInt32BE();
    // First block header is located at bit 0, expected to be set
    expect((binarydata & (1 << (31 - 0))) != 0).to.be.true;
    // Next block header is located after block count [4] and 2 chars [2*6] = 16
    expect((binarydata & (1 << (31 - 16))) != 0).to.be.true;
  });

  it("LocationId char terminator", function () {
    const polyhash = ["m9"];
    const compressed = libPolyhash.compress(polyhash);
    const buffer = Buffer.from(compressed, "base64");
    // First char tarminator for 'm' bit is located after block header [1] and block count [4] at position 5
    // expected to be unset
    const binarydata = buffer.readUInt16BE();
    expect((binarydata & (1 << (15 - 5))) === 0).to.be.true;
    // Next char terminator for '9' is located after 1 char [5] = 11
    expect((binarydata & (1 << (15 - 11))) != 0).to.be.true;
  });

  it("precision Limit: Should return null if precision is bigger than 16", function () {
    const polyHash = libPolyhash.toPolyhash([], 19);
    expect(polyHash).to.eql(null);
  });

  it("toCoordinates(list of coords) should convert list of coordinates to a list of coordinates", function () {
    const coords = [
      [42.9252986, -72.2794631],
      [42.9251827, -72.2794363],
      [42.9252043, -72.2790635],
      [42.9248076, -72.2789964],
    ];
    const output = libPolyhash.toCoordinates(coords);
    expect(coords).to.eql(output);
  });

  it("toCoordinates(list of locationIds) should convert list of location Ids to a list of coordinates", function () {
    const locationIdList = ["drsv", "drtjb", "drtj8", "drtj2", "drtj0"];
    const expected = [
      [-71.89, 43.15],
      [-71.697, 43.22],
      [-71.697, 43.176],
      [-71.697, 43.132],
      [-71.697, 43.088],
    ];

    const coords = libPolyhash.toCoordinates(locationIdList);
    expect(coords).to.eql(expected);
  });

  it("toCoordinates(stringId) should convert a compressed stringId to a list of coordinates", function () {
    const stringId = "ygeowUWWj67K9jgCsheAEDoLg1AfAqUaIWWj6A==";
    const expected = [
      [42.925279, -72.27946],
      [42.925193, -72.279418],
      [42.925193, -72.279074],
      [42.924807, -72.278988],
      [42.924807, -72.27886],
      [42.92515, -72.278903],
      [42.92515, -72.278516],
      [42.925279, -72.278516],
      [42.925236, -72.278903],
      [42.925365, -72.278945],
      [42.925365, -72.278988],
      [42.925322, -72.278988],
      [42.925279, -72.27946],
    ];

    const output = libPolyhash.toCoordinates(stringId);
    expect(output).to.eql(expected);
  });

  it("toLocationIds(list of locationId) should convert list of locationId to a list of locationId", function () {
    const locationIds = ["drsv", "drtjb", "drtj8", "drtj2", "drtj0"];
    const output = libPolyhash.toLocationIds(locationIds);
    expect(locationIds).to.eql(output);
  });

  it("toLocationIds(list of coords) should convert list of coords to a list of locationId", function () {
    const coords = [
      [42.9252986, -72.2794631],
      [42.9251827, -72.2794363],
      [42.9252043, -72.2790635],
      [42.9248076, -72.2789964],
    ];
    const expected = ["hgnsbcc", "hgnsbcc", "hgnsbcc", "hgnsbf0"];
    const locationIds = libPolyhash.toLocationIds(coords, 7);
    expect(expected).to.eql(locationIds);
  });

  it("toLocationIds(stringId) should convert a compressed stringId to a list of coordinates", function () {
    const stringId = "ygeowUWWj67K9jgCsheAEDoLg1AfAqUaIWWj6A==";
    const expected = [
      "hgnsbcc",
      "hgnsbcc",
      "hgnsbcc",
      "hgnsbf0",
      "hgnsbf0",
      "hgnsbf1",
      "hgnsbf1",
      "hgnsbf1",
      "hgnsbf1",
      "hgnsbf1",
      "hgnsbf1",
      "hgnsbf1",
      "hgnsbcc",
    ];

    const locationIdList = libPolyhash.toLocationIds(stringId, 7);
    expect(locationIdList).to.eql(expected);
  });

  it("toPolyhash(list of locationId) should convert list of locationId to a polyhash", function () {
    const locationIds = ["drsv", "drtjb", "drtj8", "drtj2", "drtj0"];
    const expected = "oYux3VlGpQiQAA==";
    const polyhash = libPolyhash.toPolyhash(locationIds);
    expect(expected).to.eql(polyhash);
  });

  it("toPolyhash(list of coords) should convert list of coords to a polyhash", function () {
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
      [42.9253595, -72.278924],
      [42.9253575, -72.2790098],
      [42.9253261, -72.2790071],
      [42.9252986, -72.2794631],
    ];
    const polyHash = libPolyhash.toPolyhash(coords, 9);
    const expected = "ygeowUWWj67K9jgCsheAEDoLg1AfAqUaIWWj6A==";
    expect(polyHash).to.eql(expected);
  });

  it("toPolyhash(polygon) should convert a polygon to a polyhash", function () {
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
                [24.709158754793236, 46.77376085206123],
                [24.711213562504298, 46.77260731634826],
                [24.707912396016837, 46.772722671031545],
                [24.709158754793236, 46.77376085206123],
              ],
              [
                [24.709158754793236, 46.773414793941726],
                [24.70865347420778, 46.773091804357335],
                [24.70952929388872, 46.77302259205115],
                [24.709158754793236, 46.773414793941726],
              ],
            ],
            type: "Polygon",
          },
        },
      ],
    };

    const expected = "y0QGYIMUx2MUxCOvVBimOxnYOEVyM7A=";
    const polyhash = libPolyhash.toPolyhash(polygon);
    expect(polyhash).to.eql(expected);
  });

  it("toCluster(list of locationId) should convert list of locationId to a cluster", function () {
    const locationIds = [
      "hgnsbccjx",
      "hgnsbccjv",
      "hgnsbccpv",
      "hgnsbf0bk",
      "hgnsbf0ch",
      "hgnsbf10u",
      "hgnsbf15h",
      "hgnsbf15p",
      "hgnsbf10y",
      "hgnsbf129",
      "hgnsbf123",
      "hgnsbf122",
      "hgnsbccjx",
    ];
    const expected = [
      "hgnsbccjv",
      "hgnsbccjw",
      "hgnsbccjx",
      "hgnsbccjy",
      "hgnsbccjz",
      "hgnsbccnj",
      "hgnsbccnm",
      "hgnsbccnn",
      "hgnsbccnp",
      "hgnsbccnq",
      "hgnsbccnr",
      "hgnsbccnt",
      "hgnsbccnv",
      "hgnsbccnw",
      "hgnsbccnx",
      "hgnsbccny",
      "hgnsbccnz",
      "hgnsbccpg",
      "hgnsbccpj",
      "hgnsbccpm",
      "hgnsbccpn",
      "hgnsbccpp",
      "hgnsbccpq",
      "hgnsbccpr",
      "hgnsbccpt",
      "hgnsbccpu",
      "hgnsbccpv",
      "hgnsbccpw",
      "hgnsbccpx",
      "hgnsbccpy",
      "hgnsbccpz",
      "hgnsbccr0",
      "hgnsbccr2",
      "hgnsbccr8",
      "hgnsbccrb",
      "hgnsbf0bk",
      "hgnsbf0bm",
      "hgnsbf0bn",
      "hgnsbf0bp",
      "hgnsbf0bq",
      "hgnsbf0br",
      "hgnsbf0bs",
      "hgnsbf0bt",
      "hgnsbf0bu",
      "hgnsbf0bv",
      "hgnsbf0bw",
      "hgnsbf0bx",
      "hgnsbf0by",
      "hgnsbf0bz",
      "hgnsbf0ch",
      "hgnsbf0cj",
      "hgnsbf0cn",
      "hgnsbf0cp",
      "hgnsbf100",
      "hgnsbf101",
      "hgnsbf102",
      "hgnsbf103",
      "hgnsbf104",
      "hgnsbf105",
      "hgnsbf106",
      "hgnsbf107",
      "hgnsbf108",
      "hgnsbf109",
      "hgnsbf10b",
      "hgnsbf10c",
      "hgnsbf10d",
      "hgnsbf10e",
      "hgnsbf10f",
      "hgnsbf10g",
      "hgnsbf10h",
      "hgnsbf10j",
      "hgnsbf10k",
      "hgnsbf10m",
      "hgnsbf10n",
      "hgnsbf10p",
      "hgnsbf10q",
      "hgnsbf10r",
      "hgnsbf10s",
      "hgnsbf10t",
      "hgnsbf10u",
      "hgnsbf10v",
      "hgnsbf10w",
      "hgnsbf10x",
      "hgnsbf10y",
      "hgnsbf10z",
      "hgnsbf110",
      "hgnsbf11h",
      "hgnsbf11j",
      "hgnsbf11k",
      "hgnsbf11m",
      "hgnsbf11n",
      "hgnsbf11q",
      "hgnsbf11s",
      "hgnsbf11t",
      "hgnsbf11u",
      "hgnsbf11v",
      "hgnsbf11w",
      "hgnsbf11y",
      "hgnsbf120",
      "hgnsbf122",
      "hgnsbf123",
      "hgnsbf128",
      "hgnsbf129",
      "hgnsbf14h",
      "hgnsbf14j",
      "hgnsbf14k",
      "hgnsbf14m",
      "hgnsbf14n",
      "hgnsbf14p",
      "hgnsbf14q",
      "hgnsbf14r",
      "hgnsbf14s",
      "hgnsbf14t",
      "hgnsbf14u",
      "hgnsbf14v",
      "hgnsbf14w",
      "hgnsbf14x",
      "hgnsbf14y",
      "hgnsbf14z",
      "hgnsbf15h",
      "hgnsbf15j",
      "hgnsbf15n",
      "hgnsbf15p",
    ];
    const cluster = libPolyhash.toCluster(locationIds, 9);
    expect(expected).to.eql(cluster);
  });

  it("toCluster(list of coords) should convert list of coords to a polyhash", function () {
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
      [42.9253595, -72.278924],
      [42.9253575, -72.2790098],
      [42.9253261, -72.2790071],
      [42.9252986, -72.2794631],
    ];

    const cluster = libPolyhash.toCluster(coords, 8);
    const expected = [
      "hgnsbccj",
      "hgnsbccm",
      "hgnsbccn",
      "hgnsbccp",
      "hgnsbccq",
      "hgnsbccr",
      "hgnsbf0b",
      "hgnsbf0c",
      "hgnsbf10",
      "hgnsbf11",
      "hgnsbf12",
      "hgnsbf14",
      "hgnsbf15",
    ];
    expect(cluster).to.eql(expected);
  });

  it("toCluster(polygon) should convert a polygon to a cluster", function () {
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
                [24.709158754793236, 46.77376085206123],
                [24.711213562504298, 46.77260731634826],
                [24.707912396016837, 46.772722671031545],
                [24.709158754793236, 46.77376085206123],
              ],
              [
                [24.709158754793236, 46.773414793941726],
                [24.70865347420778, 46.773091804357335],
                [24.70952929388872, 46.77302259205115],
                [24.709158754793236, 46.773414793941726],
              ],
            ],
            type: "Polygon",
          },
        },
      ],
    };

    const expected = [
      "th3k83fy",
      "th3k83fz",
      "th3k83gp",
      "th3k864b",
      "th3k864c",
      "th3k864f",
      "th3k864g",
      "th3k864u",
      "th3k864v",
      "th3k864y",
      "th3k864z",
      "th3k8650",
      "th3k8651",
      "th3k8653",
      "th3k8654",
      "th3k8655",
      "th3k8656",
      "th3k8657",
      "th3k865h",
      "th3k865j",
      "th3k865k",
      "th3k865m",
      "th3k865n",
      "th3k865p",
      "th3k865q",
      "th3k865r",
      "th3k865s",
      "th3k865t",
      "th3k865w",
      "th3k866b",
      "th3k866c",
      "th3k866f",
      "th3k866g",
      "th3k866u",
      "th3k866v",
      "th3k866y",
      "th3k866z",
      "th3k8670",
      "th3k8671",
      "th3k8672",
      "th3k8673",
      "th3k8674",
      "th3k8675",
      "th3k8676",
      "th3k867h",
      "th3k867j",
      "th3k867n",
      "th3k86db",
      "th3k86dc",
    ];
    const cluster = libPolyhash.toCluster(polygon, 8);
    expect(cluster).to.eql(expected);
  });

  it("toCluster Tiny Area High Precision: Convert coordinates to a cluster", function () {
    const coords = [
      [4.8983333, 52.3718141],
      [4.8983333, 52.3718116],
      [4.8983379, 52.3718116],
      [4.8983379, 52.3718141],
      [4.8983333, 52.3718141],
    ];

    expect(libPolyhash.toCluster(coords, 9)).length.to.be.lessThan(1);
    expect(libPolyhash.toCluster(coords, 13).length).to.be.greaterThan(1300);
  });

  it("compress: Return a compresed polyhash in base64 format", function () {
    const polyhashList = ["d", "dr"];
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

    const base64CompressedPolyhash = libPolyhash.compress(polyhashList);
    expect(base64CompressedPolyhash).to.eql("jZLc");
  });

  it("decompress: Return a compresed polyhash in base64 format", function () {
    const decompressed = libPolyhash.decompress("jZLc");
    expect(["d", "dr"]).to.eql(decompressed);
  });

  it("compress and decompress: plain locationIds", function () {
    const locationIdList = ["drsv", "drtjb", "drtj8", "drtj2", "drtj0"];
    const compressed = libPolyhash.compress(locationIdList);
    const decompressed = libPolyhash.decompress(compressed);
    expect(locationIdList).to.eql(decompressed);
  });

  it("compress and decompress: coords", function () {
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
      [42.9253595, -72.278924],
      [42.9253575, -72.2790098],
      [42.9253261, -72.2790071],
      [42.9252986, -72.2794631],
    ];
    const cluster = libPolyhash.toCluster(coords, 9);
    const compressedCluster = libPolyhash.compress(cluster);
    const decompressedCluster = libPolyhash.decompress(
      compressedCluster
    );
    expect(cluster).to.eql(decompressedCluster);
  });

  it("compress and decompress: very large area", function () {
    const coords = [
      [54.140625, 34.3071439],
      [-18.984375, 34.8859309],
      [-18.984375, -36.0313318],
      [54.84375, -36.0313318],
      [54.140625, 34.3071439],
    ];
    const cluster = libPolyhash.toCluster(coords, 5);
    const compressedCluster = libPolyhash.compress(cluster);
    const decompressedCluster = libPolyhash.decompress(
      compressedCluster
    );
    expect(cluster).to.eql(decompressedCluster);
  });

  it("compress and decompress: GeoJSON featuerCollection object with an empty space in the middle", function () {
    const feature = {
      type: "FeatureCollection",
      features: [
        {
          id: "46c5c3d3204d8afa8897daeffe91ebc9",
          type: "Feature",
          properties: {},
          geometry: {
            coordinates: [
              [
                [24.709158754793236, 46.77376085206123],
                [24.711213562504298, 46.77260731634826],
                [24.707912396016837, 46.772722671031545],
                [24.709158754793236, 46.77376085206123],
              ],
              [
                [24.709158754793236, 46.773414793941726],
                [24.70865347420778, 46.773091804357335],
                [24.70952929388872, 46.77302259205115],
                [24.709158754793236, 46.773414793941726],
              ],
            ],
            type: "Polygon",
          },
        },
      ],
    };
    const cluster = libPolyhash.toCluster(feature, 10);
    const compressedCluster = libPolyhash.compress(cluster);
    const decompressedCluster = libPolyhash.decompress(
      compressedCluster
    );
    expect(cluster).to.eql(decompressedCluster);
  });

  it("compress and decompress: GeoJSON feature polygon object", function () {
    const feature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [52.35993846990967, 4.884357544480264],
            [52.36000399075341, 4.88448629051081],
            [52.359971230343426, 4.884615036541266],
            [52.35990243340434, 4.884609672123355],
            [52.35991226154496, 4.8845721211978095],
            [52.3598663968696, 4.8845345702722645],
            [52.35987294896877, 4.884497019346628],
            [52.35984674056575, 4.884464832838991],
            [52.35989260526153, 4.884368273316082],
            [52.35993846990967, 4.884357544480264],
          ],
        ],
      },
    };
    const cluster = libPolyhash.toCluster(feature, 10);
    const compressedCluster = libPolyhash.compress(cluster);
    const decompressedCluster = libPolyhash.decompress(
      compressedCluster
    );
    expect(cluster).to.eql(decompressedCluster);
  });

  it("compress and decompress: GeoJSON feature multi-polygon object", function () {
    const feature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [52.35959000000008, 4.8857110000000725],
              [52.35962500000005, 4.885643000000074],
              [52.359654000000035, 4.8855870000000445],
              [52.35971700000004, 4.885669000000064],
              [52.359769000000085, 4.885567000000037],
              [52.35978400000005, 4.88553600000006],
              [52.35986200000007, 4.885644000000071],
              [52.359800000000064, 4.885768000000042],
              [52.359732000000065, 4.885902000000045],
              [52.35966600000006, 4.885814000000039],
              [52.35959000000008, 4.8857110000000725],
            ],
          ],
          [
            [
              [52.359758000000056, 4.885380000000056],
              [52.35981600000008, 4.885266000000059],
              [52.35990900000007, 4.885383000000048],
              [52.35996400000004, 4.885453000000042],
              [52.36003000000005, 4.885539000000052],
              [52.360107000000085, 4.885639000000084],
              [52.36004500000007, 4.8857620000000574],
              [52.360007000000046, 4.885836000000041],
              [52.35992500000003, 4.885726000000091],
              [52.359961000000055, 4.885650000000056],
              [52.359819000000066, 4.885460000000081],
              [52.359758000000056, 4.885380000000056],
            ],
          ],
          [
            [
              [52.35987700000004, 4.885144000000083],
              [52.35992200000004, 4.885054000000083],
              [52.360014000000035, 4.885178000000054],
              [52.35996700000004, 4.885271000000046],
              [52.35987700000004, 4.885144000000083],
            ],
          ],
          [
            [
              [52.36001900000008, 4.885345000000087],
              [52.36006800000007, 4.885249000000045],
              [52.36013400000007, 4.88533700000005],
              [52.36021000000005, 4.88543400000009],
              [52.360160000000064, 4.885533000000067],
              [52.36008700000007, 4.885430000000043],
              [52.36001900000008, 4.885345000000087],
            ],
          ],
          [
            [
              [52.36014200000005, 4.885156000000053],
              [52.36018900000004, 4.885061000000064],
              [52.36031200000008, 4.885232000000088],
              [52.36026600000008, 4.885325000000081],
              [52.36019100000004, 4.885223000000054],
              [52.36014200000005, 4.885156000000053],
            ],
          ],
        ],
      },
    };
    const cluster = libPolyhash.toCluster(feature, 10);
    const compressedCluster = libPolyhash.compress(cluster);
    const decompressedCluster = libPolyhash.decompress(
      compressedCluster
    );
    expect(cluster).to.eql(decompressedCluster);
  });

  it("compress and decompress: polygon and coords comparision: Clustering a polygon represented as a list coords or a polygon object should return the same cluster", function () {
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

    const clusterFromPoly = libPolyhash.toCluster(polygon, 10);
    const clusterFromCoords = libPolyhash.toCluster(coords, 10);
    const compressedclusterFromPoly = libPolyhash.compress(
      clusterFromPoly
    );
    const compressedclusterFromCoords = libPolyhash.compress(
      clusterFromCoords
    );
    expect(compressedclusterFromPoly).to.eql(compressedclusterFromCoords);
  });
});
