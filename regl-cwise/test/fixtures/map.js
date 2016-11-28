'use strict';

module.exports = {
  args: [
    'scalar',
    {offset: [0, -1], array: 4},
    'array',
    {offset: [1, 0]},
    'array',
    {offset: [0, 1], array: 4},
    {offset: [1, 0], array: 4},
    'scalar',
    {offset: [-1, 0], array: 4}
  ],
  body: [
    'vec4 compute (float a, vec4 s, vec4 x, vec4 y, vec4 z, vec4 n, vec4 e, vec2 z, vec4 w) {',
    '  return a * x + y;',
    '}'
  ].join('\n'),
  hashLength: 0
};
