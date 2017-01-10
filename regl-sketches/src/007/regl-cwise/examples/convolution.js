const regl = require('regl')({extensions: ['OES_texture_float']});
const gpgpu = require('../')(regl);
const baboon = require('baboon-image').step(1, -1);

const blur = gpgpu.map({
  args: ['array', 'scalar',
    {array: 0, offset: [0, 1]},
    {array: 0, offset: [0, -1]},
    {array: 0, offset: [1, 0]},
    {array: 0, offset: [-1, 0]}
  ],
  body: `vec4 compute (vec4 x, float amount, vec4 n, vec4 s, vec4 e, vec4 w) {
    return (1.0 - amount) * x + amount * 0.25 * (n + s + e + w);
  }`
});

var draw = regl({
  frag: `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D img;
    void main () {
      gl_FragColor = vec4(texture2D(img, uv).xyz, 1);
    }
  `,
  vert: `
    varying vec2 uv;
    attribute vec2 xy;
    void main () {
      uv = 0.5 * (1.0 + xy);
      gl_Position = vec4(xy, 0, 1);
    }
  `,
  attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
  uniforms: {img: regl.prop('img')},
  depth: {enable: false},
  count: 3
});

const fbo = [
  gpgpu.array(baboon),
  gpgpu.array(baboon)
];

regl.frame(({tick}) => {
  var b1 = fbo[tick % 2];
  var b2 = fbo[(tick + 1) % 2];

  blur(b2, b1, 0.75);

  draw({img: b1});
});
