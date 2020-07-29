/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  LocationId Test Harness                                (c) Emre Turan 2019 / MIT Licence  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

import LocationId from "./unl-core.js";

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
    LocationId.encode(57.648, 10.41, 6).should.equal("u4pruy");
  });
  it("encodes Jutland floor 5", function () {
    LocationId.encode(57.648, 10.41, 6, { elevation: 5 }).should.equal(
      "u4pruy@5"
    );
  });
  it("encodes Jutland floor -2", function () {
    LocationId.encode(57.648, 10.41, 6, { elevation: -2 }).should.equal(
      "u4pruy@-2"
    );
  });
  it("encodes Jutland heightincm 87", function () {
    LocationId.encode(57.648, 10.41, 6, {
      elevation: 87,
      elevationType: "heightincm",
    }).should.equal("u4pruy#87");
  });
  it("decodes Jutland", function () {
    LocationId.decode("u4pruy").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: 0,
      elevationType: "floor",
      bounds: LocationId.bounds(
        LocationId.excludeElevation("u4pruy").locationId
      ),
    });
  });
  it("decodes Jutland floor 3", function () {
    LocationId.decode("u4pruy@3").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: 3,
      elevationType: "floor",
      bounds: LocationId.bounds(
        LocationId.excludeElevation("u4pruy@3").locationId
      ),
    });
  });
  it("decodes Jutland floor 0", function () {
    LocationId.decode("u4pruy@0").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: 0,
      elevationType: "floor",
      bounds: LocationId.bounds(
        LocationId.excludeElevation("u4pruy@0").locationId
      ),
    });
  });
  it("decodes Jutland floor -2", function () {
    LocationId.decode("u4pruy@-2").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: -2,
      elevationType: "floor",
      bounds: LocationId.bounds(
        LocationId.excludeElevation("u4pruy@-2").locationId
      ),
    });
  });
  it("decodes Jutland heightincm 87", function () {
    LocationId.decode("u4pruy#87").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: 87,
      elevationType: "heightincm",
      bounds: LocationId.bounds(
        LocationId.excludeElevation("u4pruy#87").locationId
      ),
    });
  });
  it("decodes Jutland heightincm 0", function () {
    LocationId.decode("u4pruy#0").should.deep.equal({
      lat: 57.648,
      lon: 10.41,
      elevation: 0,
      elevationType: "heightincm",
      bounds: LocationId.bounds(
        LocationId.excludeElevation("u4pruy#0").locationId
      ),
    });
  });
  it("encodes Curitiba", function () {
    LocationId.encode(-25.38262, -49.26561, 8).should.equal("6gkzwgjz");
  });
  it("decodes Curitiba", function () {
    LocationId.decode("6gkzwgjz").should.deep.equal({
      lat: -25.38262,
      lon: -49.26561,
      elevation: 0,
      elevationType: "floor",
      bounds: LocationId.bounds(
        LocationId.excludeElevation("6gkzwgjz").locationId
      ),
    });
  });
  it("decodes Curitiba", function () {
    LocationId.decode("6gkzwgjz").should.deep.equal({
      lat: -25.38262,
      lon: -49.26561,
      elevation: 0,
      elevationType: "floor",
      bounds: LocationId.bounds(
        LocationId.excludeElevation("6gkzwgjz").locationId
      ),
    });
  });
  it("decodes Curitiba floor 5", function () {
    LocationId.decode("6gkzwgjz@5").should.deep.equal({
      lat: -25.38262,
      lon: -49.26561,
      elevation: 5,
      elevationType: "floor",
      bounds: LocationId.bounds(
        LocationId.excludeElevation("6gkzwgjz@5").locationId
      ),
    });
  });
  it("decodes Curitiba heightincm 90", function () {
    LocationId.decode("6gkzwgjz#90").should.deep.equal({
      lat: -25.38262,
      lon: -49.26561,
      elevation: 90,
      elevationType: "heightincm",
      bounds: LocationId.bounds(
        LocationId.excludeElevation("6gkzwgjz#90").locationId
      ),
    });
  });
  it("adjacent north", function () {
    LocationId.adjacent("ezzz@5", "n").should.equal("gbpb@5");
  });
  it("fetches neighbours", function () {
    LocationId.neighbours("ezzz").should.deep.equal({
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
    LocationId.neighbours("ezzz@5").should.deep.equal({
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
    LocationId.neighbours("ezzz@-2").should.deep.equal({
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
    LocationId.neighbours("ezzz#87").should.deep.equal({
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
    LocationId.neighbours("ezzz#-5").should.deep.equal({
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
    LocationId.encode(37.25, 123.75, 12).should.equal("wy85bj0hbp21");
  });
  it("excludes elevation Curitiba 5th floor", function () {
    LocationId.excludeElevation("6gkzwgjz@5").should.deep.equal({
      locationId: "6gkzwgjz",
      elevation: 5,
      elevationType: "floor",
    });
  });
  it("excludes elevation Curitiba above 87cm", function () {
    LocationId.excludeElevation("6gkzwgjz#87").should.deep.equal({
      locationId: "6gkzwgjz",
      elevation: 87,
      elevationType: "heightincm",
    });
  });
  it("appends elevation Curitiba 5th floor", function () {
    LocationId.appendElevation("6gkzwgjz", 5).should.equal("6gkzwgjz@5");
  });
  it("appends elevation Curitiba above 87cm", function () {
    LocationId.appendElevation("6gkzwgjz", 87, "heightincm").should.equal(
      "6gkzwgjz#87"
    );
  });
  it("retrieves grid lines", function () {
    LocationId.gridLines(
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
});
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
