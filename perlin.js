// perlin.js
// By Atul Varma, June 9 2013
//
// I learned the basics of the algorithm from a [Perlin noise page][1] on
// the internet, but derived a number of formulas on my own to ensure that
// I grasped the concepts. However, this means my implementation could be
// incorrect or inefficient.
//
// License is public domain.
//
//   [1]: http://freespace.virgin.net/hugo.elias/models/m_perlin.htm

var Perlin = (function(MersenneTwister) {
  var Perlin = {};

  function linearInterpolate(y1, y2, percent) {
    return y1 * (1 - percent) + y2 * (percent);
  };

  function cosineInterpolate(y1, y2, percent) {
    percent = (Math.cos(Math.PI - (percent * Math.PI)) + 1) * 0.5;
    return linearInterpolate(y1, y2, percent);
  };

  function Noise1D(prng, amplitude, wavelength, waves, interpolate) {
    var self = {};
    var points = self.points = [];

    for (var i = 0; i < waves; i++)
      points.push({
        x: i * wavelength,
        y: prng.random() * amplitude
      });

    self.at = function(x) {
      var i = Math.floor(x / wavelength);
      var leftPoint = points[i];
      var rightPoint = points[i+1];
      var y = interpolate(leftPoint.y, rightPoint.y,
                          (x % wavelength) / wavelength);
      return y;
    };

    return self;
  }

  function BoundedNoise1D(startY, endY) {
    if (typeof(endY) == 'undefined') endY = startY;

    function BNoise1D(prng, amplitude, wavelength, waves, interpolate) {
      var self = Noise1D(prng, amplitude, wavelength, waves, interpolate);

      self.points[0].y = startY * amplitude;
      self.points[self.points.length-1].y = endY * amplitude;

      return self;
    }

    return BNoise1D;
  }

  function Noise2D(prng, amplitude, wavelength, waves, interpolate) {
    var self = {};
    var rows = [];

    for (var j = 0; j < waves; j++) {
      var row = [];
      for (var i = 0; i < waves; i++) {
        row.push({
          x: i * wavelength,
          y: j * wavelength,
          z: prng.random() * amplitude
        });
      }
      rows.push(row);
    }

    self.at = function(x, y) {
      var i = Math.floor(x / wavelength);
      var j = Math.floor(y / wavelength);
      var topLeftPoint = rows[j+1][i];
      var topRightPoint = rows[j+1][i+1];
      var bottomLeftPoint = rows[j][i];
      var bottomRightPoint = rows[j][i+1];

      var leftZ = interpolate(bottomLeftPoint.z, topLeftPoint.z,
                              (y % wavelength) / wavelength);
      var rightZ = interpolate(bottomRightPoint.z, topRightPoint.z,
                               (y % wavelength) / wavelength);
      
      var z = interpolate(leftZ, rightZ,
                          (x % wavelength) / wavelength);
      return z;
    };

    return self;
  }

  function LayeredNoise(options) {
    var self = {};
    var seed = options.seed || Math.floor(Math.random() * 10000000);
    var width = options.width;
    var wavelength = options.wavelength;
    var persistence = options.persistence || 0.5;
    var octaves = options.octaves || 4;
    var Noise = options.noise;
    var interpolate = options.interpolate || cosineInterpolate;
    var noises = [];
    var totalOctaveAmplitudes = 0;

    for (var i = 0; i < octaves; i++) {
      var prng = new MersenneTwister(seed + i);
      var octaveAmplitude = Math.pow(persistence, i);
      var noise = Noise(prng, octaveAmplitude,
                        wavelength, (width/wavelength)+1, interpolate);
      noises.push(noise);
      totalOctaveAmplitudes += octaveAmplitude;
      wavelength = wavelength / 2;
    }

    self.at = function() {
      var coords = arguments;
      var unnormalizedResult = noises.reduce(function(sum, noise) {
        return sum + noise.at.apply(noise, coords);
      }, 0);
      return unnormalizedResult * (1 / totalOctaveAmplitudes);
    };

    return self;
  }

  Perlin.linearInterpolate = linearInterpolate;
  Perlin.cosineInterpolate = cosineInterpolate;
  Perlin.Noise1D = Noise1D;
  Perlin.BoundedNoise1D = BoundedNoise1D;
  Perlin.Noise2D = Noise2D;
  Perlin.LayeredNoise = LayeredNoise;

  return Perlin;
})(MersenneTwister);
