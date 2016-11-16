# GPGPU with REGL

The goal today is to get a quick demo up and running in which we do some real calculations with [regl](http://regl.party).

```demo
var regl = require('regl')();

regl.frame(function () {
  regl.clear({color: [1, 1, 0, 0]});
});
```
