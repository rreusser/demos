const regl = require('regl')({extensions: ['OES_texture_float']});
const gpgpu = require('../')(regl);
const iota = require('iota-array');
const show = require('ndarray-show');

const shape = [2, 2, 4];
const n = shape.reduce((a, b) => a * b);

const a = 2.0;
const x = gpgpu.array(iota(n), shape);
const y = gpgpu.array(iota(n), shape);
const z = gpgpu.array(null, shape);

const op = gpgpu.map({
  args: ['scalar', 'array', 'array'],
  body: `vec4 compute (float a, vec4 x, vec4 y) {
    return a * x + y;
  }`
});

op(z, a, x, y);

console.log('x =\n' + show(x.read()));
console.log('y =\n' + show(y.read()));
console.log(a + ' * x + y =\n' + show(z.read()));
