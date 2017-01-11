'use strict';

module.exports = parseGpgpuMap;

var uniqAttr = require('../lib/uniq-attr');
var parseFunction = require('../lib/parse-function');

function parseGpgpuMap (opts) {
  if (!opts) fail('expected options');

  var funcName = opts.functionName === undefined ? 'compute' : opts.functionName;
  var hashLen = opts.hashLength === undefined ? 14 : opts.hashLength;

  var parsedBody = parseFunction(opts.body, funcName);
  var parsedArgs = parseArgs(opts.args);
  var uniforms = computeUniforms(parsedArgs, parsedBody);
  var defs = computeDefs(uniforms, hashLen);

  return {
    frag: [
      'precision mediump float;',
      defs.varying.join('\n'),
      defs.uniforms.join('\n'),
      opts.body,
      'void main () {',
      defs.sampleLookups.join('\n'),
      '  gl_FragColor = ' + funcName + '(' + defs.computeArgs.join(', ') + ');',
      '}'
    ].join('\n'),
    vert: [
      'precision mediump float;',
      'attribute vec2 ' + defs.vars.xy + ';',
      'varying vec2 ' + defs.vars.uv + ';',
      'void main () {',
      '  ' + defs.vars.uv + ' = 0.5 * (' + defs.vars.xy + ' + 1.0);',
      '  gl_Position = vec4(' + defs.vars.xy + ', 0, 1);',
      '}'
    ].join('\n'),
    attrName: defs.vars.xy,
    destProp: defs.vars.dest,
    invokeArgs: defs.invokeArgs,
    duProp: defs.vars.du,
    dvProp: defs.vars.dv,
    permute: opts.permute
  };
}

function fail (msg) {
  throw new Error('regl-gpgpu-parser:map: ' + msg);
}

function parseArgs (args) {
  var result = [];
  var parsed, arg;
  var idx = 0;

  // Disambiguate argument types:
  for (var i = 0; i < args.length; i++) {
    arg = args[i];

    parsed = {
      isScalar: arg === 'scalar',
      isRef: typeof arg.array === 'number' && arg.array !== i,
      hasOffset: Array.isArray(arg.offset)
    };

    parsed.isArray = arg === 'array' || (!parsed.isScalar && !parsed.isRef && typeof arg === 'object');

    if (parsed.isRef) {
      parsed.ref = arg.array;
    }

    if (parsed.hasOffset) {
      parsed.offset = arg.offset;
    }

    if (parsed.isScalar || (parsed.isArray && !parsed.isRef)) {
      parsed.inputIdx = idx++;
    }

    result.push(parsed);
  }

  return result;
}

function computeUniforms (parsedArgs, parsedBody) {
  if (parsedArgs.length !== parsedBody.length) {
    fail('number of defined args (' + parsedArgs.length + ') does not match map function arity (' + parsedBody.length + ')');
  }

  var i, arg, fnArg;
  var uniforms = [];

  // Define uniforms for non-refs:
  for (i = 0; i < parsedArgs.length; i++) {
    arg = parsedArgs[i];
    fnArg = parsedBody[i];
    if (arg.isRef) continue;

    uniforms[i] = {
      argName: fnArg.name,
      isRef: false,
      baseName: fnArg.name + (arg.isArray ? 'Texture' : ''),
      isArray: arg.isArray,
      isScalar: !arg.isArray
    };

    if (arg.isScalar) {
      uniforms[i].argType = fnArg.type;
    }
  }

  for (i = 0; i < parsedArgs.length; i++) {
    arg = parsedArgs[i];
    fnArg = parsedBody[i];

    if (!arg.isRef) continue;

    var ref = uniforms[arg.ref];
    if (ref.isRef) {
      fail('argument ' + i + ' references argument ' + ref.ref + '. Recursive references are not supported.');
    }

    uniforms[i] = {
      argName: fnArg.name,
      baseName: ref.baseName,
      isArray: ref.isArray,
      isRef: true,
      ref: arg.ref,
      hasOffset: arg.hasOffset,
      offset: arg.offset
    };
  }

  return uniforms;
}

function computeDefs (parsedUniforms, hashLength) {
  var getAttr = uniqAttr(hashLength);
  var vars = {
    xy: getAttr('xy'),
    uv: getAttr('uv'),
    du: getAttr('du'),
    dv: getAttr('dv'),
    dest: getAttr('dest')
  };

  var sampleLookups = [];
  var uniforms = [];
  var varying = [];
  var computeArgs = [];
  var invokeArgs = [];
  varying.push('varying vec2 ' + vars.uv + ';');
  uniforms.push('uniform float ' + vars.du + ';');
  uniforms.push('uniform float ' + vars.dv + ';');

  var uniformName;
  var uniformNames = {};
  // Create uniform statements
  for (var i = 0; i < parsedUniforms.length; i++) {
    var uniform = parsedUniforms[i];

    if (uniform.isRef) {
      if (uniformNames[uniform.baseName]) {
        uniformName = uniformNames[uniform.baseName];
      } else {
        uniformNames[uniform.baseName] = uniformName = getAttr(uniform.baseName);
      }
    } else {
      if (uniformNames[uniform.baseName]) {
        uniformName = uniformNames[uniform.baseName];
      } else {
        uniformNames[uniform.baseName] = uniformName = getAttr(uniform.baseName);
      }
    }

    if (uniform.isArray) {
      if (!uniform.isRef) {
        uniforms.push('uniform sampler2D ' + uniformName + ';');
      }
      var offset = [vars.uv];
      if (uniform.hasOffset) {
        var offsetStr = ['vec2('];
        if (uniform.offset[0] !== 0) {
          offsetStr.push(uniform.offset[0].toFixed(8) + ' * ' + vars.du);
        } else {
          offsetStr.push('0.0');
        }
        offsetStr.push(', ');
        if (uniform.offset[1] !== 0) {
          offsetStr.push(uniform.offset[1].toFixed(8) + ' * ' + vars.dv);
        } else {
          offsetStr.push('0.0');
        }
        offsetStr.push(')');
        offset.push(offsetStr.join(''));
      }
      sampleLookups.push('  vec4 ' + uniform.argName + ' = texture2D(' + uniformName + ', ' + offset.join(' + ') + ');');
      computeArgs.push(uniform.argName);
    }

    if (uniform.isScalar || (uniform.isArray && !uniform.isRef)) {
      invokeArgs.push(uniformName);
    }

    if (uniform.isScalar) {
      uniforms.push('uniform ' + uniform.argType + ' ' + uniformName + ';');
      computeArgs.push(uniformName);
    }
  }

  return {
    uniforms: uniforms,
    sampleLookups: sampleLookups,
    varying: varying,
    computeArgs: computeArgs,
    invokeArgs: invokeArgs,
    vars: vars,
  };
}
