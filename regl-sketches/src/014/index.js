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
      v - 0.5
    ],
    1, 1,
    true, false, false, true, true,
    {uv: (u, v) => [u, v]}
  );

  var smoothContours = require('./smooth-contours')(
    quads.cells,
    quads.positions
  );

  var draw = require('./draw-smooth-contours')(regl,
    smoothContours.cells,
    smoothContours.positions
  );

  const loop = regl.frame(({tick}) => {
    if (tick !== 1) return;
    camera(({dirty}) => {
      if (!dirty) return;
      regl.clear({color: [0, 0, 0, 1], depth: 1});

      draw();
    });
  });

}
