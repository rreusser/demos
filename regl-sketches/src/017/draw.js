module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      uniform mat4 viewproj;
      attribute vec2 xy;

      void main () {
        float x, y, a, b, den;
        x = xy.x;
        y = xy.y;
        for (int i = 0; i < 2; i++) {
          a = x;
          b = y;
          den = 1.0 / (a * a + b * b + 2.0 * a + 1.0);
          x = 3.0 * (a * a + b * b - 1.0) * den;
          y = 6.0 * b * den;
        }
        gl_Position = viewproj * vec4(x, y, 0, 1);
        gl_PointSize = 5.0;
      }
    `,
    frag: `
      precision mediump float;

      void main () {
        gl_FragColor = vec4(1, 0, 0, 1);
      }
    `,
    count: regl.prop('count'),
    primitive: 'points',
    attributes: {
      xy: regl.prop('xy')
    }
  });
};
