'use strict'

var regl = require('regl')({extensions: ['OES_texture_float']});
var createOp = require('../');
var MersenneTwister = require('mersenne-twister');
var mersenne = new MersenneTwister();
mersenne.random = mersenne.random.bind(mersenne);

var pool = require('ndarray-scratch');
var show = require('ndarray-show');
var ndarray = require('ndarray');
var ndPrefixSum = require('ndarray-prefix-sum');
var fill = require('ndarray-fill');
var ndt = require('ndarray-tests');


function read (fbo) {
  var a;
  fbo.use(function () {
    a = regl.read();
  });
  return a;
}

describe('sum', function () {
  var gpuPrefixSum;

  beforeEach(function () {
    mersenne.init_seed(123);
  });

  afterEach(function () {
    if (gpuPrefixSum) {
      gpuPrefixSum.destroy();
    }
  });

  describe('float32', function () {
    it('5 x 1 float32', function () {
      var width = 5;
      var height = 1;
      var computed;
      var n = width * height;
      var input = fill(ndarray(new Float32Array(n * 4)), function (i) {return i;});
      var output = ndarray(new Float32Array(n * 4));
      var expected = ndPrefixSum(pool.clone(input))

      var inputTex = regl.texture({data: input.data, width: n, height: 1});
      var inputFbo = regl.framebuffer({color: inputTex, colorFormat: 'rgba', colorType: 'float'});
      var outputTex = regl.texture({data: output.data, width: n, height: 1});
      var outputFbo = regl.framebuffer({color: outputTex, colorFormat: 'rgba', colorType: 'float'});

      var gpuPrefixSum = createOp(regl);
      var resultFbo = gpuPrefixSum.compute({src: inputFbo, dest: outputFbo});

      var computed = ndarray(read(resultFbo));

      expect(ndt.approximatelyEqual(computed, expected)).toBe(true);

      inputFbo.destroy();
      outputFbo.destroy();
      inputTex.destroy();
      outputTex.destroy();
    });
  });
});
