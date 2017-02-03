const regl = require('regl')({
  extensions: ['OES_element_index_uint'],
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    require('./texture-load')(regl, run)
  }
});

function run (regl, assets, loader) {
  const camera = require('./camera')(regl, {distance: 30, phi: 0.1, theta: 5.0});
  const drawBg = require('./draw-bg')(regl);
  const drawTorus = require('./draw-torus')(regl);
  const invertCamera = require('./invert-camera')(regl);
  require('./explanation')();
  require('./controls')(loader.next);

  regl.frame(() => {
    camera({dtheta: 0.003}, () => {
      invertCamera(() => {
        drawBg();
        drawTorus({texture: loader.texture});
      });
    });
  });
}
