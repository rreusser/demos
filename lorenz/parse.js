var tokenize = require('glsl-tokenizer/string');
var parse = require('glsl-parser/direct');

module.exports = function (shader) {
  var tokens = tokenize(shader);
  var ast = parse(tokens);
  var computeNode = locateComputeFunction(ast);

  if (!computeNode) {
    throw Error('fragment shader must define a compute() function');
  }

  return parseComputeFunction(computeNode);
};

function locateComputeFunction(node, depth) {
  let ret;
  if (node.type === 'ident' && node.token.data === 'compute' && node.parent && node.parent.type === 'function') {
    return node.parent;
  } else {
    for(let i = 0; i < node.children.length; i++) {
      ret = locateComputeFunction(node.children[i]);
      if (ret) break;
    }
    return ret;
  }
}

function findNode (node, qualifiers) {
  let children = node.children;
  let keys = Object.keys(qualifiers);
  for (let i = 0; i < children.length; i++) {
    for (let j = 0; j < keys.length; j++) {
      if (children[i][keys[j]] === qualifiers[keys[j]]) {
        return children[i];
      }
    }
  }
}

function findNodes (node, qualifiers) {
  let nodes = [];
  let children = node.children;
  let keys = Object.keys(qualifiers);
  for (let i = 0; i < children.length; i++) {
    for (let j = 0; j < keys.length; j++) {
      if (children[i][keys[j]] === qualifiers[keys[j]]) {
        nodes.push(children[i]);
      }
    }
  }
  return nodes;
}

function parseComputeFunction(node) {
  let args = [];
  let functionargs = findNode(node, {type: 'functionargs'});
  let decls = findNodes(functionargs, {type: 'decl'});
  for (let i = 0; i < decls.length; i++) {
    let decl = decls[i];
    let kwd = findNode(decl, {type: 'keyword'});
    let decllist = findNode(decl, {type: 'decllist'});
    let ident = findNode(decllist, {type: 'ident'});
    args.push({type: kwd.token.data, name: ident.token.data})
  }
  return args;
}

