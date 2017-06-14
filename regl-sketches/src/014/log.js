const ndarray = require('ndarray');
const show = require('ndarray-show');

module.exports = function (regl) {
  return function (fbo, label, components) {
    components = components || 'xyzw';
    let w = fbo.width;
    let h = fbo.height;
    let a;
    fbo.use(() => {
      a = ndarray(regl.read(), [h, w, 4]);
    });

    let print = ['x', 'y', 'z', 'w'];
    for (i = 0; i < print.length; i++) {
      let c = print[i];
      if (components.indexOf(c) !== -1) {
        console.log((label ? label + '.' : '') + c + ':\n' + show(a.pick(null, null, i)));
      }
    }
  }
}
