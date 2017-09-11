module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = xy * 0.5 + 0.5;
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 uv;
      void main () {
        vec2 c = mod(gl_FragCoord.xy - 0.5, 2.0);
        gl_FragColor = vec4(0, 0, 0, 1);
        if (c.x == c.y) {
          discard;
        }
      }
    `,
    colorMask: [false, false, false, false],
    depth: {enable: false},
    stencil: {
      enable: true,
      mask: 0xff,
      func: {
        cmp: 'always',
        ref: 0x1,
        mask: 0xff
      },
      op: {
        fail: 'keep',
        zfail: 'replace',
        zpass: 'replace'
      }
    },
    framebuffer: regl.prop('dst'),
    attributes: {xy: [-4, -4, 0, 4, 4, -4]},
    count: 3
  });
}
