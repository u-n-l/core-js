const { isPolyInPoly, vectorIntersect } = require("../src/polyhash/util")
const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai

describe("Do two vectors intersect", () => {
  it("parallel vectors should never intersect", () => {
    const v1 = [-72.2793639,42.9259173,-72.2796428,42.9278262]
    const v2 = [ -72.2797394, 42.9258858,-72.2799969,42.927787]
    expect(vectorIntersect(v1[0],v1[1],v1[2],v1[3],v2[0],v2[1],v2[2],v2[3])).to.eql(false)
  })

  it("perpendicular vectors should intersect", () => {
    const v1 = [ 0.7470703,51.1104199,-5.0097656,58.5051747 ]
    const v2 = [ -7.734375,53.47497,4.7021484,56.5957905 ]
    expect(vectorIntersect(v1[0],v1[1],v1[2],v1[3],v2[0],v2[1],v2[2],v2[3])).to.eql(true)
  })
})

describe("Does polygon 1 intersect polygon 2", () => {
  it("completely separate polygons return false", () => {
    const poly1 = [
      [52.3433101, 4.9162075], 
      [52.3581996, 4.9071121], 
      [52.3659569, 4.9266815], 
      [52.348868, 4.9376678], 
      [52.3433101, 4.9162075]
    ]
    const poly2 = [
      [52.3421565, 4.9132919], 
      [52.3575181, 4.9039364], 
      [52.3546349, 4.8818779], 
      [52.3384333, 4.890461], 
      [52.3421565, 4.9132919]
    ]
    expect(isPolyInPoly(poly1, poly2)).to.eql(false)
  })
  
  it("separate toothed polygons shouldn't intersect", () => {
    const poly1 = [
      [ 52.348134, 4.858017],
      [ 52.3490778, 4.9009323],
      [ 52.3576754, 4.8768997],
      [ 52.3619736, 4.8987007],
      [ 52.3685773, 4.8746681],
      [ 52.3766471, 4.9007607],
      [ 52.3768567, 4.8571587],
      [ 52.348134, 4.858017]
    ]
    const poly2 = [
      [ 52.3687869, 4.8811913],
      [ 52.3767519, 4.92239],
      [ 52.3492875, 4.9239349],
      [ 52.3570463, 4.8849678],
      [ 52.3628122, 4.9136353],
      [ 52.3687869, 4.8811913]
    ]
    expect(isPolyInPoly(poly1, poly2)).to.eql(false)
  })

  it("two identical polygons should not intersect, like turf", () => {
    const poly = [
      [ 52.3770663, 4.9028206],
      [ 52.3786906, 4.9047089],
      [ 52.3813364, 4.8971558],
      [ 52.3794503, 4.8963404],
      [ 52.3770663, 4.9028206]
    ]
    expect(isPolyInPoly(poly, poly)).to.eql(false)
  })

  it("overlapping polygons should return true", () => {
    const poly1 = [
      [ 52.3770663, 4.9028206],
      [ 52.3786906, 4.9047089],
      [ 52.3813364, 4.8971558],
      [ 52.3794503, 4.8963404],
      [ 52.3770663, 4.9028206]
    ]
    const poly2 = [
      [ 52.3791097, 4.9045801],
      [ 52.3769091, 4.9023056],
      [ 52.3746036, 4.9086571],
      [ 52.3773283, 4.9111891],
      [ 52.3791097, 4.9045801]
    ]
    expect(isPolyInPoly(poly1, poly2)).to.eql(true)
  })

  it("two polygons should not overlap", () => {
    const poly1 = [
      [ -18.984375, -1.40625],
      [ -18.28125, -1.40625],
      [ -18.28125, 0],
      [ -18.984375, 0],
      [ -18.984375, -1.40625]
    ]
    const poly2 = [
      [ -19.3359375, -0.3515625],
      [ -19.6875, -0.3515625],
      [ -19.6875, -0.52734375],
      [ -19.3359375, -0.52734375],
      [ -19.3359375, -0.3515625]
    ]
    expect(isPolyInPoly(poly1, poly2)).to.eql(false)
  })

  it("these two also shouldn't", () => {
    const poly1 = [
      [ 54.140625, 16.69921875],
      [ 54.3166392261811, 16.69921875],
      [ 54.31488206283378, 16.875],
      [ 54.140625, 16.875],
      [ 54.140625, 16.69921875]
    ]
    const poly2 = [
      [ 54.3603515625, 16.7431640625],
      [ 54.31640625, 16.7431640625],
      [ 54.31640625, 16.69921875],
      [ 54.3603515625, 16.69921875],
      [ 54.3603515625, 16.7431640625]
    ]
    expect(isPolyInPoly(poly1, poly2)).to.eql(false)
  })

  it("expect two polygons sharing 1 point to not be intersecting", () => {
    const poly1 = [ 
      [ 52.3595624, 4.895525 ],
      [ 52.3487108, 4.8980999 ],
      [ 52.3502312, 4.925909 ],
      [ 52.3624453, 4.9201584 ],
      [ 52.3595624, 4.895525 ]
    ]
    const poly2 = [
      [ 52.3595624, 4.895525 ],
      [ 52.3651838, 4.8939371 ],
      [ 52.3620784, 4.8871565 ],
      [ 52.3594052, 4.8887658 ],
      [ 52.3595624, 4.895525 ]
    ]
    expect(isPolyInPoly(poly1, poly2)).to.eql(false)
  })
})