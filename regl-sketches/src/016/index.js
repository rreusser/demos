const initialConditions = require('./initial-conditions');
const computeStatic = require('./static-trajectory');
const computeDynamic = require('./dynamic-trajectory');
const regl = require('regl')({
  pixelRatio: 2,
  extensions: ['oes_element_index_uint'],
  onDone: require('fail-nicely')(run),
});

function run (regl) {
  const camera = require('./camera-2d')(regl);
  const staticState = require('./state-vector')(regl, 3, 15000);
  const dynamicState = require('./dynamic-state')(regl);
  const drawDynamic = require('./draw-dynamic')(regl);
  const drawStatic = require('./draw-static')(regl);
  const drawBg = require('./draw-bg')(regl);
  const uniforms = require('./uniforms')(regl);
  const transfer = require('./transfer-fbo')(regl);


  let y0 = initialConditions.yinyang2a;
  let tmax = 60.0;
  let dt = 0.02;

  staticState.setPathCount(3);
  computeStatic(y0, tmax, staticState);
  var trajectory = computeDynamic(y0, dt, dynamicState);

  var staticFbo = regl.framebuffer({
    width: regl._gl.canvas.width,
    height: regl._gl.canvas.height,
  });

  camera.taint();
  regl.frame(({tick}) => {

    trajectory.step();

    camera.draw(({dirty}) => {
      uniforms(() => {

        if (dirty) {
          staticFbo.use(() => {
            drawBg();
            drawStatic(staticState.paths);
          });
        }

        transfer({src: staticFbo});
        drawDynamic(dynamicState);
      });
    });
  });
}
