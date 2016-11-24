const createKDTree = require('static-kdtree');

module.exports = function continuify (simplex, maxIdx) {
  var t1 = performance.now();
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

        var ids = vertexIds[consumedCellPair];
        //var completesLoop = polyline[0] === consumedCellPair || polyline[polyline.length - 1] === consumedCellPair;;
        //var isTmpNode = ids[0] >= maxIdx || ids[1] >= maxIdx;
        //var isFirstPoint = polyline.length === 0;

        //if (!isTmpNode || isFirstPoint || completesLoop) {
          if (dir === 0) {
            if (polyline[0] !== consumedCellPair) {
              polyline.unshift(consumedCellPair);
              newSimplex.vertexIds.unshift(vertexIds[consumedCellPair].slice(0));
              newSimplex.vertexWeights.unshift(weights[consumedCellPair]);
            }
          } else {
            if (polyline[polyline.length - 1] !== consumedCellPair) {
              polyline.push(consumedCellPair);
              newSimplex.vertexIds.push(vertexIds[consumedCellPair].slice(0));
              newSimplex.vertexWeights.push(weights[consumedCellPair]);
            }
          }
        //}

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
    var filteredIds = [];
    var filteredWeights = [];

    var isClosed = polyline[0] === polyline[polyline.length - 1];
    var needsClose = isClosed && (ns.vertexIds[0][0] >= maxIdx || ns.vertexIds[0][1] >= maxIdx);

    var c = 0;
    for (j = 0; j < ns.vertexIds.length; j++) {
      var verts = ns.vertexIds[j];
      if (verts[0] < maxIdx && verts[1] <= maxIdx) {
        filteredIds.push(verts);
        filteredWeights.push(ns.vertexWeights[j]);
        if (c > 0) ns.cells.push([c - 1, c]);
        c++;
      }
    }
    if (needsClose) {
      ns.vertexIds.push(ns.vertexIds[0].slice());
      ns.vertexWeights.push(ns.vertexWeights[0]);
      ns.cells.push([c - 1, 0]);
    }
    ns.vertexIds = filteredIds;
    ns.vertexWeights = filteredWeights;
  }

  var t2 = performance.now();
  console.log('t2 - t1:', t2 - t1);

  return newSimplices;
}
