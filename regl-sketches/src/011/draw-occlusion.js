const glslify = require('glslify');

module.exports = function (regl) {
  const ico = require('icosphere')(5);

  return regl({
    vert: glslify(`
      precision mediump float;
      #pragma glslify: bump = require(./bump)

      uniform float st, scale, t;
      uniform mat4 projection, view;
      attribute vec3 xyz;
      varying float noisemag;

      void main () {
        vec3 p0 = xyz * (0.8 + 1.0 * scale);
        //p = p0;
        float freq = 2.0;
        noisemag = bump(vec4(p0 * freq, st), t, scale);
        p0 *= noisemag;
        gl_Position = projection * view * vec4(p0, 1);
      }
    `),
    frag: glslify(`
      precision mediump float;
      #pragma glslify: hotspot = require(./hotspot)
      varying float noisemag;
      void main () {
        gl_FragColor = vec4(hotspot(noisemag - 1.0), vec3(1));
      }
    `),
    attributes: {
      xyz: ico.positions,
    },
    uniforms: {
      st: regl.prop('scaledTime'),
      t: regl.prop('t'),
      scale: regl.prop('scale')
    },
    elements: ico.cells,
    count: ico.cells.length * 3
  });
};
