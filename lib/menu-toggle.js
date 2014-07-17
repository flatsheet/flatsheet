var elClass = require('element-class');
var closest = require('discore-closest');
var siblings = require('siblings');

/* helper function for toggling a menu open/closed */
module.exports = function menuToggle (prefix, target) {
  var menuClass = prefix + '-settings';
  var toggleClass = menuClass + '-toggle';
  var btn, menu;

  if (elClass(target).has('settings-icon')) {
    btn = closest(target, '.' + toggleClass);
  }
  else if (elClass(target).has(toggleClass)) {
    btn = target;
  }

  var menu = siblings(btn, '.' + menuClass)[0];

  if (elClass(btn).has('active')) {
    elClass(menu).add('hidden');
    elClass(btn).remove('active');
  }
  else {
    elClass(menu).remove('hidden');
    elClass(btn).add('active');
  }
}