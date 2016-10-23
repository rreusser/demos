const newton = require('newton-raphson-method');
const regl = require('regl')({});

require('resl')({
  manifest: {erwin: {type: 'image', src: 'erwin.jpg'}},
  onDone: ({erwin}) => {
    // Arc length of archimede's spiral: r = theta
    function arcLength (theta) {
      const fac = Math.sqrt(1 + theta * theta)
      return (theta * fac + Math.log(theta + fac)) / 2;
    }

    // Tabulate theta and arc length, inverting arc length numerically
    // to get theta for equally spaced points:
    const n = 50000;
    const loops = 25;
    for (var i = 0, l = [], th = []; i < n; i++) {
      l[i] = i / (n - 1) * arcLength(loops * Math.PI * 2);
      th[i] = newton(x => arcLength(x) - l[i], l[i]);
    }

    // Draw each frame:
    regl.frame(regl({
      vert: `
        uniform float aspect, t;
        uniform sampler2D image;
        attribute float th, l;

        float wave (vec2 x, float t) {
          return 1.0 - texture2D(image, 0.5 - x * exp(2.5 - 6.0 * t)).x;
        }

        void main () {
          float r = th * ${(0.5 / 3.14159 / loops).toFixed(8)};
          float c = cos(th - t * 2.0);
          float s = sin(th - t * 2.0);
          vec2 x = vec2(c, s) * r * 0.5;
          r += 0.018 * sin(l * 1.5) * (wave(x, fract(t * 0.2)) + wave(x, fract(t * 0.2 + 0.5)));
          gl_Position = vec4(0.99 * r * vec2(c, s * aspect), 0.0, 1.0);
        }
      `,
      frag: `void main () {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }`,
      uniforms: {
        image: regl.texture(erwin),
        t: regl.context('time'),
        aspect: d => d.viewportWidth / d.viewportHeight
      },
      attributes: {th, l},
      count: th.length,
      lineWidth: 3,
      primitive: 'line strip'
    }));
  }
});
