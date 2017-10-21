const regl = require('regl')({
  attributes: {antialias: false},
  pixelRatio: 1,
  extensions: [],//['oes_element_index_uint'],
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
  const points = require('./points')(regl, 40, 40);
  const uniforms = require('./uniforms')(regl);
  const draw = require('./draw')(regl, points);

  window.addEventListener('resize', function () {
    camera.taint();
    camera.resize();
  });

  camera.taint();
  regl.frame(({tick}) => {
    camera.draw(({dirty}) => {
      if (!dirty) return;
      uniforms(() => {
        draw(points);
      });
    });
  });
}
