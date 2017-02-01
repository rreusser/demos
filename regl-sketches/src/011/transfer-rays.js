module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (1.0 + xy);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D src;
      void main () {
        float alpha = texture2D(src, uv).x;
        gl_FragColor = vec4(vec3(1), 0.5 * alpha);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {src: regl.prop('src')},
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    depth: {enable: false},
    count: 3
  });
}
