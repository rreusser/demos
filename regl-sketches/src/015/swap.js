module.exports = function (obj, k1, k2) {
  let tmp = obj[k2];
  obj[k2] = obj[k1];
  obj[k1] = tmp;
  return obj;
}
