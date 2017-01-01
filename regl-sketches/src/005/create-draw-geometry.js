module.exports = function (regl, n) {
  function makeArrays (n) {
    let p = [];
    let e = [];

    let c = 0;
    for (let j = 0; j < n; j++) {
      let v = j / (n - 1) * 2 - 1;
      for (let i = 0; i < n; i++) {
        let u = i / (n - 1) * 2 - 1;
        p[c++] = [u, v];
      }
    }

    for (let j = 0; j < n - 1; j++) {
      for (let i = 0; i < n - 1; i++) {
        let idx = i + n * j;
        let va = idx;
        let vb = idx + 1;
        let vc = idx + n;
        let vd = idx + n + 1;

        p[c] = [
          (p[va][0] + p[vb][0] + p[vc][0] + p[vd][0]) * 0.25,
          (p[va][1] + p[vb][1] + p[vc][1] + p[vd][1]) * 0.25
        ];

        e.push([va, vb, c]);
        e.push([va, c, vc]);
        e.push([vc, c, vd]);
        e.push([vb, vd, c]);

        c++;
      }
    }

    return [e, p];
  }

  let arr = makeArrays(n);

  let ebuf = regl.elements({data: arr[0]});
  let pbuf = regl.buffer(arr[1]);

  let state = {
    positions: pbuf,
    elements: ebuf,
    nel: arr[0].length * 3
  };

  state.resize = function (n) {
    let arr = makeArrays(n);
    state.positions.destroy();
    state.elements.destroy();
    state.positions = regl.buffer(arr[1]);
    state.elements = regl.elements(arr[0]);
    state.nel = arr[0].length * 3;
  };

  return state;
}
