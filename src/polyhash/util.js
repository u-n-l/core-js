/**
 * Takes two polygons, of the form of an array of lat-lon coordinates, and returns whether they intersect
 * 
 * @param {*} poly1 
 * @param {*} poly2 
 */
function isPolyInPoly(poly1, poly2) {
  // For each point of polygon 1, is it contained in polygon 2
  for (const coord1 of poly1) {
    if (_pointInPolygon(coord1, poly2)) {
      return true;
    }
  }

  for (const coord2 of poly2) {
    if (_pointInPolygon(coord2, poly1)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true or false whether poly1 contains the entirety of poly2
 * 
 * @param {[[lat, lon]]} poly1 
 * @param {[[lat, lon]]} poly2 
 */
function polyContainsPoly(poly1, poly2) {
  //FIXME: this is inefficient for large areas
  const poly1Bbox = _getBoundingBox(poly1);
  const poly2Bbox = _getBoundingBox(poly2);
  if (!_boundingBoxOverlap(poly1Bbox, poly2Bbox)) {
      return false;
  }

  // if any less than every point of poly2 is in poly1, then it isn't contained
  for (const coord of poly2) {
    if (!_pointInPolygon(coord, poly1)) {
      return false;
    }
  }
  return true;
}

/**
 * Returns a polygon feature from the given points
 * 
 * @param {*} points 
 */
function polygon(points) {
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: points
    }
  }
}

function _pointInPolygon(point, polygon) {
  let p = _getBoundingBox(polygon)
  if (point[0] < p[0] || point[0] > p[1] 
    || point[1] < p[2] || point[1] > p[3]) return false
  // one degree outside the polygon from lower left point
  const outside = [p[0] - 1, p[1]]
  let sides = _getSideVectors(polygon)

  // Test the ray against all sides
  let intersections = 0;
  for (let s of sides) {
    if (vectorIntersect(outside[0], outside[1], point[0], 
      point[1], s[0], s[1], s[2], s[3])) {
        intersections += 1
    }
  }
  return (intersections & 1) == 1
}

function _getBoundingBox(poly) {
  let maxX = maxY = minX = minY = 0
  for (let pt of poly) {
    if (pt[0] > maxX) maxX = pt[0]
    if (pt[0] < minX) minX = pt[0]
    if (pt[1] > maxY) maxY = pt[1]
    if (pt[1] < minY) minY = pt[1]
  }
  return [minX, maxX, minY, maxY]
}

function _boundingBoxOverlap(bb1, bb2) {
  if (bb1[0] > bb2[0] || bb1[2] < bb2[2] ||
    bb1[1] > bb2[1] || bb1[3] < bb2[3]) return false;
  return true;
}

function _getSideVectors(poly) {
  let sides = []
  for (let p=0; p<=poly.length-1; p++) {
    let sideStart = poly[p]
    let sideEnd = poly[(p+1) % poly.length]

    sides.push([sideStart[0], sideStart[1], sideEnd[0], sideEnd[1]])
  }
  return sides
}

// v1 vector between two polygon points
  // x1,y1 - vector start
  // x2,y2 - vector end

// v2 vector between outsidePoint & our point
function vectorIntersect(
  v1x1, v1y1,  v1x2,  v1y2,
  v2x1,  v2y1,  v2x2,  v2y2
) {
  let d1, d2;
  let a1, a2, b1, b2, c1, c2;

  a1 = v1y2 - v1y1;
  b1 = v1x1 - v1x2;
  c1 = (v1x2 * v1y1) - (v1x1 * v1y2);

  d1 = (a1 * v2x1) + (b1 * v2y1) + c1;
  d2 = (a1 * v2x2) + (b1 * v2y2) + c1;
  if (d1 > 0 && d2 > 0 || d1 < 0 && d2 < 0) return false;
  
  a2 = v2y2 - v2y1;
  b2 = v2x1 - v2x2;
  c2 = (v2x2 * v2y1) - (v2x1 * v2y2);

  d1 = (a2 * v1x1) + (b2 * v1y1) + c2;
  d2 = (a2 * v1x2) + (b2 * v1y2) + c2;
  if (d1 > 0 && d2 > 0 || d1 < 0 && d2 < 0) return false;

  // Are they collinear
  if (a1*b2 - a2*b1 == 0) return false;
  // If they are not collinear, they must intersect in exactly one point.
  return true;
}

module.exports = {
  isPolyInPoly,
  polyContainsPoly,
  polygon,
  vectorIntersect
}