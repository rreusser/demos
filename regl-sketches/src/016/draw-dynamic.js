module.exports = function (regl) {
  return regl({
    vert: `
      precision mediump float;
      uniform mat4 viewproj;
      attribute vec3 xyz;
      attribute vec3 color;
      uniform float pointSize;
      varying vec3 c;

      void main () {
        c = color;
        gl_Position = viewproj * vec4(xyz, 1);
        gl_PointSize = pointSize;
      }
    `,
    frag: `
      precision mediump float;
      varying vec3 c;

      void main () {
        float r2 = dot(gl_PointCoord - 0.5, gl_PointCoord - 0.5);
        if (r2 > 0.25) discard;
        gl_FragColor = vec4(c, 1);
      }
    `,
    attributes: {
      xyz: regl.prop('xyz'),
      color: regl.prop('color')
    },
    primitive: 'points',
    count: regl.prop('count')
  });
};
