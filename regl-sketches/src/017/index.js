const regl = require('regl')({
  attributes: {antialias: false},
  pixelRatio: 1,
  extensions: ['oes_texture_float', 'oes_texture_float_linear'],
  onDone: require('fail-nicely')(run),
});

function run (regl) {
  const camera = require('./camera-2d')(regl);
  const pde = require('./kuramoto-sivashinsky')({
    m: 64,
    n: 64,
    res: 0.9,
    scale: 10,
    randomness: 1e-11 * 0
  });

  const tex = regl.texture({});

  const draw = require('./draw')(regl, tex);

  pde.initialize('spot')
  pde.write(tex);

  camera.taint();
  regl.frame(({tick}) => {
    camera.draw(({dirty}) => {
      //if (!dirty) return;
      let minmax = pde.step();
      pde.write(tex);
      minmax.zoom = 6;
      draw(minmax);
    });
  });
}
