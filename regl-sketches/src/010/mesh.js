module.exports = function (xy, nr, nth, rrange, thrange) {
  let x = [];
  let y = [];
  let r0, r1, th0, th1, rc, thc;
  let positions = [];
  let cells = [];
  let cnt = 0;
  for (i = 0; i < nr - 1; i++) {
    for (j = 0; j < nth - 1; j++) {
      r0 = rrange[0] + (rrange[1] - rrange[0]) * i / (nr - 1);
      r1 = rrange[0] + (rrange[1] - rrange[0]) * (i + 1) / (nr - 1);
      th0 = thrange[0] + (thrange[1] - thrange[0]) * j / (nth - 1);
      th1 = thrange[0] + (thrange[1] - thrange[0]) * (j + 1) / (nth - 1);

      let a = xy(r0, th0);
      let b = xy(r0, th1);
      let c = xy(r1, th0);
      let d = xy(r1, th1);
      /*let e = [
        0.25 * (a[0] + b[0] + c[0] + d[0]),
        0.25 * (a[1] + b[1] + c[1] + d[1])
      ];*/
      var e = xy(0.5 * (r0 + r1), 0.5 * (th0 + th1));

      let ia = cnt++;
      let ib = cnt++;
      let ic = cnt++;
      let id = cnt++;
      let ie = cnt++;

      positions.push(a);
      positions.push(b);
      positions.push(c);
      positions.push(d);
      positions.push(e);

      cells.push([ia, ib, ie]);
      cells.push([ic, ia, ie]);
      cells.push([id, ic, ie]);
      cells.push([ib, id, ie]);
    }
  }

  return {
    positions: positions,
    cells: cells
  }
}
