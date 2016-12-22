module.exports = function (regl, opts) {
  opts = opts || {};
  var lights = opts.lights || [];
  var name = opts.name || 'light';

  var uniforms = {}
  for (i = 0; i < lights.length; i++) {
    (function (light) {
      uniforms[name + i + 'position'] = () => light.position;
      uniforms[name + i + 'color'] = () => light.color;
      uniforms[name + i + 'power'] = () => light.power;
    }(lights[i]));
  }

  if (opts.ambient) {
    uniforms[name + 'ambient'] = () => opts.ambient;
  }

  let ret = regl({
    uniforms: uniforms
  });

  ret.setColor = function (i, newcol) {
    newcol = newcol.concat(0.4);
    lights[i].color = newcol;
  };

  return ret;
};
