const quads = require('./quads');
const tessellate = require('./tessellate');
const glslify = require('glslify');

module.exports = function (regl) {
  const torusQuads = quads(
    (u, v) => {
      let pu = (u - 0.5) * Math.PI * 2
      let pv = (v - 0.5) * Math.PI * 2
      return [
        Math.sin(pu) * (7 + Math.cos(pu / 3 - 2 * pv) + 2 * Math.cos(pu / 3 + pv)),
        Math.cos(pu) * (7 + Math.cos(pu / 3 - 2 * pv) + 2 * Math.cos(pu / 3 + pv)),
        Math.sin(pu / 3 - 2 * pv) + 2 * Math.sin(pu / 3 + pv)
      ]
    },
    72, 48,
    true,
    false, false,
    true, true,
    {uv: (u, v) => [u, v]}
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
      uniform mat4 projection, view;
      uniform vec3 eye;
      varying vec3 eyedir, n;
      void main () {
        mat3 view3 = mat3(view);
        eyedir = view3 * normalize(position - eye);
        n = view3 * normalize(normal);

        gl_Position = projection * view * vec4(position, 1);
      }
    `),
    frag: glslify(`
      precision mediump float;

      #pragma glslify: matcap = require(matcap)

      uniform sampler2D texture;
      varying vec3 eyedir, n;

      void main () {
        vec2 uv = matcap(eyedir, n);

        gl_FragColor = vec4(texture2D(texture, uv).xyz, 1);
      }
    `),
    cull: {enable: true, face: 'back'},
    uniforms: {
      texture: regl.prop('texture')
    },
    attributes: {
      position: torus.positions,
      normal: torus.normals,
    },
    elements: torus.cells,
    count: torus.cells.length * 3
  });

  return drawTorus;
};
