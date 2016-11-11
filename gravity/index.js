const container = document.createElement('div');
container.id = 'container';
document.body.appendChild(container);

const ndarray = require('ndarray');
const regl = require('regl')({
  extensions: ['OES_texture_float'],
  container: container
});

const radius = 512;
const initialConditions = new Float32Array((Array(radius * radius * 4)).fill(0).map(Math.random));


var n = 100;//262144;
var xy = new Float32Array(n * 2);
for (var i = 0; i < n; i++) {
  xy[i * 2] = Math.random() * 2 - 1;
  xy[i * 2 + 1] = Math.random() * 2 - 1;
}

const fbo = regl.framebuffer({
  color: regl.texture({
    radius: radius,
    data: initialConditions,
    wrap: 'repeat'
  }),
  colorFormat: 'rgba',
  colorType: 'float',
  depthStencil: false
});


const setupQuad = regl({
  vert: `
    precision mediump float;
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      uv = 0.5 * (position + 1.0);
      gl_Position = vec4(position, 0, 1);
    }
  `,
  attributes: {
    position: [ -4, -4, 4, -4, 0, 4 ]
  },
  uniforms: {
    fbo: fbo
  },
  depth: { enable: false },
  count: 3
})

const splatParticles = regl({
  vert: `
    precision mediump float;
    attribute vec2 xy;
    void main () {
      gl_Position = vec4(xy, 0, 1);
      gl_PointSize = 40.0;
    }
  `,
  frag: `
    precision mediump float;
    void main () {
      vec2 uv = 2.0 * (gl_PointCoord - 0.5);
      float rad = length(uv);
      float opac = 1.0;
      gl_FragColor = vec4(1.0, 1.0, 1.0, opac * (1.0 - rad));
    }
  `,
  attributes: {
    xy: regl.prop('xy')
  },
  blend: {
    enable: true,
    func: {
      srcRGB: 'src alpha',
      srcAlpha: 1,
      dstRGB: 'one minus src alpha',
      dstAlpha: 1
    },
    equation: {
      rgb: 'add',
      alpha: 'add'
    },
    color: [0, 0, 0, 0]
  },
  primitive: 'points',
  count: n,
  depth: {enable: false},
  //framebuffer: fbo,
});

regl.frame(({tick}) => {
  if (tick > 1) return;
  regl.clear({color: [0, 0, 0, 1]});
  setupQuad(() => {
    //regl.draw();
    splatParticles({xy: xy, n: n});
  })
});
