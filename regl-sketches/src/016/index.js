const initialConditions = require('./initial-conditions');
const computeStatic = require('./static-trajectory');
const computeDynamic = require('./dynamic-trajectory');
const regl = require('regl')({
  attributes: {
    antialias: false,
    stencil: false,
  },
  pixelRatio: 2,
  extensions: ['oes_element_index_uint'],
  onDone: require('fail-nicely')(run),
});

function run (regl) {
  const aspect = window.innerWidth / window.innerHeight;
  const rect = {xmin: -0.65, xmax: 0.65};
  if (aspect > 1.0) {
    rect.xmin *= aspect;
    rect.xmax *= aspect;
  }
  const camera = require('./camera-2d')(regl, rect);
  const staticState = require('./state-vector')(regl, 3);
  const dynamicState = require('./dynamic-state')(regl);
  //const drawDynamic = require('./draw-dynamic')(regl);
  const drawElements = require('./draw-elements')(camera, 3);
  const drawStatic = require('./draw-static')(regl);
  const drawBg = require('./draw-bg')(regl);
  const uniforms = require('./uniforms')(regl);
  const transfer = require('./transfer-fbo')(regl);

  let y0 = initialConditions.yinyang2b;
  let tmax = 60.0;
  let dt = 0.02;

  staticState.setPathCount(3);
  computeStatic(y0, tmax, staticState);
  var trajectory = computeDynamic(y0, dt, dynamicState);

  document.body.appendChild(require('./explanation')(function (name) {
    var intl = initialConditions[name];
    computeStatic(intl, tmax, staticState);
    trajectory.setY(intl);
    camera.taint();
  }));

  /*
  var staticFbo = regl.framebuffer({
    width: regl._gl.canvas.width,
    height: regl._gl.canvas.height,
  });*/

  window.addEventListener('resize', function () {
    camera.taint();
    camera.resize();

    //staticFbo.resize(regl._gl.canvas.width, regl._gl.canvas.height);
  });

  camera.taint();

  regl.frame(({tick}) => {
    trajectory.step();
    drawElements(dynamicState);

    camera.draw(({dirty}) => {
      uniforms(() => {
        if (dirty) {
          //staticFbo.use(() => {
            drawBg();
            drawStatic(staticState.paths);
          //});
        }

        //transfer({src: staticFbo});

        //drawDynamic(dynamicState);
      });
    });
  });
}
