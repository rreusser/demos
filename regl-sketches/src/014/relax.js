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
      uniform vec2 duv;
      uniform sampler2D div, src;
      uniform vec3 lap;
      void main () {
        float phin = texture2D(src, vec2(uv.x, uv.y + duv.y)).x;
        float phis = texture2D(src, vec2(uv.x, uv.y - duv.y)).x;
        float phie = texture2D(src, vec2(uv.x + duv.x, uv.y)).x;
        float phiw = texture2D(src, vec2(uv.x - duv.x, uv.y)).x;
        float div = texture2D(div, uv).x;
        gl_FragColor = vec4(
          dot(lap, vec3(phie + phiw, phin + phis, -div)),
          0, 0, 1
        );
      }
    `,
    attributes: {xy: [-4, -4, 0, 4, 4, -4]},
    uniforms: {
      div: regl.prop('div'),
      src: regl.prop('src'),
    },
    framebuffer: regl.prop('dst'),
    depth: {enable: false},
    count: 3
  });
};
