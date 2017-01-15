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
    xmin: 2.5,
    xmax: 4,
    ymin: 0,
    ymax: 1,
  };

  let previ;
  mouseChange((btn, i) => {
    if (btn === 1 && previ !== undefined) {
      let dx = (params.xmax - params.xmin) * (i - previ) / window.innerWidth;
      let xmin0 = params.xmin;
      let xmax0 = params.xmax;
      let newXmin = Math.max(1.0, xmin0 - dx);
      let newXmax = Math.min(4.0, xmax0 - dx);
      if (newXmin > 0.0 && newXmax < 4.0 && (newXmin !== xmin0 || newXmax !== xmax0)) {
        params.xmin = newXmin;
        params.xmax = newXmax;
        refresh();
      }
    }
    previ = i;
  });

  mouseWheel((dx, dy, dz, ev) => {
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
    if (params.xmin !== xmin0 || params.xmax !== xmax0) refresh();
  });

  const samplerCoords = regl.buffer(new Array(width * height).fill(0).map((d, i) => [
    (i % width) / Math.max(1, width - 1),
    Math.floor(i / width) / Math.max(1, height - 1)
  ]));

  const textures = new Array(2).fill(0).map(() =>
    regl.texture({width: width, height: height, data: data, type: 'float32'})
  );

  const values = new Array(2).fill(0).map((d, i) =>
    regl.framebuffer({
      color: textures[i],
      depth: false,
    })
  );

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

  const iterate = () => {
    for (let i = needsAccel ? 100 : 1; i >= 0; i--) {
      iterateOp({src: values[0], dest: values[1]})
      swap(values);
    }
    accum++;
    needsAccel = false;
  };

  const drawPoints = regl({
    vert: `
      precision mediump float;
      attribute vec2 uv;
      uniform sampler2D data;
      uniform float select;
      void main () {
        vec4 p = texture2D(data, uv);
        vec2 y = p.xy * select + p.zw * (1.0 - select);
        gl_Position = vec4(y.x, y.y * 2.0 - 1.0, 0, 1);
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
    uniforms: {select: regl.prop('select')},
    attributes: {uv: samplerCoords},
    primitive: 'points',
    count: width * height
  });

  const swap = (arr) => {let tmp = arr[0]; arr[0] = arr[1]; arr[1] = tmp;}

  const buffer = regl.framebuffer({
    width: regl._gl.canvas.width,
    height: regl._gl.canvas.height,
    colorType: 'float',
    depth: false,
  })

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
        vec3 value = texture2D(src, uv).xyz;
        gl_FragColor = vec4(1.0 - value * scalar, 1);
      }
    `,
    attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
    uniforms: {src: regl.prop('src')},
    depth: {enable: false},
    count: 3
  });

  const setUniforms = regl({uniforms: {
    data: regl.prop('src'),
    scalar: ctx => {
      let ret = 0.1 / accum;
      ret *= 512 * 512 / width / height;
      ret /= 700 * 700 / ctx.viewportWidth / ctx.viewportHeight;
      return ret;
    },
    viewport: () => [
      (params.xmin + params.xmax) * 0.5,
      0.5 * (params.xmax - params.xmin),
      params.ymin, params.ymax
    ]
  }});

  let needsAccel = false;
  const refresh = () => {
    textures[0]({width: width, height: height, data: data, type: 'float32'});
    textures[1]({width: width, height: height, data: data, type: 'float32'});
    buffer.use(() => regl.clear({color: [0, 0, 0, 1]}));
    accum = 0;
    needsAccel = true;
  }

  refresh();

  regl.frame(({tick}) => {
    if (tick % 20 === 1 || needsAccel) {
      setUniforms({src: values[0]}, () => {
        iterate()
        buffer.use(() => drawPoints([{select: 0}, {select: 1}]));
      });

      setUniforms({src: values[0]}, () => {
        drawToScreen({src: buffer});
      });
    }

  });

}
