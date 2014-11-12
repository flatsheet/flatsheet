module.exports = function (res, opts) {
  if (!res.account) {
    res.writeHead(302, { 'Location': opts.prefix + '/view/' + opts.id });
    res.end();
    return false;
  }
  else return true;
}