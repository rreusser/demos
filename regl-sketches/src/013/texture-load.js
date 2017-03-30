const resl = require('resl');

module.exports = function (regl, onDone) {
  let state = {texture: null}
  let texNum = 29;

  state.next = function (cb) {
    let filename = `../common/textures/${texNum > 9 ? '000' : '0000'}${texNum}.png`
    resl({
      manifest: {
        texture: {
          type: 'image',
          src: filename
        }
      },
      onDone: assets => {
        state.texture = (state.texture || regl.texture)({
          data: assets.texture,
          flipY: true,
          mag: 'linear',
        })
        cb && cb(assets)
      }
    })
    texNum = Math.max(1, (texNum + 1) % 50);
  }

  state.next(assets => onDone(regl, assets, state));

  window.addEventListener('keyup', e => e.keyCode === 32 && state.next());

  return state;
}
