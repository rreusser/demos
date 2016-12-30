module.exports = function (gpu) {
  return gpu.map({
    args: ['array'],
    body: `
      vec4 compute (vec4 a) {
        return a;
      }
    `
  });
};
