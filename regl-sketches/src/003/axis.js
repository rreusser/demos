module.exports = function (regl, opts) {
  opts = opts || {};
  opts.radius = opts.radius === undefined ? 1 : opts.radius;
  opts.alpha = opts.alpha === undefined ? 1 : opts.alpha;

  const draw = regl({
    frag: `
      precision mediump float;
      uniform vec4 color;
      void main () {
        gl_FragColor = color;
      }
    `,
    vert: `
      precision mediump float;
      attribute vec3 xyz;
      uniform mat4 view, projection;
      void main () {
        gl_Position = projection * view * vec4(xyz, 1);
      }
    `,
    blend: {
      enable: true,
      func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 'one minus src alpha', dstAlpha: 1},
      equation: {rgb: 'add', alpha: 'add'}
    },
    uniforms: {color: regl.prop('color')},
    elements: (context, props) => props.points.map((d, i) => i),
    attributes: {xyz: regl.prop('points')},
    count: (context, props) => props.points.length,
    primitive: 'lines'
  });

  return function () {
    draw([
      {points: [[ -opts.radius, 0, 0], [opts.radius, 0, 0]], color: [1, 0, 0, opts.alpha]},
      {points: [[ 0, -opts.radius, 0], [0, opts.radius, 0]], color: [0, 1, 0, opts.alpha]},
      {points: [[ 0, 0, -opts.radius], [0, 0, opts.radius]], color: [0, 0, 1, opts.alpha]}
    ]);
  };
}
