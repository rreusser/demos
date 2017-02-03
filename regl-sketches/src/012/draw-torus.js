const quads = require('./quads');
const tessellate = require('./tessellate');
const glslify = require('glslify');

module.exports = function (regl) {
  let nu = 72;
  let nv = 48;
  const torusQuads = quads(
    (u, v) => {
      let pu = (u - 0.5) * Math.PI * 2
      let pv = (v - 0.5) * Math.PI * 2
      return [
        Math.sin(pu) * (7 + 0.5 * Math.cos(pu / 3 - 2 * pv) + 2 * Math.cos(pu / 3 + pv)),
        Math.cos(pu) * (7 + 0.5 * Math.cos(pu / 3 - 2 * pv) + 2 * Math.cos(pu / 3 + pv)),
        0.5 * Math.sin(pu / 3 - 2 * pv) + 2 * Math.sin(pu / 3 + pv)
      ]
    },
    nu, nv,
    true,
    false, false,
    true, true,
    {uv: (u, v) => [u * nu, v * nv]}
  );

  const torus = tessellate(
    torusQuads.cells,
    torusQuads.positions,
    {uv: torusQuads.uv, normals: torusQuads.normals}
  );

  const drawTorus = regl({
    vert: glslify(`
      precision mediump float;

      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 auv;
      uniform mat4 projection, view;
      uniform vec3 eye;
      varying vec3 eyedir, n;
      varying vec2 uv;
      void main () {
        uv = auv;
        mat3 view3 = mat3(view);
        eyedir = view3 * normalize(position - eye);
        n = view3 * normalize(normal);

        gl_Position = projection * view * vec4(position, 1);
      }
    `),
    frag: glslify(`
      #extension GL_OES_standard_derivatives : enable

      precision mediump float;

      #pragma glslify: matcap = require(matcap)
      #pragma glslify: grid = require(glsl-solid-wireframe/cartesian/scaled)

      uniform float ugrid;
      uniform sampler2D texture;
      varying vec3 eyedir, n;
      varying vec2 uv;

      void main () {
        vec2 texuv = matcap(eyedir, n);
        vec3 color = texture2D(texture, texuv).xyz;
        color += (-0.1 * grid(uv, 1.0) + 0.1) * ugrid;
        gl_FragColor = vec4(color, 1);
      }
    `),
    cull: {enable: true, face: 'back'},
    uniforms: {
      texture: regl.prop('texture'),
      ugrid: regl.prop('grid')
    },
    attributes: {
      position: torus.positions,
      normal: torus.normals,
      auv: torus.uv,
    },
    elements: torus.cells,
    count: torus.cells.length * 3
  });

  return drawTorus;
};
