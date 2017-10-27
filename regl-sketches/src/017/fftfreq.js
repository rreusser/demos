module.exports = (i, n, dx) => ((i < Math.floor((n + 1) / 2)) ?  i / (n * dx) : -(n - i) / (n * dx)) * Math.PI * 2;
