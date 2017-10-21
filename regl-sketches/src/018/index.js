const integrate = require('ode-rk4');
const regl = require('regl')({
  onDone: require('fail-nicely')(run),
  pixelRatio: 1,
  attributes: {
    antialias: false,
    depthAlpha: false,
    preserveDrawingBuffer: true
  }
});

function run (regl) {
  const dt = 1 / 60;
  let time = 0;
  const skip = 2;
  const dtInt = 0.1;
  const p0 = 0.1 * dtInt;
  const interactions = [];
  const x = require('./points')(30);
  const drawPoints = require('./draw-points')(regl);
  const drawInteractions = require('./draw-interactions')(regl);
  const derivative = require('./derivative');
  const integrator = integrate(x, derivative, 0, dt);
  const interactor = require('./interact')(x, dtInt, p0, dt);


  regl.clear({color: [0, 0, 0, 1]});
  regl.frame(({tick}) => {
    if (tick > 128 || tick % skip !== 1) return;

    time += dt;
    integrator.step();
    interactor.interact(time);

    //regl.clear({color: [0, 0, 0, 1]});
    drawPoints({x: x, t: time});
    drawInteractions({
      time: time,
      dtInt: dtInt,
      tInt: interactor.tInt,
      pSrc: interactor.pSrc,
      pDst: interactor.pDst,
      n: interactor.tInt.length
    });
  });


}
