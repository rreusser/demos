# regl-(map|scan|reduce) API

## regl-map

To create a multiple-input-single-output map:

```javascript
var op = reglMap({
  args: ['array', {offset: [-1, 0], array: 1}, {offset: [1, 0], array: 1}, 'scalar'],
  body: `
    vec4 map(vec4 y2, vec4 y3, float fac) {
      return y2 + y3 * fac;
    }
  `
});

op.execute(fbout, fb1, fb2, 7.0);
```


To create a multiple-input-multiple-output map:

```javascript
var op = reglMap({
  args: ['fb1', 'fb2', 'fb3', 'multiplier'],
  output: ['fb1', 'fb2']
  op: [`
    vec4 map(vec4 y2, vec4 y3) {
      return y2 + y3;
    }
  `, `
    vec4 map(vec4 y1, float multiplier) {
      return y1 * multiplier;
    }
  `]
]);

op.execute(fb2, fb2, fb3, 7.0);
```

## regl-scan

To create a multiple-input-single-output scan:

```javascript
var op = reglScan({
  args: ['fb1', 'fb2', 'fb3', 'multiplier'],
  output: 'fb1',
  op: `
    vec4 scan(vec4 prefix, vec4 sum, float multiplier) {
      return y2 + y3 * multiplier;
    }
  `
});
```


To create a multiple-input-multiple-output scan:

```javascript
var op = reglScan({
  args: ['fb1', 'fb2', 'fb3', 'multiplier'],
  output: ['fb1', 'fb2']
  op: [`
    vec4 scan(vec4 prefix, vec4 y3) {
      return y2 + y3;
    }
  `, `
    vec4 scan(vec4 y1, float multiplier) {
      return y1 * multiplier;
    }
  `]
]);

