/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Geohash Test Harness                                (c) Emre Turan 2019 / MIT Licence  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

import Geohash from './unl-core.js';

if (typeof window == 'undefined') { // node
    import('chai').then(chai => { global.should = chai.should(); });
} else {                            // browser
    window.should = chai.should();
}


describe('unl-core', function() {

    it('encodes Jutland',     function() { Geohash.encode(57.648, 10.410, 6).should.equal('u4pruy'); });
    it('encodes Jutland floor 1',     function() { Geohash.encode(57.648, 10.410, 6, {elevation: 5}).should.equal('u4pruy@5'); });
    it('encodes Jutland heightincm 87',     function() { Geohash.encode(57.648, 10.410, 6, {elevation: 87, elevationType:'heightincm'}).should.equal('u4pruy#87'); });
    it('decodes Jutland',     function() { Geohash.decode('u4pruy').should.deep.equal({ lat: 57.648, lon: 10.410, elevation: 0, elevationType: 'floor' }); });
    it('decodes Jutland floor 3',     function() { Geohash.decode('u4pruy@3').should.deep.equal({ lat: 57.648, lon: 10.410, elevation: 3, elevationType: 'floor' }); });
    it('decodes Jutland floor 0',     function() { Geohash.decode('u4pruy@0').should.deep.equal({ lat: 57.648, lon: 10.410, elevation: 0, elevationType: 'floor' }); });
    it('decodes Jutland heightincm 87',     function() { Geohash.decode('u4pruy#87').should.deep.equal({ lat: 57.648, lon: 10.410, elevation: 87, elevationType: 'heightincm' }); });
    it('decodes Jutland heightincm 0',     function() { Geohash.decode('u4pruy#0').should.deep.equal({ lat: 57.648, lon: 10.410, elevation: 0, elevationType: 'heightincm' }); });
    it('encodes Curitiba',    function() { Geohash.encode(-25.38262, -49.26561, 8).should.equal('6gkzwgjz'); });
    it('decodes Curitiba',    function() { Geohash.decode('6gkzwgjz').should.deep.equal({ lat: -25.38262, lon: -49.26561, elevation: 0, elevationType: 'floor' }); });
    it('decodes Curitiba',    function() { Geohash.decode('6gkzwgjz').should.deep.equal({ lat: -25.38262, lon: -49.26561, elevation: 0, elevationType: 'floor' }); });
    it('decodes Curitiba floor 5',    function() { Geohash.decode('6gkzwgjz@5').should.deep.equal({ lat: -25.38262, lon: -49.26561, elevation: 5, elevationType: 'floor' }); });
    it('decodes Curitiba heightincm 90',    function() { Geohash.decode('6gkzwgjz#90').should.deep.equal({ lat: -25.38262, lon: -49.26561, elevation: 90, elevationType: 'heightincm' }); });
    it('adjacent north',  function() { Geohash.adjacent('ezzz@5', 'n').should.equal('gbpb@5'); });
    it('fetches neighbours',  function() { Geohash.neighbours('ezzz').should.deep.equal({ n:'gbpb', ne:'u000', e:'spbp', se:'spbn', s:'ezzy', sw:'ezzw', w:'ezzx', nw:'gbp8' }); });
    it('fetches neighbours 5th floor',  function() { Geohash.neighbours('ezzz@5').should.deep.equal({ n:'gbpb@5', ne:'u000@5', e:'spbp@5', se:'spbn@5', s:'ezzy@5', sw:'ezzw@5', w:'ezzx@5', nw:'gbp8@5' }); });
    it('fetches neighbours above 87cm',  function() { Geohash.neighbours('ezzz#87').should.deep.equal({ n:'gbpb#87', ne:'u000#87', e:'spbp#87', se:'spbn#87', s:'ezzy#87', sw:'ezzw#87', w:'ezzx#87', nw:'gbp8#87' }); });
    it('matches geohash.org', function() { Geohash.encode(37.25, 123.75, 12).should.equal('wy85bj0hbp21'); });
    it('excludes elevation Curitiba 5th floor', function() { Geohash.excludeElevation('6gkzwgjz@5').should.deep.equal({geohash:'6gkzwgjz', elevation: 5, elevationType: 'floor'}); });
    it('excludes elevation Curitiba above 87cm', function() { Geohash.excludeElevation('6gkzwgjz#87').should.deep.equal({geohash:'6gkzwgjz', elevation: 87, elevationType: 'heightincm'}); });
    it('appends elevation Curitiba 5th floor', function() { Geohash.appendElevation('6gkzwgjz', 5).should.equal('6gkzwgjz@5'); });
    it('appends elevation Curitiba above 87cm', function() { Geohash.appendElevation('6gkzwgjz', 87, 'heightincm').should.equal('6gkzwgjz#87'); });

});

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
