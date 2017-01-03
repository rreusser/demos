module.exports = function (regl) {
  return regl({
    frag: `
      precision mediump float;
      varying vec2 uv;
      void main () {
        float r2 = uv.x * uv.x + uv.y * uv.y;
        gl_FragColor = vec4(vec3(1.0 - 1.0 * r2) * vec3(0.90, 0.97, 1.0), 1.0);
      }
    `,
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (xy + 1.0) - 0.5;
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    depth: {enable: false},
    count: 3
  });
}
