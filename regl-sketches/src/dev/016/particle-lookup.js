module.exports = function (width, height) {
  height = height || width
  const n = width * height
  const xy = []
  for (let i = 0; i < n; i++) {
    xy.push([
      (i % width) / Math.max(1, width - 1),
      Math.floor(i / width) / Math.max(1, height - 1)
    ])
  }
  return xy
}
