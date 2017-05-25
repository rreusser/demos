module.exports = function (regl) {
  const ret = regl({
    vert: `
      precision mediump float;
      attribute vec3 position, normal;
      uniform mat4 projection, view;
      varying vec3 n;
      void main () {
        n = normal;
        gl_Position = projection * view * vec4(position, 1);
      }
    `,
    frag: `
      #extension GL_EXT_draw_buffers : require

      precision mediump float;
      uniform vec3 diffuse, ambient;
      uniform float roughness, fresnel, specular;
      varying vec3 n;
      void main () {
        gl_FragData[0] = vec4(n, gl_FragCoord.z);
        gl_FragData[1] = vec4(diffuse, 0);
        gl_FragData[2] = vec4(ambient, 0);
        gl_FragData[3] = vec4(specular, roughness, fresnel, 0);
      }
    `,
    depth: {enable: true},
    cull: {enable: true},
    attributes: {
      position: regl.prop('positions'),
      normal: regl.prop('normals'),
    },
    uniforms: {
      diffuse: regl.prop('diffuse'),
      ambient: regl.prop('ambient'),
      specular: regl.prop('specular'),
      roughness: regl.prop('roughness'),
      fresnel: regl.prop('fresnel'),
    },
    elements: (ctx, props) => props.cells,
    count: (ctx, props) => props.cells.length * 3
  });

  return ret;
};
