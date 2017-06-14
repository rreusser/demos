module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 cl;
      varying vec2 uv;
      void main () {
        uv = cl * 0.5 + 0.5;
        gl_Position = vec4(cl, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D src, phi;
      uniform vec2 der1, duv;
      void main () {
        vec3 u = texture2D(src, uv).xyz;
        float phin = texture2D(phi, vec2(uv.x, uv.y + duv.y)).x;
        float phis = texture2D(phi, vec2(uv.x, uv.y - duv.y)).x;
        float phie = texture2D(phi, vec2(uv.x + duv.x, uv.y)).x;
        float phiw = texture2D(phi, vec2(uv.x - duv.x, uv.y)).x;
        gl_FragColor = vec4(
          u.xy + der1 * vec2(phie - phiw, phin - phis),
          u.z, 1
        );
      }
    `,
    attributes: {cl: [-4, -4, 0, 4, 4, -4]},
    uniforms: {
      phi: regl.prop('phi'),
      src: regl.prop('src'),
    },
    framebuffer: regl.prop('dst'),
    depth: {enable: false},
    count: 3
  });
};
