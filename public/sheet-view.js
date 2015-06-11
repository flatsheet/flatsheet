(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var sticky = require('sticky-header')
var on = require('component-delegate').bind

var header = document.getElementById('table-header')
sticky(header)

if (window.location.hash.length > 1) {
  var row = document.getElementById(window.location.hash.replace('#', ''))
  row.style.backgroundColor = '#FFFFCC'
  setTimeout(function () {
    window.scrollBy(0, -header.scrollHeight)
  }, 300)
}

on(document.body, '.row', 'click', function (e) {
  var row = e.target.parentNode
  var rows = Array.prototype.slice.call(document.querySelectorAll('.row'))

  rows.forEach(function (item) {
    if (item.id === row.id) row.style.backgroundColor = '#FFFFCC'
    else item.style.backgroundColor = '#fff'
  })

  var rect = row.getBoundingClientRect()
  window.location.hash = row.id
  window.scrollBy(0, -header.scrollHeight)
})

},{"component-delegate":5,"sticky-header":7}],2:[function(require,module,exports){
var matches = require('matches-selector')

module.exports = function (element, selector, checkYoSelf, root) {
  element = checkYoSelf ? {parentNode: element} : element

  root = root || document

  // Make sure `element !== document` and `element != null`
  // otherwise we get an illegal invocation
  while ((element = element.parentNode) && element !== document) {
    if (matches(element, selector))
      return element
    // After `matches` on the edge case that
    // the selector matches the root
    // (when the root is not the document)
    if (element === root)
      return
  }
}

},{"matches-selector":3}],3:[function(require,module,exports){
/**
 * Module dependencies.
 */

var query = require('query');

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matches
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (!el || el.nodeType !== 1) return false;
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

},{"query":4}],4:[function(require,module,exports){
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

},{}],5:[function(require,module,exports){
/**
 * Module dependencies.
 */

var closest = require('closest')
  , event = require('event');

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  return event.bind(el, type, function(e){
    var target = e.target || e.srcElement;
    e.delegateTarget = closest(target, selector, true, el);
    if (e.delegateTarget) fn.call(el, e);
  }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  event.unbind(el, type, fn, capture);
};

},{"closest":2,"event":6}],6:[function(require,module,exports){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
},{}],7:[function(require,module,exports){
! function(name, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof define == 'function') define(definition);
  else this[name] = definition();
}('sticky', function() {

  return function sticky(el, top) {

    var requiredOriginalStyles = ['position', 'top', 'left', 'z-index'];

    var requiredTop = top || 0;
    var originalRect = calcRect(el);
    var styles = {
      position: 'fixed',
      top: requiredTop + 'px',
      left: originalRect.left + 'px',
      // width: originalRect.width + 'px',
      'z-index': 9999
    }
    var originalStyles = {}
    requiredOriginalStyles.forEach(function(key) {
      originalStyles[key] = el.style[key];
    });

    var onscroll;
    if (window.onscroll) {
      onscroll = window.onscroll;
    }
    
    window.onscroll = function(event) {
      if (getWindowScroll().top > originalRect.top - requiredTop) {
        for (key in styles) {
          el.style[key] = styles[key];
        }
        el.className = 'stuck'
        document.body.className = 'el-stuck'
      } else {
        for (key in originalStyles) {
          el.style[key] = originalStyles[key];
        }
        el.className = 'not-stuck'
        document.body.className = 'el-not-stuck'
      }
      onscroll && onscroll(event)
    }
  }

  function calcRect(el) {
    var rect = el.getBoundingClientRect();
    var windowScroll = getWindowScroll()
    return {
      left: rect.left + windowScroll.left,
      top: rect.top + windowScroll.top,
      width: rect.width,
      height: rect.height
    }
  }

  function getWindowScroll() {
    return {
      top: window.pageYOffset || document.documentElement.scrollTop,
      left: window.pageXOffset || document.documentElement.scrollLeft
    }
  }

});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zZXRodmluY2VudC93b3Jrc3BhY2UvZmxhdHNoZWV0L2ZsYXRzaGVldC9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3NldGh2aW5jZW50L3dvcmtzcGFjZS9mbGF0c2hlZXQvZmxhdHNoZWV0L2Jyb3dzZXIvc2hlZXQtdmlldy5qcyIsIi9Vc2Vycy9zZXRodmluY2VudC93b3Jrc3BhY2UvZmxhdHNoZWV0L2ZsYXRzaGVldC9ub2RlX21vZHVsZXMvY29tcG9uZW50LWNsb3Nlc3QvaW5kZXguanMiLCIvVXNlcnMvc2V0aHZpbmNlbnQvd29ya3NwYWNlL2ZsYXRzaGVldC9mbGF0c2hlZXQvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1jbG9zZXN0L25vZGVfbW9kdWxlcy9jb21wb25lbnQtbWF0Y2hlcy1zZWxlY3Rvci9pbmRleC5qcyIsIi9Vc2Vycy9zZXRodmluY2VudC93b3Jrc3BhY2UvZmxhdHNoZWV0L2ZsYXRzaGVldC9ub2RlX21vZHVsZXMvY29tcG9uZW50LWNsb3Nlc3Qvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1tYXRjaGVzLXNlbGVjdG9yL25vZGVfbW9kdWxlcy9jb21wb25lbnQtcXVlcnkvaW5kZXguanMiLCIvVXNlcnMvc2V0aHZpbmNlbnQvd29ya3NwYWNlL2ZsYXRzaGVldC9mbGF0c2hlZXQvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1kZWxlZ2F0ZS9pbmRleC5qcyIsIi9Vc2Vycy9zZXRodmluY2VudC93b3Jrc3BhY2UvZmxhdHNoZWV0L2ZsYXRzaGVldC9ub2RlX21vZHVsZXMvY29tcG9uZW50LWRlbGVnYXRlL25vZGVfbW9kdWxlcy9jb21wb25lbnQtZXZlbnQvaW5kZXguanMiLCIvVXNlcnMvc2V0aHZpbmNlbnQvd29ya3NwYWNlL2ZsYXRzaGVldC9mbGF0c2hlZXQvbm9kZV9tb2R1bGVzL3N0aWNreS1oZWFkZXIvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgc3RpY2t5ID0gcmVxdWlyZSgnc3RpY2t5LWhlYWRlcicpXG52YXIgb24gPSByZXF1aXJlKCdjb21wb25lbnQtZGVsZWdhdGUnKS5iaW5kXG5cbnZhciBoZWFkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGFibGUtaGVhZGVyJylcbnN0aWNreShoZWFkZXIpXG5cbmlmICh3aW5kb3cubG9jYXRpb24uaGFzaC5sZW5ndGggPiAxKSB7XG4gIHZhciByb3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh3aW5kb3cubG9jYXRpb24uaGFzaC5yZXBsYWNlKCcjJywgJycpKVxuICByb3cuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNGRkZGQ0MnXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIHdpbmRvdy5zY3JvbGxCeSgwLCAtaGVhZGVyLnNjcm9sbEhlaWdodClcbiAgfSwgMzAwKVxufVxuXG5vbihkb2N1bWVudC5ib2R5LCAnLnJvdycsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gIHZhciByb3cgPSBlLnRhcmdldC5wYXJlbnROb2RlXG4gIHZhciByb3dzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnJvdycpKVxuXG4gIHJvd3MuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgIGlmIChpdGVtLmlkID09PSByb3cuaWQpIHJvdy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI0ZGRkZDQydcbiAgICBlbHNlIGl0ZW0uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmZmYnXG4gIH0pXG5cbiAgdmFyIHJlY3QgPSByb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSByb3cuaWRcbiAgd2luZG93LnNjcm9sbEJ5KDAsIC1oZWFkZXIuc2Nyb2xsSGVpZ2h0KVxufSlcbiIsInZhciBtYXRjaGVzID0gcmVxdWlyZSgnbWF0Y2hlcy1zZWxlY3RvcicpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNlbGVjdG9yLCBjaGVja1lvU2VsZiwgcm9vdCkge1xuICBlbGVtZW50ID0gY2hlY2tZb1NlbGYgPyB7cGFyZW50Tm9kZTogZWxlbWVudH0gOiBlbGVtZW50XG5cbiAgcm9vdCA9IHJvb3QgfHwgZG9jdW1lbnRcblxuICAvLyBNYWtlIHN1cmUgYGVsZW1lbnQgIT09IGRvY3VtZW50YCBhbmQgYGVsZW1lbnQgIT0gbnVsbGBcbiAgLy8gb3RoZXJ3aXNlIHdlIGdldCBhbiBpbGxlZ2FsIGludm9jYXRpb25cbiAgd2hpbGUgKChlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSAmJiBlbGVtZW50ICE9PSBkb2N1bWVudCkge1xuICAgIGlmIChtYXRjaGVzKGVsZW1lbnQsIHNlbGVjdG9yKSlcbiAgICAgIHJldHVybiBlbGVtZW50XG4gICAgLy8gQWZ0ZXIgYG1hdGNoZXNgIG9uIHRoZSBlZGdlIGNhc2UgdGhhdFxuICAgIC8vIHRoZSBzZWxlY3RvciBtYXRjaGVzIHRoZSByb290XG4gICAgLy8gKHdoZW4gdGhlIHJvb3QgaXMgbm90IHRoZSBkb2N1bWVudClcbiAgICBpZiAoZWxlbWVudCA9PT0gcm9vdClcbiAgICAgIHJldHVyblxuICB9XG59XG4iLCIvKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIHF1ZXJ5ID0gcmVxdWlyZSgncXVlcnknKTtcblxuLyoqXG4gKiBFbGVtZW50IHByb3RvdHlwZS5cbiAqL1xuXG52YXIgcHJvdG8gPSBFbGVtZW50LnByb3RvdHlwZTtcblxuLyoqXG4gKiBWZW5kb3IgZnVuY3Rpb24uXG4gKi9cblxudmFyIHZlbmRvciA9IHByb3RvLm1hdGNoZXNcbiAgfHwgcHJvdG8ud2Via2l0TWF0Y2hlc1NlbGVjdG9yXG4gIHx8IHByb3RvLm1vek1hdGNoZXNTZWxlY3RvclxuICB8fCBwcm90by5tc01hdGNoZXNTZWxlY3RvclxuICB8fCBwcm90by5vTWF0Y2hlc1NlbGVjdG9yO1xuXG4vKipcbiAqIEV4cG9zZSBgbWF0Y2goKWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBtYXRjaDtcblxuLyoqXG4gKiBNYXRjaCBgZWxgIHRvIGBzZWxlY3RvcmAuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBtYXRjaChlbCwgc2VsZWN0b3IpIHtcbiAgaWYgKCFlbCB8fCBlbC5ub2RlVHlwZSAhPT0gMSkgcmV0dXJuIGZhbHNlO1xuICBpZiAodmVuZG9yKSByZXR1cm4gdmVuZG9yLmNhbGwoZWwsIHNlbGVjdG9yKTtcbiAgdmFyIG5vZGVzID0gcXVlcnkuYWxsKHNlbGVjdG9yLCBlbC5wYXJlbnROb2RlKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7ICsraSkge1xuICAgIGlmIChub2Rlc1tpXSA9PSBlbCkgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIiwiZnVuY3Rpb24gb25lKHNlbGVjdG9yLCBlbCkge1xuICByZXR1cm4gZWwucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG59XG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBlbCl7XG4gIGVsID0gZWwgfHwgZG9jdW1lbnQ7XG4gIHJldHVybiBvbmUoc2VsZWN0b3IsIGVsKTtcbn07XG5cbmV4cG9ydHMuYWxsID0gZnVuY3Rpb24oc2VsZWN0b3IsIGVsKXtcbiAgZWwgPSBlbCB8fCBkb2N1bWVudDtcbiAgcmV0dXJuIGVsLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xufTtcblxuZXhwb3J0cy5lbmdpbmUgPSBmdW5jdGlvbihvYmope1xuICBpZiAoIW9iai5vbmUpIHRocm93IG5ldyBFcnJvcignLm9uZSBjYWxsYmFjayByZXF1aXJlZCcpO1xuICBpZiAoIW9iai5hbGwpIHRocm93IG5ldyBFcnJvcignLmFsbCBjYWxsYmFjayByZXF1aXJlZCcpO1xuICBvbmUgPSBvYmoub25lO1xuICBleHBvcnRzLmFsbCA9IG9iai5hbGw7XG4gIHJldHVybiBleHBvcnRzO1xufTtcbiIsIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgY2xvc2VzdCA9IHJlcXVpcmUoJ2Nsb3Nlc3QnKVxuICAsIGV2ZW50ID0gcmVxdWlyZSgnZXZlbnQnKTtcblxuLyoqXG4gKiBEZWxlZ2F0ZSBldmVudCBgdHlwZWAgdG8gYHNlbGVjdG9yYFxuICogYW5kIGludm9rZSBgZm4oZSlgLiBBIGNhbGxiYWNrIGZ1bmN0aW9uXG4gKiBpcyByZXR1cm5lZCB3aGljaCBtYXkgYmUgcGFzc2VkIHRvIGAudW5iaW5kKClgLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvclxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGNhcHR1cmVcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmJpbmQgPSBmdW5jdGlvbihlbCwgc2VsZWN0b3IsIHR5cGUsIGZuLCBjYXB0dXJlKXtcbiAgcmV0dXJuIGV2ZW50LmJpbmQoZWwsIHR5cGUsIGZ1bmN0aW9uKGUpe1xuICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgZS5kZWxlZ2F0ZVRhcmdldCA9IGNsb3Nlc3QodGFyZ2V0LCBzZWxlY3RvciwgdHJ1ZSwgZWwpO1xuICAgIGlmIChlLmRlbGVnYXRlVGFyZ2V0KSBmbi5jYWxsKGVsLCBlKTtcbiAgfSwgY2FwdHVyZSk7XG59O1xuXG4vKipcbiAqIFVuYmluZCBldmVudCBgdHlwZWAncyBjYWxsYmFjayBgZm5gLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtCb29sZWFufSBjYXB0dXJlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMudW5iaW5kID0gZnVuY3Rpb24oZWwsIHR5cGUsIGZuLCBjYXB0dXJlKXtcbiAgZXZlbnQudW5iaW5kKGVsLCB0eXBlLCBmbiwgY2FwdHVyZSk7XG59O1xuIiwidmFyIGJpbmQgPSB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciA/ICdhZGRFdmVudExpc3RlbmVyJyA6ICdhdHRhY2hFdmVudCcsXG4gICAgdW5iaW5kID0gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgPyAncmVtb3ZlRXZlbnRMaXN0ZW5lcicgOiAnZGV0YWNoRXZlbnQnLFxuICAgIHByZWZpeCA9IGJpbmQgIT09ICdhZGRFdmVudExpc3RlbmVyJyA/ICdvbicgOiAnJztcblxuLyoqXG4gKiBCaW5kIGBlbGAgZXZlbnQgYHR5cGVgIHRvIGBmbmAuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGNhcHR1cmVcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLmJpbmQgPSBmdW5jdGlvbihlbCwgdHlwZSwgZm4sIGNhcHR1cmUpe1xuICBlbFtiaW5kXShwcmVmaXggKyB0eXBlLCBmbiwgY2FwdHVyZSB8fCBmYWxzZSk7XG4gIHJldHVybiBmbjtcbn07XG5cbi8qKlxuICogVW5iaW5kIGBlbGAgZXZlbnQgYHR5cGVgJ3MgY2FsbGJhY2sgYGZuYC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gY2FwdHVyZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMudW5iaW5kID0gZnVuY3Rpb24oZWwsIHR5cGUsIGZuLCBjYXB0dXJlKXtcbiAgZWxbdW5iaW5kXShwcmVmaXggKyB0eXBlLCBmbiwgY2FwdHVyZSB8fCBmYWxzZSk7XG4gIHJldHVybiBmbjtcbn07IiwiISBmdW5jdGlvbihuYW1lLCBkZWZpbml0aW9uKSB7XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcbiAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nKSBkZWZpbmUoZGVmaW5pdGlvbik7XG4gIGVsc2UgdGhpc1tuYW1lXSA9IGRlZmluaXRpb24oKTtcbn0oJ3N0aWNreScsIGZ1bmN0aW9uKCkge1xuXG4gIHJldHVybiBmdW5jdGlvbiBzdGlja3koZWwsIHRvcCkge1xuXG4gICAgdmFyIHJlcXVpcmVkT3JpZ2luYWxTdHlsZXMgPSBbJ3Bvc2l0aW9uJywgJ3RvcCcsICdsZWZ0JywgJ3otaW5kZXgnXTtcblxuICAgIHZhciByZXF1aXJlZFRvcCA9IHRvcCB8fCAwO1xuICAgIHZhciBvcmlnaW5hbFJlY3QgPSBjYWxjUmVjdChlbCk7XG4gICAgdmFyIHN0eWxlcyA9IHtcbiAgICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgICAgdG9wOiByZXF1aXJlZFRvcCArICdweCcsXG4gICAgICBsZWZ0OiBvcmlnaW5hbFJlY3QubGVmdCArICdweCcsXG4gICAgICAvLyB3aWR0aDogb3JpZ2luYWxSZWN0LndpZHRoICsgJ3B4JyxcbiAgICAgICd6LWluZGV4JzogOTk5OVxuICAgIH1cbiAgICB2YXIgb3JpZ2luYWxTdHlsZXMgPSB7fVxuICAgIHJlcXVpcmVkT3JpZ2luYWxTdHlsZXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgIG9yaWdpbmFsU3R5bGVzW2tleV0gPSBlbC5zdHlsZVtrZXldO1xuICAgIH0pO1xuXG4gICAgdmFyIG9uc2Nyb2xsO1xuICAgIGlmICh3aW5kb3cub25zY3JvbGwpIHtcbiAgICAgIG9uc2Nyb2xsID0gd2luZG93Lm9uc2Nyb2xsO1xuICAgIH1cbiAgICBcbiAgICB3aW5kb3cub25zY3JvbGwgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKGdldFdpbmRvd1Njcm9sbCgpLnRvcCA+IG9yaWdpbmFsUmVjdC50b3AgLSByZXF1aXJlZFRvcCkge1xuICAgICAgICBmb3IgKGtleSBpbiBzdHlsZXMpIHtcbiAgICAgICAgICBlbC5zdHlsZVtrZXldID0gc3R5bGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWwuY2xhc3NOYW1lID0gJ3N0dWNrJ1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSA9ICdlbC1zdHVjaydcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoa2V5IGluIG9yaWdpbmFsU3R5bGVzKSB7XG4gICAgICAgICAgZWwuc3R5bGVba2V5XSA9IG9yaWdpbmFsU3R5bGVzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZWwuY2xhc3NOYW1lID0gJ25vdC1zdHVjaydcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc05hbWUgPSAnZWwtbm90LXN0dWNrJ1xuICAgICAgfVxuICAgICAgb25zY3JvbGwgJiYgb25zY3JvbGwoZXZlbnQpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2FsY1JlY3QoZWwpIHtcbiAgICB2YXIgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciB3aW5kb3dTY3JvbGwgPSBnZXRXaW5kb3dTY3JvbGwoKVxuICAgIHJldHVybiB7XG4gICAgICBsZWZ0OiByZWN0LmxlZnQgKyB3aW5kb3dTY3JvbGwubGVmdCxcbiAgICAgIHRvcDogcmVjdC50b3AgKyB3aW5kb3dTY3JvbGwudG9wLFxuICAgICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHJlY3QuaGVpZ2h0XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0V2luZG93U2Nyb2xsKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0b3A6IHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wLFxuICAgICAgbGVmdDogd2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0XG4gICAgfVxuICB9XG5cbn0pO1xuIl19
