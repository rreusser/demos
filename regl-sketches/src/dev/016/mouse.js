module.exports = function () {
  var pos = [0, 1000];

  window.addEventListener('mousemove', function (e) {
    pos[0] = e.clientX / window.innerWidth * 2 - 1;
    pos[1] = (1 - e.clientY / window.innerHeight) * 2 - 1;
  });

  return pos;
}
