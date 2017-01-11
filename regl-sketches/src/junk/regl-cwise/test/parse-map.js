'use strict';

var parseMap = require('../parsers/map');
var test = require('tape');

test('parseMap', function (t) {
  var input = require('./fixtures/map');
  var expected = require('./fixtures/map.parsed');

  var parsed = parseMap(input);

  // This is just a shortcut since there are no other props.
  t.deepEqual(parsed, expected);

  // This is the same thing via manual comparisons:
  // t.equal(parsed.frag, expected.frag);
  // t.equal(parsed.vert, expected.vert);
  // t.equal(parsed.attrName, expected.attrName);
  // t.equal(parsed.destProp, expected.destProp);
  // t.deepEqual(parsed.invokeArgs, expected.invokeArgs);

  t.end();
});
