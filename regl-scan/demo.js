const numerify = require('glsl-numerify');
const quad = require('glsl-quad');
const ext = require('util-extend');
const h = require('h');
const css = require('insert-css');

const zoom = 2;
const numSize = 16;
const hei = 2.1;
const size = {width: 16, height: 16};
const matSize = {width: (numSize * size.width + 1) * zoom, height: (numSize * size.height + 1) * zoom};
const screenSize = {width: (numSize * size.width + 1) * zoom, height: (numSize * size.height * hei + 1) * zoom};

css(`
  body, html {
    margin: 0;
    padding: 0;
    text-align: center;
    font-family: 'Helvetica' ,'Arial', sans-serif;
    color: #444;
  }
  canvas {
    margin-left: auto;
    margin-right: auto;
  }
  h1 {
    margin-top: 2em;
  }
  p {
    text-align: left;
    padding: 0 10px 40px;
    line-height: 1.4;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
`);

const ww = Math.min(500, window.innerWidth);
const wh = ww * 2.1;
const canvas = h('canvas', {style: {width: ww + 'px', height: wh + 'px', 'margin-left': 'auto', 'margin-right': 'auto'}});
canvas.width = ww * 2;
canvas.height = wh * 2;

document.body.appendChild(h('div', [
  h('h1', 'regl-scan'),
  h('p', `
    The demo below computes the scan operation from left to right an then from
    bottom to top. The first matrix contains the input. Each cell in the lower matrix
    contains the sum of all of the numbers in the rectangle from it to the cell
    in the lower-left corner.
  `)
]));

document.body.appendChild(canvas);

const regl = require('regl')({canvas: canvas});

const prefixSum = require('./')(regl, {
  reduce: `vec4 reduce(vec4 prefix, vec4 sum) {
    return prefix + sum;
  }`
});

const input = new Uint8Array(size.width * size.height * 4);
for (let j = 0; j < size.height; j++) {
  for (let i = 0; i < size.width; i++) {
    input[(i + j * size.width) * 4] = Math.floor(Math.random() * 2.5);
  }
}

var fbos = {
  orig: regl.framebuffer({color: regl.texture(ext({data: input}, size))}),
  src: regl.framebuffer({color: regl.texture(ext({data: input}, size))}),
  dest: regl.framebuffer({color: regl.texture(ext({data: input}, size))}),
  num1: regl.framebuffer({color: regl.texture(matSize)}),
  num2: regl.framebuffer({color: regl.texture(matSize)})
};

const drawToScreen = regl({
  vert: `
    precision mediump float;
    attribute vec2 xy;
    attribute vec2 uvs;
    varying vec2 uv;
    uniform vec2 scale, shift, ar;
    void main () {
      uv = uvs;
      gl_Position = vec4(xy * scale / ar + shift, 0, 1);
    }
  `,
  frag: `
    precision mediump float;
    uniform sampler2D src;
    varying vec2 uv;
    void main () {
      gl_FragColor = texture2D(src, uv);
    }
  `,
  attributes: {
    xy: quad.verts,
    uvs: quad.uvs
  },
  uniforms: {
    src: regl.prop('src'),
    scale: regl.prop('scale'),
    shift: regl.prop('shift'),
    ar: (context) => [context.viewportWidth / context.viewportHeight * hei, 1]
  },
  count: 6
});

const drawNumbers = regl({
  frag: numerify.makeFrag({
    multiplier: 255,
    sourceSize: `vec2(${size.width}, ${size.height})`,
    destinationSize: `vec2(${size.width * numSize + 1}, ${size.height * numSize + 1})`,
    destinationCellSize: `vec2(${numSize}, ${numSize})`
  }),
  vert: numerify.makeVert(),
  attributes: {a_position: quad.verts, a_uv: quad.uvs},
  elements: quad.indices,
  framebuffer: regl.prop('dest'),
  uniforms: {
    source_texture: regl.prop('src'),
    digits_texture: regl.prop('digits'),
    u_clip_y: 1
  }
});

const digitImg = new Image();

digitImg.addEventListener('load', function () {
  const digits = regl.texture({data: digitImg, flipY: true});

  regl.frame(({tick}) => {
    // Redraw every now and then just in case
    if (tick % 30 !== 1) return;
    ext(fbos, prefixSum.compute({src: fbos.src, dest: fbos.dest, axis: 0}));
    ext(fbos, prefixSum.compute({src: fbos.dest, dest: fbos.src, axis: 1}));

    drawNumbers({src: fbos.orig, dest: fbos.num1, digits});
    drawNumbers({src: fbos.dest, dest: fbos.num2, digits});

    drawToScreen({src: fbos.num1, scale: [1, 1 / hei], shift: [0, 1 - 1 / hei]});
    drawToScreen({src: fbos.num2, scale: [1, 1 / hei], shift: [0, -1 + 1 / hei]});
  });
})

digitImg.src = numerify.digits.uri;
