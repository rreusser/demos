var hsl2rgb = require('float-hsl2rgb');

const regl = require('regl')({
  pixelRatio: 1,
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    document.querySelector('canvas').addEventListener('mousewheel', e => e.preventDefault());
    run(regl);
  }
});

function run (regl) {
  var camera = require('./camera')(regl, {
    distance: 1.5,
    fovy: 1.5
  });

  var phasemult = 2;
  require('mouse-change')(function (b, x, y) {
    phasemult = x / window.innerWidth * 60.0;
  });

  var mbsamples = 11;
  var rotation = [];
  var offsets = [];
  var colors = [];
  var n = 30;
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < 6; j++) {
      var rot = i / n * Math.PI * 2;
      var phase = i / n * Math.PI;
      rotation.push([Math.cos(rot), Math.sin(rot), phase]);
      colors.push(hsl2rgb([(rot * 0.5 / Math.PI) % 1, 0.5, 0.5]));
    }
    offsets = offsets.concat([-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]);
  }

  var drawSprites = regl({
    vert: `
      precision mediump float;
      attribute vec3 rot;
      attribute vec2 offset;
      attribute vec3 color;
      varying vec2 uv;
      varying vec3 col;
      uniform float phasemult;
      uniform float size, time, tshift;
      uniform mat4 projection, view;
      void main () {
        float t = time + tshift + rot.z * phasemult;
        vec2 xy = vec2(cos(t), sin(t));
        vec3 xyz = vec3(
          xy.x,
          xy.y * rot.x,
          xy.y * rot.y
        );
        uv = offset;
        col = color;
        gl_Position = projection * (view * vec4(xyz, 1) + vec4(size * offset, 0, 0));
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 uv;
      varying vec3 col;
      uniform float alphamult;
      void main () {
        float r2 = dot(uv, uv);
        if (r2 > 1.0) discard;
        gl_FragColor = vec4(col, alphamult);
      }
    `,
    depth: {enable: false},
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    attributes: {
      rot: rotation,
      offset: offsets,
      color: colors,
    },
    uniforms: {
      size: 0.05,
      time: ctx => ctx.time * 2,
      phasemult: () => phasemult,
      alphamult: 1.0 / mbsamples,
      tshift: regl.prop('tshift')
    },
    count: n * 6
  });

  const drawBg = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = xy;
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 uv;
      void main () {
        float r2 = dot(uv, uv);
        gl_FragColor = vec4(vec3(0.2 - r2 * 0.1), 1);
      }
    `,
    attributes: {
      xy: [[-4, -4], [0, 4], [4, -4]]
    },
    depth: {enable: false},
    count: 3
  });


  var t0 = 0;
  var tshift = [];
  for (i = 0; i < mbsamples; i++) {
    tshift.push({tshift: (i - (mbsamples - 1) / 2) / mbsamples / 60.0 * 5.0});
  }
  regl.frame(data => {
    var dt = data.time - t0;
    t0 = data.time;

    drawBg();
    camera(() => {
      drawSprites(tshift);
    });
  })

}
