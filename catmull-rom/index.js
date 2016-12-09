var length = require('gl-vec2/length');
var sub = require('gl-vec2/subtract');
var d3 = require('d3');
var h = require('h');


var ptcnt = h('input.pts', {type: 'number', value: 10});
document.body.appendChild(h('div.explanation', [
  h('h3', 'Catmull-Rom Splines'),
  h('p', `
The blue spline is an SVG path using plotly.js Catmull-Rom implementation. The black points
are the corresponding directly evaluated points. The math is all very simple, but it's a pain
to work through the details. Most important lesson learned: the tangents (obviously, in hindsight)
must either be computed in screen-space or scaled by the correct aspect ratio, otherwise they'll
be slightly incorrect.
`),
  ptcnt
]));

ptcnt.addEventListener('click', e => e.stopPropagation());
ptcnt.addEventListener('mousedown', e => e.stopPropagation());
ptcnt.addEventListener('mousemove', e => e.stopPropagation());
ptcnt.addEventListener('mouseup', e => e.stopPropagation());
ptcnt.addEventListener('input', reinitialize);

require('insert-css')(`
html, body {
  font-family: 'Helvetica', 'Arial', sans-serif;
}
h3 {
  margin-top: 0;
}

.pts {
  pointer-events: all;
}

svg {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}

canvas {
  cursor: move;
  vertical-align: top;
}

.explanation {
  max-width: 600px;
  padding: 10px;
  pointer-events: none;
  position: absolute;
  z-index: 100;
  top: 0;
  left: 0;
}
`);
//
// generalized Catmull-Rom splines, per
// http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf
var CatmullRomExp = 0.5;
var smoothopen = function(pts, smoothness) {
    if(pts.length < 3) { return 'M' + pts.join('L');}
    var path = 'M' + pts[0],
        tangents = [], i;
    for(i = 1; i < pts.length - 1; i++) {
        tangents.push(makeTangent(pts[i - 1], pts[i], pts[i + 1], smoothness));
    }
    path += 'Q' + tangents[0][0] + ' ' + pts[1];
    for(i = 2; i < pts.length - 1; i++) {
        path += 'C' + tangents[i - 2][1] + ' ' + tangents[i - 1][0] + ' ' + pts[i];
    }
    path += 'Q' + tangents[pts.length - 3][1] + ' ' + pts[pts.length - 1];
    return path;
};

function makeTangent(prevpt, thispt, nextpt, smoothness) {
    var d1x = prevpt[0] - thispt[0],
        d1y = prevpt[1] - thispt[1],
        d2x = nextpt[0] - thispt[0],
        d2y = nextpt[1] - thispt[1],
        d1a = Math.pow(d1x * d1x + d1y * d1y, CatmullRomExp / 2),
        d2a = Math.pow(d2x * d2x + d2y * d2y, CatmullRomExp / 2),
        numx = (d2a * d2a * d1x - d1a * d1a * d2x) * smoothness,
        numy = (d2a * d2a * d1y - d1a * d1a * d2y) * smoothness,
        denom1 = 3 * d2a * (d1a + d2a),
        denom2 = 3 * d1a * (d1a + d2a);
    return [
        [
            thispt[0] + (denom1 && numx / denom1),
            thispt[1] + (denom1 && numy / denom1)
        ], [
            thispt[0] - (denom2 && numx / denom2),
            thispt[1] - (denom2 && numy / denom2)
        ]
    ];
}

var svg = d3.select('body').append('svg')
  .attr('width', window.innerWidth)
  .attr('height', window.innerHeight)
  .style('stroke', 'blue')
  .style('opacity', 0.2)
  .style('fill', 'none')

var path = svg.append('path');

// generalized Catmull-Rom splines, per
// http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf
var CatmullRomExp = 0.5;
function makeContinuousTangent(p0, p1, p2, smoothness) {
  var d1x = p0[0] - p1[0],
      d1y = p0[1] - p1[1],
      d2x = p2[0] - p1[0],
      d2y = p2[1] - p1[1],
      d1a = Math.pow(d1x * d1x + d1y * d1y, CatmullRomExp / 2),
      d2a = Math.pow(d2x * d2x + d2y * d2y, CatmullRomExp / 2),
      numx = (d2a * d2a * d1x - d1a * d1a * d2x) * smoothness,
      numy = (d2a * d2a * d1y - d1a * d1a * d2y) * smoothness,
      denom1 = 3 * d2a * (d1a + d2a),
      denom2 = 3 * d1a * (d1a + d2a);
    var dxL = p1[0] + (denom1 && numx / denom1);
    var dyL = p1[1] + (denom1 && numy / denom1);
    var dxU = p1[0] - (denom2 && numx / denom2);
    var dyU = p1[1] - (denom2 && numy / denom2);

  return [[dxL, dyL], [dxU, dyU]];
}

window.createSplineEvaluator = function splineEvaluator (pts, smoothness) {
  if (pts.length < 3) {
    return function (t) {
      console.log('t:', t);
      var x = (1 - t) * pts[0][0] + t * pts[1][0];
      var y = (1 - t) * pts[0][1] + t * pts[1][1];
      return [x, y];
    };
  } else {
    // Compute the tangents *once* at the beginning, and store them:
    var tangents = [];
    for(i = 1; i < pts.length - 1; i++) {
        tangents.push(makeContinuousTangent(pts[i - 1], pts[i], pts[i + 1], smoothness));
    }

    return function (param) {
      var a, b, c, d, p0, p1, p2, p3, i, t, ot;
      param = Math.max(0, Math.min(pts.length - 1, param));
      i = Math.min(Math.floor(param), pts.length - 2);
      t = param - i;
      ot = 1 - t;

      p0 = pts[i];
      p3 = pts[i + 1];

      if (i === 0 || i === pts.length - 2) {
        // Evaluate the quadratic first and last segments;
        p1 = i === 0 ? tangents[i][0] : tangents[i - 1][1];
        a = ot * ot;
        b = 2 * ot * t;
        c = t * t;
        return [
          a * p0[0] + b * p1[0] + c * p3[0],
          a * p0[1] + b * p1[1] + c * p3[1]
        ];
      } else {
        // Evaluate internal cubic spline segments:
        p1 = tangents[i - 1][1];
        p2 = tangents[i][0];
        p3 = pts[i + 1];

        a = ot * ot * ot;
        b = 3 * ot * ot * t;
        c = 3 * ot * t * t;
        d = t * t * t;

        return [
          a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
          a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]
        ];
      }
    }
  }
}

function nearestPoint (pts, xy) {
  var lmin = Infinity;
  var hit;
  for (var i = 0; i < pts.length; i++) {
    var dist = length(sub([], xy, pts[i]));
    if (dist < lmin) {
      lmin = dist;
      hit = pts[i];
    }
  }
  return hit;
}

var pbuttons, nearest;
require('mouse-change')(function (buttons, i, j) {
  if (buttons && 0x01) {
    var xy = [
      2 * i / window.innerWidth - 1,
      2 * (1 - j / window.innerHeight) - 1
    ];

    if (!pbuttons) {
      nearest = nearestPoint(controlPoints, xy);
    }

    nearest[0] = xy[0];
    nearest[1] = xy[1];
    update();
  }

  pbuttons = buttons;
});

function r (t) {
  return Math.sin(2 * t * Math.PI) * 0.5;
}

var controlPoints = [];
function reinitialize () {
  controlPoints = [];
  var cnt = parseInt(ptcnt.value);
  for (var j = 0; j < cnt; j++) {
    var t = j / (cnt - 1) * 2 - 1;
    controlPoints.push([t * 0.5, r(t)]);
  }
  nctrl = controlPoints.length;

  update();
}

var cpScreen = [];

var regl = require('regl')();
var nctrl = controlPoints.length;
var controlPointBuf;
var neval = 100;
var evalPoints = [];
var evalPointBuf;

var dirty = true;
function update () {
  dirty = true;

  cpScreen = [];
  for (i = 0; i < controlPoints.length; i++) {
    cpScreen[i] = [
      (controlPoints[i][0] + 1) * 0.5 * window.innerWidth,
      (-controlPoints[i][1] + 1) * 0.5 * window.innerHeight
    ];
  }

  controlPointBuf = (controlPointBuf ? controlPointBuf : regl.buffer)(cpScreen);

  evaluator = createSplineEvaluator(cpScreen, 1);

  for (var i = 0; i < neval; i++) {
    evalPoints[i] = evaluator(i / neval * (cpScreen.length - 1));
  }

  evalPointBuf = (evalPointBuf ? evalPointBuf : regl.buffer)(evalPoints);

  path.attr('d', smoothopen(cpScreen, 1.0));
}

reinitialize();

var drawPoints = regl({
  frag: `
    precision mediump float;
    uniform vec3 color;
    void main () {
      if(length(gl_PointCoord.xy - 0.5) > 0.5) discard;
      gl_FragColor = vec4(color, 1);
    }
  `,
  vert: `
    precision mediump float;
    attribute vec2 xy;
    uniform float w, h;
    uniform float rad;
    void main () {
      gl_Position = vec4((xy * vec2(1.0 / w, 1.0 / h) * 4.0 - 1.0) * vec2(1.0, -1.0), 0, 1);
      gl_PointSize = rad;
    }
  `,
  attributes: {
    xy: {
      buffer: regl.prop('xy'),
      stride: 8
    }
  },
  count: regl.prop('n'),
  uniforms: {
    w: regl.context('viewportWidth'),
    h: regl.context('viewportHeight'),
    rad: regl.prop('rad'),
    color: regl.prop('color')
  },
  primitive: 'points',
  depth: {enable: false},
});

regl.frame(({tick}) => {
  if (!dirty) return;
  dirty = false;
  drawPoints({xy: evalPointBuf, n: neval, rad: 5, color: [0, 0, 0]});
  drawPoints({xy: controlPointBuf, n: nctrl, rad: 10, color: [1, 0, 0]});
});
