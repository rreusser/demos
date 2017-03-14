const glsl = require('glslify');
const regl = require('regl')({
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    run(regl);
  }
});

function run (regl) {
  var camera = require('./camera-2d')(regl);
  var quads = require('./quads')(
    (u, v) => [
      u - 0.5,
      v - 0.5 + Math.pow(u - 0.5, 3) * 0.5
    ],
    5, 5,
    true, false, false, true, true,
    {uv: (u, v) => [u, v]}
  );

  var mesh = require('./smooth-contours')(
    quads.cells,
    quads.positions
  );

  var draw = require('./draw-smooth-contours')(regl, mesh);

  const loop = regl.frame(({tick}) => {
    if (tick !== 1) return;
    camera(({dirty}) => {
      if (!dirty) return;
      regl.clear({color: [0, 0, 0, 1], depth: 1});

      draw();
    });
  });

}
