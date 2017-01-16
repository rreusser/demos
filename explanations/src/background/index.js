const invert = require('gl-mat4/invert');
const regl = require('regl')();
const camera = require('./camera')(regl, {damping: 0});

const draw = regl({
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
    uniform mat4 projection, view, iproj, iview;
    varying vec2 uv;
    void main () {
      // Compute the view-space position. The fourth component here is related
      // to perspective, so we need it:
      // vec4 sx = iproj * vec4(-uv, 0, 1);

      // Invert the *direction* of the view transform:
      // vec3 x = mat3(iview) * sx.xyz;

      // Here it is in short form:
      vec3 x = mat3(iview) * (iproj * vec4(-uv, 0, 1)).xyz;

      // Now we have an unnormalized direction. I'll compute polar coordinates:
      vec2 polar = vec2(atan(x.x, x.z), acos(x.y / length(x)));

      // Now make a nice pattern with it so we can see it:
      gl_FragColor = vec4(0.5 + 0.5 * cos(polar * 15.0), 0, 1);
    }
  `,
  attributes: {xy: [[-4, -4], [0, 4], [4, -4]]},
  depth: {enable: false},
  count: 3
});

const invertCamera = regl({
  uniforms: {
    iview: ctx => invert([], ctx.view),
    iproj: ctx => invert([], ctx.projection)
  }
});

regl.frame(() => camera(() => invertCamera(draw)));
