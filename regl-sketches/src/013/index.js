const extend = require('xtend');
const glsl = require('glslify');

const regl = require('regl')({
  pixelRatio: 2.0,
  attributes: {
    antialias: false,
  },
  extensions: ['oes_standard_derivatives'],
  onDone: require('fail-nicely')(run)
});

function run (regl) {
  const camera = require('./camera-2d')(regl, {
    xrange: [-5.1, 5.1],
    yrange: [-5.1, 5.1]
  });

  let tailLength = 0.5;
  var tailWidth = 0.5;

  /*camera.on('move', function (e) {
    tailLength = Math.max(0, Math.min(1, e.y));
    tailWidth = Math.max(0, Math.min(0.5, Math.abs(e.x - 0.5) / controls.state.aspectRatio)) * 2.0;
    camera.taint();
  });*/

  const uniforms = require('./uniforms')(regl);
  //const controls = require('./controls')({border: 4});

  window.addEventListener('resize', camera.resize);
  //controls.on('input', camera.taint);

  const draw = regl({
    vert: `
      precision highp float;
      attribute vec2 xy;
      varying vec2 uv;
      uniform mat4 view, iview;
      void main () {
        uv = (iview * vec4(xy, 0.0, 1.0)).xy;
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: glsl(`
      #extension GL_OES_standard_derivatives : enable
      precision highp float;

      #pragma glslify: arrow = require(./arrow)
      #pragma glslify: rand = require(glsl-random)
      #pragma glslify: colormap = require(glsl-colormap/rainbow-soft)

      varying vec2 uv;
      uniform float time;

      void main () {
        //float sdf = arrow(uv, tailLength, tailWidth, aspectRatio);
        float th = atan(uv.y, uv.x);

        float n = 3.0;
        float r = length(uv) * n;
        float r0 = floor(r);
        float r1 = ceil(r);
        float ravg = 0.5 * (r0 + r1);

        float num = r0 * 0.5 + 1.0;
        float speed = 2.0 / ravg;
        float u = -0.1 + 1.2 * fract((th / 3.14159) * num - speed * time + rand(vec2(ravg, 0.0)));
        float v = -0.1 + 1.2 * fract(r);

        float correction = (ravg - 0.2) / ravg;
        float tailLength = 0.9 * correction;
        float sdf = arrow(vec2(v, u), tailLength, 0.5, 1.0 / 6.28 / correction);

        float dx = dFdx(sdf);
        float dy = dFdy(sdf);
        float wid = inversesqrt(dx * dx + dy * dy);

        sdf += 0.30 * (1.0 - 1.0 / (1.0 + ravg / 10.0)) - 0.15;

        sdf *= wid;

        float border = 5.0;
        float alpha = smoothstep(0.0, -2.0, sdf);
        vec3 color = mix(
          colormap(clamp(1.0 - r0 / 20.0, 0.2, 1.0)).xyz,
          vec3(0.0),
          smoothstep(-border, -border + 2.0, sdf)
        );

        gl_FragColor = vec4(vec3(color), alpha);
      }
    `),
    depth: {enable: false},
    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 1,
        dstRGB: 'one minus src alpha',
        dstAlpha: 1
      },
      equation: {rgb: 'add', alpha: 'add'}
    },
    attributes: {xy: [-4, -4, 0, 4, 4, -4]},
    count: 3
  });

  regl.frame(({tick}) => {
    camera.draw(({dirty}) => {
      //if (!dirty) return;
      //if (tick % 3 !== 1) return;
      regl.clear({color: [0.2, 0.3, 0.4, 1.0]})
      uniforms(extend({
        tailLength: tailLength,
        tailWidth: tailWidth
      }/*, controls.state*/), () => {
        draw();
      });
    });
  });
}
