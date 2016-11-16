module.exports = function (regl, width, height) {
  const n = width * height;
  const x = new Float32Array(new Array(n).fill(0).map((d, i) => (i % width) / Math.max(1, width - 1)));
  const y = new Float32Array(new Array(n).fill(0).map((d, i) => Math.floor(i / width) / Math.max(1, height - 1)));

  return regl({
    frag: `void main() {
      gl_FragColor = vec4(0.8, 0.9, 1.0, 0.2);
    }`,
    vert: `
      precision mediump float;
      attribute float x, y;
      uniform sampler2D points;
      uniform mat4 projection, view;
      void main() {
        vec4 pt = texture2D(points, vec2(x, y)).xzyw;
        gl_Position = projection * view * pt;
        gl_PointSize = 2.0;
      }
    `,
    attributes: {x: x, y: y},
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    uniforms: {points: regl.prop('points')},
    depth: {enable: false},
    primitive: 'points',
    count: n
  });
}
