const h = require('h');
require('insert-css')(`
.explanation {
  position: absolute;
  z-index: 100;
  top: 5px;
  left: 5px;
  font-family: sans-serif;
  font-style: italic;
}
.explanation h4 {
  margin: 0;
}
`);
const glsl = require('glslify');
const mouse = require('mouse-event');
const mouseWheel = require('mouse-wheel');
const mouseChange = require('mouse-change');
const regl = require('regl')({
  extensions: ['OES_texture_float'],
  onDone: (err, regl) => {
    if (err) return require('fail-nicely')(err);
    document.querySelector('canvas').addEventListener('mousewheel', e => e.preventDefault());
    run(regl);
  }
});

function run (regl) {
  const explanation = h('div.explanation', [
    h('h4', 'Logistic Map'),
    h('div', 'Drag and scroll to pan/zoom. Shift to zoom vertically')
  ]);
  document.body.appendChild(explanation);

  let accum = 0;
  const width = 512;
  const height = 512;

  const data = new Float32Array(width * height * 4);
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      let idx = i + height * j;
      data[4 * idx] = Math.random() * 2.0 - 1.0;
      data[4 * idx + 1] = Math.random();
      data[4 * idx + 2] = Math.random() * 2.0 - 1.0;
      data[4 * idx + 3] = Math.random();
    }
  }

  const params = {
    xmin: 1,
    xmax: 4,
    ymin: 0.0,
    ymax: 1,
  };

  let previ, prevj;
  let shift = false;
  mouseChange((btn, i, j, mods) => {
    shift = mods.shift;
    if (btn === 1 && previ !== undefined) {
      let dx = (params.xmax - params.xmin) * (i - previ) / window.innerWidth;
      let dy = -(params.ymax - params.ymin) * (j - prevj) / window.innerHeight;
      let xmin0 = params.xmin;
      let xmax0 = params.xmax;
      let ymin0 = params.ymin;
      let ymax0 = params.ymax;
      let newXmin = Math.max(1.0, xmin0 - dx);
      let newXmax = Math.min(4.0, xmax0 - dx);
      let newYmin = Math.max(0.0, ymin0 - dy);
      let newYmax = Math.min(1.0, ymax0 - dy);

      params.xmin = Math.max(0, newXmin);
      params.xmax = Math.min(4, newXmax);
      params.ymin = Math.max(0, newYmin);
      params.ymax = Math.min(1, newYmax);

      if (newXmin !== xmin0 || newXmax !== xmax0 || newYmin !== ymin0 || newYmax !== ymax0) {
        needsAccel = false;
        needsQuick = true;
      }
    }
    previ = i;
    prevj = j;
  });

  mouseWheel((dx, dy, dz, ev) => {
    if (shift) {
      let y0 = params.ymin + (params.ymax - params.ymin) * (1 - mouse.y(ev) / window.innerHeight);
      let ymin0 = params.ymin;
      let ymax0 = params.ymax;
      let yp = params.ymax - y0;
      let ym = y0 - params.ymin;
      let zoom = Math.exp(dy / 50.0);
      ym *= zoom;
      yp *= zoom;
      params.ymin = Math.max(0, y0 - ym);
      params.ymax = Math.min(1, y0 + yp);
      if (params.ymin !== ymin0 || params.ymax !== ymax0) {
        needsAccel = false;
        needsQuick = true;
      }

    } else {
      let x0 = params.xmin + (params.xmax - params.xmin) * mouse.x(ev) / window.innerWidth;
      let xmin0 = params.xmin;
      let xmax0 = params.xmax;
      let xp = params.xmax - x0;
      let xm = x0 - params.xmin;
      let zoom = Math.exp(dy / 50.0);
      xm *= zoom;
      xp *= zoom;
      params.xmin = Math.max(1.0, x0 - xm);
      params.xmax = Math.min(4.0, x0 + xp);
      if (params.xmin !== xmin0 || params.xmax !== xmax0) {
        needsAccel = false;
        needsQuick = true;
      }
    }
  });

  const samplerCoords = regl.buffer(new Array(width * height).fill(0).map((d, i) => [
    (i % width) / Math.max(1, width - 1),
    Math.floor(i / width) / Math.max(1, height - 1)
  ]));

  const initial = regl.texture({width: width, height: height, data: data, type: 'float32'});

  const values = new Array(2).fill(0).map((d, i) =>
    regl.framebuffer({
      color: regl.texture({width: width, height: height, data: data, type: 'float32'}),
      depth: false,
    })
  );

  const initializeOp = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (1.0 + xy);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D src;
      void main () {
        gl_FragColor = texture2D(src, uv);
      }
    `,
    framebuffer: regl.prop('dest'),
    uniforms: {src: initial},
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    depth: {enable: false},
    count: 3
  });

  const iterateOp = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (1.0 + xy);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D src;
      uniform vec4 viewport;
      void main () {
        vec4 p = texture2D(src, uv);
        float r = viewport.x + viewport.y * p.x;
        p.y = r * p.y * (1.0 - p.y);
        r = viewport.x + viewport.y * p.z;
        p.w = r * p.w * (1.0 - p.w);
        gl_FragColor = p;
      }
    `,
    framebuffer: regl.prop('dest'),
    uniforms: {src: regl.prop('src')},
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    depth: {enable: false},
    count: 3
  });

  const drawPoints = regl({
    vert: `
      precision mediump float;
      attribute vec2 uv;
      uniform sampler2D data;
      uniform float select;
      uniform vec4 viewport;
      void main () {
        vec4 p = texture2D(data, uv);
        vec2 y = p.xy * select + p.zw * (1.0 - select);
        gl_Position = vec4(y.x, y.y * viewport.z + viewport.w, 0, 1);
        gl_PointSize = 1.0;
      }
    `,
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(1);
      }
    `,
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    uniforms: {
      data: regl.prop('src'),
      select: regl.prop('select')
    },
    framebuffer: regl.prop('dest'),
    attributes: {uv: samplerCoords},
    primitive: 'points',
    count: width * height
  });

  const swap = (arr) => {let tmp = arr[0]; arr[0] = arr[1]; arr[1] = tmp;}

  const buffers = new Array(2).fill(0).map(() => regl.framebuffer({
    width: regl._gl.canvas.width,
    height: regl._gl.canvas.height,
    colorType: 'float',
    depth: false,
  }));

  const decay = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (1.0 + xy);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      uniform sampler2D src;
      varying vec2 uv;
      uniform float decay;
      void main () {
        float col = texture2D(src, uv).x;
        gl_FragColor = vec4(col * decay, 0, 0, 1);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {
      src: regl.prop('src'),
      decay: () => decayConst,
    },
    framebuffer: regl.prop('dest'),
    depth: {enable: false},
    count: 3
  });

  const drawToScreen = regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = 0.5 * (1.0 + xy);
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: `
      precision mediump float;
      uniform sampler2D src;
      uniform float scalar;
      varying vec2 uv;
      void main () {
        float value = texture2D(src, uv).x;
        gl_FragColor = vec4(vec3(1.0 - value * scalar), 1);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {src: regl.prop('src')},
    depth: {enable: false},
    count: 3
  });

  const setUniforms = regl({uniforms: {
    scalar: ctx => {
      let ret = 0.1 / accum;
      ret *= 512 * 512 / width / height;
      ret /= 700 * 700 / ctx.viewportWidth / ctx.viewportHeight;
      ret /= Math.sqrt(params.ymax - params.ymin);
      return ret;
    },
    viewport: () => [
      (params.xmin + params.xmax) * 0.5,
      0.5 * (params.xmax - params.xmin),
      1.0 / (params.ymax - params.ymin) * 2,
      -params.ymin / (params.ymax - params.ymin) * 2 - 1
    ]
  }});

  let needsQuick = false;
  let needsAccel = true;
  let decayConst = 0.98;

  const iterate = () => {
    let iters = needsAccel ? 100 : (needsQuick ? 20 : 1);

    if (needsQuick || needsAccel) refresh();

    for (let i = iters; i >= 0; i--) {
      iterateOp({src: values[0], dest: values[1]})
      swap(values);
    }

    accum *= decayConst;
    accum++;

    if (needsQuick) {
      needsQuick = false;
      needsAccel = true;
    } else if (needsAccel) {
      needsAccel = false;
      needsQuick = false;
    }

  };

  const refresh = () => {
    initializeOp({dest: values[0]});
    buffers[0].use(() => regl.clear({color: [0, 0, 0, 1]}));
    accum = 0;
  }

  refresh();

  regl.frame(({tick}) => {
    setUniforms(() => {
      iterate();

      drawPoints([
        {src: values[0], select: 0, dest: buffers[0]},
        {src: values[0], select: 1, dest: buffers[0]}
      ])

      decay({src: buffers[0], dest: buffers[1]})

      drawToScreen({src: buffers[0]});
    });

    swap(buffers);
  });

}
