var transform = require('gl-vec3/transformMat4');
var color = require('./color');

function toRGB (vec) {
  vec[0] = Math.round(256 * Math.max(0, Math.min(1, vec[0])));
  vec[1] = Math.round(256 * Math.max(0, Math.min(1, vec[1])));
  vec[2] = Math.round(256 * Math.max(0, Math.min(1, vec[2])));

  return 'rgb(' + vec + ')';
}

module.exports = function (camera, n) {
  var i;
  var els = [];
  var xyz = [0, 0, 0];

  var container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  for (i = 0; i < n; i++) {
    var el = document.createElement('div');
    el.style.backgroundColor = toRGB(color(i, n, 0.5));
    el.style.width = '10px';
    el.style.height = '10px';
    el.style.top = '-5px';
    el.style.left = '-5px';
    el.style.borderRadius = '100%';
    el.style.position = 'absolute';
    container.appendChild(el);
    els.push(el);
  }

  return function (state) {
    var i;
    var p = state.positions;
    var mView = camera.matrix();
    for (i = 0, j = 0; i < p.length; i+=3, j++) {
      xyz[0] = p[i];
      xyz[1] = p[i + 1];
      xyz[2] = p[i + 2];

      transform(xyz, xyz, camera.matrix());
      var x = (0.5 + 0.5 * xyz[0]) * window.innerWidth;
      var y = (0.5 - 0.5 * xyz[1]) * window.innerHeight;

      els[j].style.transform = 'translate3D(' + x + 'px,' + y + 'px, 0px)';
    }
  }
}
