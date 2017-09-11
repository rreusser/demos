module.exports = function (regl) {
  // Optimal omega chosen from:
  //
  //   omega_opt = 2 / (1 + sin(pi * h))
  //
  // where
  //
  //   h = 1 / (N + 1)
  //
  // So that:
  //
  //   omega_opt = 2 / (1 + sin(pi / (384 + 1)) = 1.98381231
  //
  // See introduction to: "The Optimal Relaxation Parameter for the SOR Method Applied to
  // the Poisson Equation in Any Space Dimensions"
  // http://userpages.umbc.edu/~gobbert/papers/YangGobbertAML2007.pdf
  //
  //var OMEGA_OPT = 1.98381231;
  var OMEGA_OPT = 1.9;

  var jacobiRelax = regl({
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

        gl_FragColor = vec4(dot(lap, vec3(phie + phiw, phin + phis, -div)), 0, 0, 1);
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

  var redBlackRelax = regl({
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
      uniform float omegaRed, omegaBlack;

      void main () {
        float phi0 = texture2D(src, uv).x;
        float phin = texture2D(src, vec2(uv.x, uv.y + duv.y)).x;
        float phis = texture2D(src, vec2(uv.x, uv.y - duv.y)).x;
        float phie = texture2D(src, vec2(uv.x + duv.x, uv.y)).x;
        float phiw = texture2D(src, vec2(uv.x - duv.x, uv.y)).x;
        float div = texture2D(div, uv).x;

        vec2 c = mod(gl_FragCoord.xy - 0.5, 2.0);
        float omega = c.x == c.y ? omegaRed : omegaBlack;
        float delta = dot(lap, vec3(phie + phiw, phin + phis, -div)) - phi0;

        gl_FragColor = vec4(phi0 + omega * delta, 0, 0, 1);
      }
    `,
    attributes: {xy: [-4, -4, 0, 4, 4, -4]},
    uniforms: {
      div: regl.prop('div'),
      src: regl.prop('src'),
      omegaRed: (ctx, props) => props.color === 'red' ? props.omega : 0.0,
      omegaBlack: (ctx, props) => props.color === 'red' ? 0.0 : props.omega,
    },
    framebuffer: regl.prop('dst'),
    depth: {enable: false},
    count: 3
  });

  return function (props) {
    if (props.sor) {
      redBlackRelax({
        src: props.src,
        dst: props.dst,
        div: props.div,
        color: 'red',
        omega: props.sor ? OMEGA_OPT : 1.0
      });

      redBlackRelax({
        src: props.dst,
        dst: props.src,
        div: props.div,
        color: 'black',
        omega: props.sor ? OMEGA_OPT : 1.0
      });
    } else {
      jacobiRelax({
        src: props.dst,
        dst: props.src,
        div: props.div,
      });

      jacobiRelax({
        src: props.src,
        dst: props.dst,
        div: props.div,
      });
    }
  }
};
