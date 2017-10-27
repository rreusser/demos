const glsl = require('glslify');

module.exports = function (regl, src) {
  return regl({
    vert: `
      precision mediump float;
      attribute vec2 xy;
      varying vec2 uv;
      void main () {
        uv = xy * 0.5 + 0.5;
        gl_Position = vec4(xy, 0, 1);
      }
    `,
    frag: glsl(`
      precision mediump float;

      #pragma glslify: colormap = require(glsl-colormap/cdom)
      #pragma glslify: random = require(glsl-random)

      varying vec2 uv;
      uniform sampler2D src;
      uniform vec2 resolution;
      uniform vec2 rng;
      uniform float time;
      void main () {
        vec4 color = texture2D(src, (0.5 - uv) / resolution + 0.5);
        gl_FragColor = vec4(vec3(
          colormap(clamp(
            1.0 - (rng.x + rng.y * color.w) +
            (random(gl_FragCoord.xy + time) - 0.5) * 0.07,
          0.0, 1.0))
        ), 1);
      }
    `),
    attributes: {xy: [-4, -4, 0, 4, 4, -4]},
    uniforms: {
      src: src,
      resolution: (ctx, props) => [
        64.0 / ctx.framebufferWidth * props.zoom,
        64.0 / ctx.framebufferHeight * props.zoom
      ],
      time: regl.context('time'),
      rng: (ctx, props) => {
        // (-x - min) / (max - min)
        return [
          -props.zmin / (props.zmax - props.zmin),
          1 / (props.zmax - props.zmin)
        ]
      }
    },
    depth: {enable: false},
    count: 3
  });
};
