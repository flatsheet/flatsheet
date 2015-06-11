module.exports = function timestamp () {
  return new Date(Date.now()).toISOString()
}