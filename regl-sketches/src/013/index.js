const glsl = require('glslify');
const regl = require('regl')({
  extensions: ['WEBGL_draw_buffers', 'OES_texture_float'],
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    run(regl);
  }
});

function run (regl) {
  const camera = require('@rreusser/regl-camera')(regl, {
    distance: 3,
    theta: 1.5
  });

  const lighting = require('./lighting')(regl, [{
    position: ctx => [100 * Math.cos(ctx.time), 100, 100 * Math.sin(ctx.time)],
    color: [1, 0.8, 0.6]
  }, {
    position: ctx => [-100 * Math.sin(ctx.time), 100, 100 * Math.cos(ctx.time)],
    color: [0.6, 0.8, 1.0]
  }]);

  const dragon = require('./dragon')({
    diffuse: [0.3, 0.35, 0.3],
    ambient: [0.1, 0.1, 0.1],
    specular: 1.0,
    roughness: 0.5,
    fresnel: 1.0,
  });

  const invertCamera = require('./invert-camera')(regl);
  const createDeferredFBO = require('./buffer')(regl);
  const deferredPass = require('./defer')(regl);
  const renderPass = require('./render')(regl);
  const deferredFBO = createDeferredFBO();

  regl.frame(() => {
    camera(() => {
      deferredFBO.use(() => {
        regl.clear({color: [0, 0, 0, 1], depth: 1});

        deferredPass([
          dragon
        ]);
      });

      regl.clear({color: [0, 0, 0, 1], depth: 1});

      invertCamera(() => {
        lighting(() => {
          renderPass({data: deferredFBO.color});
        });
      });
    });
  });
}
