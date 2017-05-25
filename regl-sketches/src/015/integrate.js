module.exports = function (regl, opts) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      uniform sampler2D src;
      void main () {
        uv = 0.5 * (1.0 + xy);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      uniform float l0, k, dt, repel, repelRadius, g;
      varying vec2 uv;
      uniform vec2 dx, mouse;
      uniform sampler2D src;
      void main () {
        float ln;
        vec2 dy = vec2(0, dx.y);

        vec4 x0 = texture2D(src, uv);
        vec4 xn = texture2D(src, uv + dy);
        vec4 xs = texture2D(src, uv - dy);

        vec2 rn = xn.xy - x0.xy;
        vec2 rs = xs.xy - x0.xy;
        vec2 dmouse = (xs.xy - mouse);
        float lmouse = length(dmouse);
        dmouse /= (1.0 + pow(lmouse / repelRadius, 4.0));

        vec2 f = k * (
            rn * (length(rn) - l0) +
            rs * (length(rs) - l0)
          ) +
          repel * dmouse +
          vec2(0, -g);

        gl_FragColor = vec4(
          x0.xy + x0.zw * dt,
          (x0.zw + f) * 0.9997
        );
      }
    `,
    attributes: {
      xy: [[-4, -4], [0, 4], [4, -4]]
    },
    uniforms: {
      src: regl.prop('src'),
      l0: opts.l0,
      k: opts.k,
      dt: opts.dt,
      g: opts.g,
      repelRadius: opts.repelRadius,
      repel: opts.repelStrength,
      mouse: regl.prop('mouse'),
      dx: ctx => [
        1 / ctx.framebufferWidth,
        1 / ctx.framebufferHeight
      ],
    },
    scissor: {
      enable: true,
      box: {
        height: ctx => ctx.framebufferHeight - 1
      }
    },
    framebuffer: regl.prop('dst'),
    depth: {enable: false},
    count: 3
  });
};
