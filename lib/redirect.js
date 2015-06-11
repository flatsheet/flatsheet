module.exports = function (res, location, status) {
  res.writeHead((status || 302), { 'Location': location })
  return res.end()
}