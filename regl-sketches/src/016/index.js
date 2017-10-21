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

  let y0;
  let intl;
  let tmax = 60.0;
  let tol = 1e-11;
  let dt = 0.02;

  function setInitial (name) {
    intl = initialConditions[name];
    if (!intl) return;
    y0 = intl.y.slice();
    tol = intl.tol === undefined ? 1e-10 : intl.tol;
    scale = intl.scale === undefined ? 1 : intl.scale;
    tmax = (intl.tmax === undefined ? 60.0 : intl.tmax) * Math.pow(scale, 1.5)
    for (var i = 0; i < y0.length; i+= 6) {
      y0[i] *= scale;
      y0[i + 1] *= scale;
      y0[i + 2] *= scale;
      y0[i + 3] /= Math.sqrt(scale);
      y0[i + 4] /= Math.sqrt(scale);
      y0[i + 5] /= Math.sqrt(scale);
    }
    computeStatic(y0, tmax, staticState, tol);
    if (trajectory) trajectory.setY(y0);
    camera.taint();
    window.location.hash = name;
  }

  staticState.setPathCount(3);

  var name = (window.location.hash || '').replace(/^#/,'')
  if (!initialConditions[name]) {
    name = 'YinYang2b'
  }
  setInitial(name);

  computeStatic(y0, tmax, staticState, tol);
  var trajectory = computeDynamic(y0, dt, dynamicState);

  document.body.appendChild(require('./explanation')(setInitial));

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

var _gaq=[['_setAccount','UA-50197543-4'],['_trackPageview']];
(function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
s.parentNode.insertBefore(g,s)}(document,'script'));
