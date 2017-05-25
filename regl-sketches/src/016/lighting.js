module.exports = function (regl, lights) {
  const uniforms = {};
  for (let i = 0; i < lights.length; i++) {
    uniforms['lights[' + i + '].position'] = lights[i].position;
    uniforms['lights[' + i + '].color'] = lights[i].color;
  }
  return regl({uniforms: uniforms});
};
