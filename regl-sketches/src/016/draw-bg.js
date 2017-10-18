module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      varying vec3 dir;
      void main () {
        uv = xy;
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 uv;
      varying vec3 dir;
      void main () {
        vec3 color = vec3(0.93, 0.97, 1.0);
        gl_FragColor = vec4(color, 1);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    depth: {enable: false},
    count: 3
  });
}
