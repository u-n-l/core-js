/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  UnlCore Test Harness                                (c) Emre Turan 2019 / MIT Licence  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

import UnlCore from "./unl-core.js";

if (typeof window == "undefined") {
  // node
  import("chai").then((chai) => {
    global.should = chai.should();
  });
} else {
  // browser
  window.should = chai.should();
}

describe("unl-core", function () {
  it("encodes Jutland", function () {
    UnlCore.encode(57.648, 10.41, 6).should.equal("u4pruy");
  });
  it("encodes Jutland floor 5", function () {
    UnlCore.encode(57.648, 10.41, 6, { elevation: 5 }).should.equal("u4pruy@5");
  });
  it("encodes Jutland floor -2", function () {
    UnlCore.encode(57.648, 10.41, 6, { elevation: -2 }).should.equal(
      "u4pruy@-2"
    );
  });
  it("encodes Jutland heightincm 87", function () {
    UnlCore.encode(57.648, 10.41, 6, {
      elevation: 87,
      elevationType: "heightincm",
    }).should.equal("u4pruy#87");
  });
  it("encodes Jutland with default precision 9", function () {
    UnlCore.encode(57.64, 10.41).should.equal("u4pruvh36");
  });
  it("decodes Jutland", function () {
    UnlCore.decode("u4pruy").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: 0,
      elevationType: "floor",
      bounds: {
        elevation: 0,
        elevationType: "floor",
        ne: {
          lat: 57.6507568359375,
          lon: 10.4150390625,
        },
        sw: {
          lat: 57.645263671875,
          lon: 10.404052734375,
        },
      },
    });
  });
  it("decodes Jutland floor 3", function () {
    UnlCore.decode("u4pruy@3").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: 3,
      elevationType: "floor",
      bounds: {
        elevation: 0,
        elevationType: "floor",
        ne: {
          lat: 57.6507568359375,
          lon: 10.4150390625,
        },
        sw: {
          lat: 57.645263671875,
          lon: 10.404052734375,
        },
      },
    });
  });
  it("decodes Jutland floor 0", function () {
    UnlCore.decode("u4pruy@0").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: 0,
      elevationType: "floor",
      bounds: {
        elevation: 0,
        elevationType: "floor",
        ne: {
          lat: 57.6507568359375,
          lon: 10.4150390625,
        },
        sw: {
          lat: 57.645263671875,
          lon: 10.404052734375,
        },
      },
    });
  });
  it("decodes Jutland floor -2", function () {
    UnlCore.decode("u4pruy@-2").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: -2,
      elevationType: "floor",
      bounds: {
        elevation: 0,
        elevationType: "floor",
        ne: {
          lat: 57.6507568359375,
          lon: 10.4150390625,
        },
        sw: {
          lat: 57.645263671875,
          lon: 10.404052734375,
        },
      },
    });
  });
  it("decodes Jutland heightincm 87", function () {
    UnlCore.decode("u4pruy#87").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: 87,
      elevationType: "heightincm",
      bounds: {
        elevation: 0,
        elevationType: "floor",
        ne: {
          lat: 57.6507568359375,
          lon: 10.4150390625,
        },
        sw: {
          lat: 57.645263671875,
          lon: 10.404052734375,
        },
      },
    });
  });
  it("decodes Jutland heightincm 0", function () {
    UnlCore.decode("u4pruy#0").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: 0,
      elevationType: "heightincm",
      bounds: {
        elevation: 0,
        elevationType: "floor",
        ne: {
          lat: 57.6507568359375,
          lon: 10.4150390625,
        },
        sw: {
          lat: 57.645263671875,
          lon: 10.404052734375,
        },
      },
    });
  });
  it("encodes Curitiba", function () {
    UnlCore.encode(-25.38262, -49.26561, 8).should.equal("6gkzwgjz");
  });
  it("decodes Curitiba", function () {
    UnlCore.decode("6gkzwgjz").should.deep.equal({
      lat: -25.38262,
      lon: -49.26561,
      elevation: 0,
      elevationType: "floor",
      bounds: {
        elevation: 0,
        elevationType: "floor",
        ne: {
          lat: -25.382537841796875,
          lon: -49.26544189453125,
        },
        sw: {
          lat: -25.382709503173828,
          lon: -49.265785217285156,
        },
      },
    });
  });
  it("decodes Curitiba", function () {
    UnlCore.decode("6gkzwgjz").should.deep.equal({
      lat: -25.38262,
      lon: -49.26561,
      elevation: 0,
      elevationType: "floor",
      bounds: {
        elevation: 0,
        elevationType: "floor",
        ne: {
          lat: -25.382537841796875,
          lon: -49.26544189453125,
        },
        sw: {
          lat: -25.382709503173828,
          lon: -49.265785217285156,
        },
      },
    });
  });
  it("decodes Curitiba floor 5", function () {
    UnlCore.decode("6gkzwgjz@5").should.deep.equal({
      lat: -25.38262,
      lon: -49.26561,
      elevation: 5,
      elevationType: "floor",
      bounds: {
        elevation: 0,
        elevationType: "floor",
        ne: {
          lat: -25.382537841796875,
          lon: -49.26544189453125,
        },
        sw: {
          lat: -25.382709503173828,
          lon: -49.265785217285156,
        },
      },
    });
  });
  it("decodes Curitiba heightincm 90", function () {
    UnlCore.decode("6gkzwgjz#90").should.deep.equal({
      lat: -25.38262,
      lon: -49.26561,
      elevation: 90,
      elevationType: "heightincm",
      bounds: {
        elevation: 0,
        elevationType: "floor",
        ne: {
          lat: -25.382537841796875,
          lon: -49.26544189453125,
        },
        sw: {
          lat: -25.382709503173828,
          lon: -49.265785217285156,
        },
      },
    });
  });
  it("adjacent north", function () {
    UnlCore.adjacent("ezzz@5", "n").should.equal("gbpb@5");
  });
  it("fetches neighbours", function () {
    UnlCore.neighbours("ezzz").should.deep.equal({
      n: "gbpb",
      ne: "u000",
      e: "spbp",
      se: "spbn",
      s: "ezzy",
      sw: "ezzw",
      w: "ezzx",
      nw: "gbp8",
    });
  });
  it("fetches neighbours 5th floor", function () {
    UnlCore.neighbours("ezzz@5").should.deep.equal({
      n: "gbpb@5",
      ne: "u000@5",
      e: "spbp@5",
      se: "spbn@5",
      s: "ezzy@5",
      sw: "ezzw@5",
      w: "ezzx@5",
      nw: "gbp8@5",
    });
  });
  it("fetches neighbours -2 floor", function () {
    UnlCore.neighbours("ezzz@-2").should.deep.equal({
      n: "gbpb@-2",
      ne: "u000@-2",
      e: "spbp@-2",
      se: "spbn@-2",
      s: "ezzy@-2",
      sw: "ezzw@-2",
      w: "ezzx@-2",
      nw: "gbp8@-2",
    });
  });
  it("fetches neighbours above 87cm", function () {
    UnlCore.neighbours("ezzz#87").should.deep.equal({
      n: "gbpb#87",
      ne: "u000#87",
      e: "spbp#87",
      se: "spbn#87",
      s: "ezzy#87",
      sw: "ezzw#87",
      w: "ezzx#87",
      nw: "gbp8#87",
    });
  });
  it("fetches neighbours below 5cm", function () {
    UnlCore.neighbours("ezzz#-5").should.deep.equal({
      n: "gbpb#-5",
      ne: "u000#-5",
      e: "spbp#-5",
      se: "spbn#-5",
      s: "ezzy#-5",
      sw: "ezzw#-5",
      w: "ezzx#-5",
      nw: "gbp8#-5",
    });
  });
  it("matches locationId", function () {
    UnlCore.encode(37.25, 123.75, 12).should.equal("wy85bj0hbp21");
  });
  it("excludes elevation Curitiba 5th floor", function () {
    UnlCore.excludeElevation("6gkzwgjz@5").should.deep.equal({
      locationId: "6gkzwgjz",
      elevation: 5,
      elevationType: "floor",
    });
  });
  it("excludes elevation Curitiba above 87cm", function () {
    UnlCore.excludeElevation("6gkzwgjz#87").should.deep.equal({
      locationId: "6gkzwgjz",
      elevation: 87,
      elevationType: "heightincm",
    });
  });
  it("appends elevation Curitiba 5th floor", function () {
    UnlCore.appendElevation("6gkzwgjz", 5).should.equal("6gkzwgjz@5");
  });
  it("appends elevation Curitiba above 87cm", function () {
    UnlCore.appendElevation("6gkzwgjz", 87, "heightincm").should.equal(
      "6gkzwgjz#87"
    );
  });
  it("retrieves grid lines with precision 9", function () {
    UnlCore.gridLines(
      {
        sw: {
          lat: 46.77210936378606,
          lon: 23.595436614661565,
        },
        ne: {
          lat: 46.77227194246396,
          lon: 23.59560827603795,
        },
      },
      9
    ).length.should.equal(7);
  });
  it("retrieves grid lines with no precision specified (default 9)", function () {
    UnlCore.gridLines({
      sw: {
        lat: 46.77210936378606,
        lon: 23.595436614661565,
      },
      ne: {
        lat: 46.77227194246396,
        lon: 23.59560827603795,
      },
    }).length.should.equal(7);
  });
  it("retrieves grid lines with precision 12", function () {
    UnlCore.gridLines(
      {
        sw: {
          lat: 46.77210936378606,
          lon: 23.595436614661565,
        },
        ne: {
          lat: 46.77227194246396,
          lon: 23.59560827603795,
        },
      },
      12
    ).length.should.equal(1481);
  });
});
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
