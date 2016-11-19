module.exports = function (regl, samplerCoords) {
  return regl({
    frag: `
      precision mediump float;
      uniform vec4 color;
      void main() {
        gl_FragColor = color;
      }
    `,
    vert: `
      precision mediump float;
      attribute vec2 xy;
      uniform sampler2D points;
      uniform mat4 projection, view;
      void main() {
        vec4 pt = texture2D(points, xy).xzyw;
        gl_Position = projection * view * pt;
        gl_PointSize = 4.0;
      }
    `,
    attributes: {xy: regl.prop('sampleAt')},
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    uniforms: {
      points: regl.prop('data'),
      color: regl.prop('color')
    },
    depth: {enable: false},
    primitive: 'points',
    count: regl.prop('count')
  });
}
