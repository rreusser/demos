# lorenz

This demo computes the lorenz attractor on the GPU using a [cwise](https://github.com/scijs/cwise)-inspired library for GPU computation. The syntax is very similar to cwise, except there always must be exactly one output. For example, a simple Euler step of the attractor would look like:


```javascript
// Initialize a context for 1000 points:
const gpu = require('./gpuwise')(regl, 1000);

// Instantiate two texture variables. We'll bounce back and forth
// between them as we update:
var y1 = gpu.variable(i => [Math.random(), Math.random(), Math.random(), 1]);
var y2 = gpu.variable();

// Define an operation:
var lorenz = gpu.operation({
  args: ['array', 'scalar'],
  body: `
    vec4 compute (vec4 y, float dt) {
      return y + dt * vec4(
        10.0 * (y.y - y.x),
        y.x * (28.0 - y.z) - y.y,
        y.x * y.y - 8.0 / 3.0 * y.z,
        0.0
      );
    }
  `,
});

// Execute the operation:
lorenz(y2, y1, 0.001);

// Read the values:
var result = y2.read();

// Or use them elsewhere within webgl/regl:
var texture = y2.texture
var fbo = y2.getFramebuffer();
```

## License
&copy 2016 Ricky Reusser. MIT License.

