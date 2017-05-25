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
    xrange: [-20.1, 20.1],
    yrange: [-10.1, 30.1]
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
      #pragma glslify: noise = require(glsl-noise/simplex/2d)

      varying vec2 uv;
      uniform float time;

      void main () {
        //float sdf = arrow(uv, tailLength, tailWidth, aspectRatio);

        float y0 = noise(vec2(uv.x, 1.0) * 0.08) * 3.0;

        float x = uv.x;
        float y = uv.y + y0 / pow(uv.y + y0, 1.0);

        float level = floor(y);


        float speed = 1.0 / level + level / (20.1 + level);
        float shift = rand(vec2(1.0, level));
        float sdf = arrow(-0.1 + 1.2 * vec2(fract(y), fract(x * 0.1 - shift - time * speed)), 0.9, 0.5, 0.1);

        float dx = dFdx(sdf);
        float dy = dFdy(sdf);
        float wid = inversesqrt(dx * dx + dy * dy);

        sdf *= wid;

        float border = 5.0;
        float alpha = smoothstep(0.0, -2.0, sdf);
        vec3 color = mix(
          colormap(clamp(1.0 - y / 30.0, 0.2, 1.0)).xyz,
          vec3(0.0),
          smoothstep(-border, -border + 2.0, sdf)
        );

        gl_FragColor = (y0 + uv.y - 1.0) < 0.0 ? vec4(0.05, 0.1, 0.1, 1) : vec4(vec3(color), alpha);
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
