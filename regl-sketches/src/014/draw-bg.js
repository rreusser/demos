module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      uniform mat4 iview, iproj;
      varying vec2 uv;
      varying vec3 dir;
      void main () {
        uv = xy;
        dir = mat3(iview) * (iproj * vec4(xy, 1, 1)).xyz;
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 uv;
      varying vec3 dir;
      void main () {
        float lev = 0.95 + 0.1 * dir.y;
        lev *= -dot(uv, uv) * 0.2 + 1.0;
        vec3 color = vec3(0.93, 0.97, 1.0) * lev;
        gl_FragColor = vec4(color, 1);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    depth: {enable: false},
    count: 3
  });
}
