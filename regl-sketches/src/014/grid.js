module.exports = function (regl, opts) {
  var ni = opts.n[0];
  var nj = opts.n[1];

  function grid (ni, nj) {
    return regl.framebuffer({
      color: regl.texture({
        type: opts.type,
        mag: 'linear',
        min: 'linear',
        width: ni,
        height: nj
      })
    });
  }

  return {
    u0: grid(ni, nj),
    u1: grid(ni, nj),
    u2: grid(ni, nj),
    phi0: grid(ni, nj),
    phi1: grid(ni, nj),
    div: grid(ni, nj)
  }
};
