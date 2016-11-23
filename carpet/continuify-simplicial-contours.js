const createKDTree = require('static-kdtree');

module.exports = function continuify (simplex) {
  console.log('simplex:', simplex);
  var cid, i, j, k, pair, ids, w;
  var weights = simplex.vertexWeights;
  var cells = simplex.cells;
  var vertexIds = simplex.vertexIds;
  var idsByPair = {};
  var weightsByPair = {};

  function getVertexIdPair (ids) {
    return ids[0] < ids[1] ? ids[0] + ',' + ids[1] : ids[1] + ',' + ids[0];
  }

  function getWeight (ids, w) {
    return ids[0] < ids[1] ? w : 1 - w;
  }

  for (i = 0; i < vertexIds.length; i++) {
    pair = getVertexIdPair(vertexIds[i]);
    weightsByPair[pair] = getWeight(vertexIds[i], weights[i]);
  }

  var cellsUsingVertexPair = {};
  for (i = 0; i < cells.length; i++) {
    for (j = 0; j < 2; j++) {
      var pair = getVertexIdPair(vertexIds[cells[i][j]]);
      if (!cellsUsingVertexPair.hasOwnProperty(pair)) cellsUsingVertexPair[pair] = [];
      cellsUsingVertexPair[pair].push(i);
    }
  }

  function getAdjacentCellIdsByConsumingVertexIds (vertexIds, cellId) {
    var cellIds = cellsUsingVertexPair[getVertexIdPair(vertexIds)];
    var idx = cellIds.indexOf(curCid);
    if (idx > -1) cellIds.splice(idx, 1);
    return cellIds;
  }

  function getCellPairByConsumingCellDir (cid, dir) {
    var cell = cells[cid][dir];
    cells[cid][dir] = null;
    return cell;
  }

  var polylines = [];
  var cellIdsIterated = {};
  var newSimplices = [];

  // Now work through it and remove keys until all the curves are linked continuously
  for (cid = 0; cid < cells.length; cid++) {
    if (cellIdsIterated[cid]) continue;

    //console.group('--- NEW SIMPLEX --- (cid =', cid, ')');
    var polyline = [];
    var newSimplex = {vertexIds: [], vertexWeights: [], cells: []};

    for (dir = 0; dir < 2; dir++) {
      var cidsToIterate = [cid];

      //console.group('--- NEW DIRECTION --- (dir =', dir, ')');

      while (cidsToIterate.length) {
        var curCid = cidsToIterate.shift();
        cellIdsIterated[curCid] = true;
        //console.log('--- NEXT CELL ID --- (cid =', curCid, ')');

        var consumedCellPair = getCellPairByConsumingCellDir(curCid, dir);
        if (consumedCellPair === null) continue;

        if (dir === 0) {
          if (polyline[0] !== consumedCellPair) {
            polyline.unshift(consumedCellPair);
            console.log('consumedCellPair:', consumedCellPair);
            newSimplex.vertexIds.unshift(vertexIds[consumedCellPair].slice(0));
            newSimplex.vertexWeights.unshift(weights[consumedCellPair]);
          }
        } else {
          if (polyline[polyline.length - 1] !== consumedCellPair) {
            polyline.push(consumedCellPair);
            console.log('consumedCellPair:', consumedCellPair);
            newSimplex.vertexIds.push(vertexIds[consumedCellPair].slice(0));
            newSimplex.vertexWeights.push(weights[consumedCellPair]);
          }
        }

        // Now jump to the new cell:
        newCidsToIterate = getAdjacentCellIdsByConsumingVertexIds(vertexIds[consumedCellPair], curCid);
        if (newCidsToIterate && newCidsToIterate.length > 0) {
          cidsToIterate = cidsToIterate.concat(newCidsToIterate);
        }
      }
    }

    polylines.push(polyline);
    newSimplices.push(newSimplex);
  }

  for (i = 0; i < polylines.length; i++) {
    var polyline = polylines[i];
    var ns = newSimplices[i];

    for (j = 0; j < polyline.length - 1; j++) {
      ns.cells.push([j, j + 1]);
    }
  }

  return newSimplices;
}
