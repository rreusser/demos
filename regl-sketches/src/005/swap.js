module.exports = function (state, n1, n2) {
  let tmp = state[n1];
  state[n1] = state[n2];
  state[n2] = tmp;
  return state;
}
