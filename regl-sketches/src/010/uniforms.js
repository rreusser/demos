const karmanTrefftz = require('./karman-trefftz');

module.exports = function (regl, params) {
  return regl({
    uniforms: {
      x0: () => [params.mux, params.muy],
      theta0: () => Math.atan2(-params.muy, 1 - params.mux),
      n: () => params.n,
      radius: () => Math.sqrt(Math.pow(1 - params.mux, 2) + Math.pow(params.muy, 2)),
      velocity: () => params.velocity,
      size: () => params.size,
      cpAlpha: () => params.cpAlpha,
      streamAlpha: () => params.streamAlpha,
      colorScale: () => params.colorScale,
      gridAlpha: () => params.gridAlpha,
      gridSize: () => params.gridSize,
      scale: () => {
        var theta0 = Math.atan2(-params.muy, 1 - params.mux);
        var r0 = Math.sqrt(Math.pow(1 - params.mux, 2) + Math.pow(params.muy, 2));
        var a = params.mux - Math.cos(theta0) * r0;
        return params.n - karmanTrefftz(params.n, a, 0)[0];
      },
      alpha: () => -params.alpha * Math.PI / 180,
      circulation: () => {
        if (params.kuttaCondition) {
          var theta0 = Math.atan2(-params.muy, 1 - params.mux) - params.alpha * Math.PI / 180.0;
          var r0 = Math.sqrt(Math.pow(1 - params.mux, 2) + Math.pow(params.muy, 2));
          return -Math.sin(theta0) * (1 + 1 / r0 / r0) * Math.PI * 2.0 * r0;
        } else {
          return params.circulation
        }
      }
    }
  });
};
