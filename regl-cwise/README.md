# regl-cwise

> A subset of [cwise](https://github.com/scijs/cwise) on the GPU

Computation on the GPU is completely different from computation on the CPU, so we'll never get a direct WebGL port of [cwise](https://github.com/scijs/cwise), but this repo implements some of the basic rudimentary function of cwise. Currently only a map operation is implemented, but a [scan operation](https://github.com/rreusser/demos/tree/master/regl-scan) and reduce operation are planned.

## Example

### axpy

Right now only the map operator is implemented. To compute `a * x + y`, for example, you'd write

```javascript
const regl = require('regl')({extensions: ['OES_texture_float']});
const reglcwise = require('<path-to-regl-cwise>')(regl);

const axpy = reglcwise.map({
  args: ['scalar', 'array', 'array'],
  body: `vec4 compute (float a, vec4 x, vec4 y) {
    return a * x + y;
  }`
});

axpy(z, a, x, y);
```

where `z` is a regl [framebuffer object](https://github.com/regl-project/regl/blob/gh-pages/API.md#framebuffers), `a` is a number, and `x` and `y` are either [framebuffer objects](https://github.com/regl-project/regl/blob/gh-pages/API.md#framebuffers) or [regl textures](https://github.com/regl-project/regl/blob/gh-pages/API.md#textures). There can only ever be a single output, which ends up in the first argument.

### Convolution

The convolution borrows from cwise syntax:

```javascript
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

blur(output, input, 0.5);
```

## License

&copy; 2016 Ricky Reusser. MIT License.
