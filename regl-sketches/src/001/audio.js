const analyse = require('web-audio-analyser');

module.exports = function (cb) {
  var div = require('soundcloud-badge')({
    client_id: 'ded451c6d8f9ff1c62f72523f49dab68',
    song: 'https://soundcloud.com/madeinheights/viices',
    dark: false,
    getFonts: true
  }, function(err, src, json) {
    var audio = new Audio;
    audio.src = src;
    audio.crossOrigin = "anonymous";

    audio.addEventListener('canplay', function() {
      analyser = analyse(audio, { audible: true, stereo: false })
      analyser.analyser.smoothingTimeConstant = 0.5;
      audio.play()

      cb && cb(err, src, json, audio, analyser);
    })
  });
}
