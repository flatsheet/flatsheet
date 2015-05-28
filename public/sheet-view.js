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
  
  var rect = row.getBoundingClientRect();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2x1Y2FzL3Byb2plY3RzL0ZsYXRzaGVldC9mbGF0c2hlZXQvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2x1Y2FzL3Byb2plY3RzL0ZsYXRzaGVldC9mbGF0c2hlZXQvYnJvd3Nlci9zaGVldC12aWV3LmpzIiwiL2hvbWUvbHVjYXMvcHJvamVjdHMvRmxhdHNoZWV0L2ZsYXRzaGVldC9ub2RlX21vZHVsZXMvY29tcG9uZW50LWNsb3Nlc3QvaW5kZXguanMiLCIvaG9tZS9sdWNhcy9wcm9qZWN0cy9GbGF0c2hlZXQvZmxhdHNoZWV0L25vZGVfbW9kdWxlcy9jb21wb25lbnQtY2xvc2VzdC9ub2RlX21vZHVsZXMvY29tcG9uZW50LW1hdGNoZXMtc2VsZWN0b3IvaW5kZXguanMiLCIvaG9tZS9sdWNhcy9wcm9qZWN0cy9GbGF0c2hlZXQvZmxhdHNoZWV0L25vZGVfbW9kdWxlcy9jb21wb25lbnQtY2xvc2VzdC9ub2RlX21vZHVsZXMvY29tcG9uZW50LW1hdGNoZXMtc2VsZWN0b3Ivbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1xdWVyeS9pbmRleC5qcyIsIi9ob21lL2x1Y2FzL3Byb2plY3RzL0ZsYXRzaGVldC9mbGF0c2hlZXQvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1kZWxlZ2F0ZS9pbmRleC5qcyIsIi9ob21lL2x1Y2FzL3Byb2plY3RzL0ZsYXRzaGVldC9mbGF0c2hlZXQvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1kZWxlZ2F0ZS9ub2RlX21vZHVsZXMvY29tcG9uZW50LWV2ZW50L2luZGV4LmpzIiwiL2hvbWUvbHVjYXMvcHJvamVjdHMvRmxhdHNoZWV0L2ZsYXRzaGVldC9ub2RlX21vZHVsZXMvc3RpY2t5LWhlYWRlci9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHN0aWNreSA9IHJlcXVpcmUoJ3N0aWNreS1oZWFkZXInKVxudmFyIG9uID0gcmVxdWlyZSgnY29tcG9uZW50LWRlbGVnYXRlJykuYmluZFxuXG52YXIgaGVhZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RhYmxlLWhlYWRlcicpXG5zdGlja3koaGVhZGVyKVxuXG5pZiAod2luZG93LmxvY2F0aW9uLmhhc2gubGVuZ3RoID4gMSkge1xuICB2YXIgcm93ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQod2luZG93LmxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIycsICcnKSlcbiAgcm93LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjRkZGRkNDJ1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICB3aW5kb3cuc2Nyb2xsQnkoMCwgLWhlYWRlci5zY3JvbGxIZWlnaHQpXG4gIH0sIDMwMClcbn1cblxub24oZG9jdW1lbnQuYm9keSwgJy5yb3cnLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICB2YXIgcm93ID0gZS50YXJnZXQucGFyZW50Tm9kZVxuICBcbiAgdmFyIHJvd3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcucm93JykpXG5cbiAgcm93cy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgaWYgKGl0ZW0uaWQgPT09IHJvdy5pZCkgcm93LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjRkZGRkNDJ1xuICAgIGVsc2UgaXRlbS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnI2ZmZidcbiAgfSlcbiAgXG4gIHZhciByZWN0ID0gcm93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IHJvdy5pZFxuICB3aW5kb3cuc2Nyb2xsQnkoMCwgLWhlYWRlci5zY3JvbGxIZWlnaHQpXG59KVxuIiwidmFyIG1hdGNoZXMgPSByZXF1aXJlKCdtYXRjaGVzLXNlbGVjdG9yJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCwgc2VsZWN0b3IsIGNoZWNrWW9TZWxmLCByb290KSB7XG4gIGVsZW1lbnQgPSBjaGVja1lvU2VsZiA/IHtwYXJlbnROb2RlOiBlbGVtZW50fSA6IGVsZW1lbnRcblxuICByb290ID0gcm9vdCB8fCBkb2N1bWVudFxuXG4gIC8vIE1ha2Ugc3VyZSBgZWxlbWVudCAhPT0gZG9jdW1lbnRgIGFuZCBgZWxlbWVudCAhPSBudWxsYFxuICAvLyBvdGhlcndpc2Ugd2UgZ2V0IGFuIGlsbGVnYWwgaW52b2NhdGlvblxuICB3aGlsZSAoKGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpICYmIGVsZW1lbnQgIT09IGRvY3VtZW50KSB7XG4gICAgaWYgKG1hdGNoZXMoZWxlbWVudCwgc2VsZWN0b3IpKVxuICAgICAgcmV0dXJuIGVsZW1lbnRcbiAgICAvLyBBZnRlciBgbWF0Y2hlc2Agb24gdGhlIGVkZ2UgY2FzZSB0aGF0XG4gICAgLy8gdGhlIHNlbGVjdG9yIG1hdGNoZXMgdGhlIHJvb3RcbiAgICAvLyAod2hlbiB0aGUgcm9vdCBpcyBub3QgdGhlIGRvY3VtZW50KVxuICAgIGlmIChlbGVtZW50ID09PSByb290KVxuICAgICAgcmV0dXJuXG4gIH1cbn1cbiIsIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgcXVlcnkgPSByZXF1aXJlKCdxdWVyeScpO1xuXG4vKipcbiAqIEVsZW1lbnQgcHJvdG90eXBlLlxuICovXG5cbnZhciBwcm90byA9IEVsZW1lbnQucHJvdG90eXBlO1xuXG4vKipcbiAqIFZlbmRvciBmdW5jdGlvbi5cbiAqL1xuXG52YXIgdmVuZG9yID0gcHJvdG8ubWF0Y2hlc1xuICB8fCBwcm90by53ZWJraXRNYXRjaGVzU2VsZWN0b3JcbiAgfHwgcHJvdG8ubW96TWF0Y2hlc1NlbGVjdG9yXG4gIHx8IHByb3RvLm1zTWF0Y2hlc1NlbGVjdG9yXG4gIHx8IHByb3RvLm9NYXRjaGVzU2VsZWN0b3I7XG5cbi8qKlxuICogRXhwb3NlIGBtYXRjaCgpYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGNoO1xuXG4vKipcbiAqIE1hdGNoIGBlbGAgdG8gYHNlbGVjdG9yYC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3JcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIG1hdGNoKGVsLCBzZWxlY3Rvcikge1xuICBpZiAoIWVsIHx8IGVsLm5vZGVUeXBlICE9PSAxKSByZXR1cm4gZmFsc2U7XG4gIGlmICh2ZW5kb3IpIHJldHVybiB2ZW5kb3IuY2FsbChlbCwgc2VsZWN0b3IpO1xuICB2YXIgbm9kZXMgPSBxdWVyeS5hbGwoc2VsZWN0b3IsIGVsLnBhcmVudE5vZGUpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKG5vZGVzW2ldID09IGVsKSByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4iLCJmdW5jdGlvbiBvbmUoc2VsZWN0b3IsIGVsKSB7XG4gIHJldHVybiBlbC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbn1cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3IsIGVsKXtcbiAgZWwgPSBlbCB8fCBkb2N1bWVudDtcbiAgcmV0dXJuIG9uZShzZWxlY3RvciwgZWwpO1xufTtcblxuZXhwb3J0cy5hbGwgPSBmdW5jdGlvbihzZWxlY3RvciwgZWwpe1xuICBlbCA9IGVsIHx8IGRvY3VtZW50O1xuICByZXR1cm4gZWwucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG59O1xuXG5leHBvcnRzLmVuZ2luZSA9IGZ1bmN0aW9uKG9iail7XG4gIGlmICghb2JqLm9uZSkgdGhyb3cgbmV3IEVycm9yKCcub25lIGNhbGxiYWNrIHJlcXVpcmVkJyk7XG4gIGlmICghb2JqLmFsbCkgdGhyb3cgbmV3IEVycm9yKCcuYWxsIGNhbGxiYWNrIHJlcXVpcmVkJyk7XG4gIG9uZSA9IG9iai5vbmU7XG4gIGV4cG9ydHMuYWxsID0gb2JqLmFsbDtcbiAgcmV0dXJuIGV4cG9ydHM7XG59O1xuIiwiLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBjbG9zZXN0ID0gcmVxdWlyZSgnY2xvc2VzdCcpXG4gICwgZXZlbnQgPSByZXF1aXJlKCdldmVudCcpO1xuXG4vKipcbiAqIERlbGVnYXRlIGV2ZW50IGB0eXBlYCB0byBgc2VsZWN0b3JgXG4gKiBhbmQgaW52b2tlIGBmbihlKWAuIEEgY2FsbGJhY2sgZnVuY3Rpb25cbiAqIGlzIHJldHVybmVkIHdoaWNoIG1heSBiZSBwYXNzZWQgdG8gYC51bmJpbmQoKWAuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gY2FwdHVyZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuYmluZCA9IGZ1bmN0aW9uKGVsLCBzZWxlY3RvciwgdHlwZSwgZm4sIGNhcHR1cmUpe1xuICByZXR1cm4gZXZlbnQuYmluZChlbCwgdHlwZSwgZnVuY3Rpb24oZSl7XG4gICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICBlLmRlbGVnYXRlVGFyZ2V0ID0gY2xvc2VzdCh0YXJnZXQsIHNlbGVjdG9yLCB0cnVlLCBlbCk7XG4gICAgaWYgKGUuZGVsZWdhdGVUYXJnZXQpIGZuLmNhbGwoZWwsIGUpO1xuICB9LCBjYXB0dXJlKTtcbn07XG5cbi8qKlxuICogVW5iaW5kIGV2ZW50IGB0eXBlYCdzIGNhbGxiYWNrIGBmbmAuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGNhcHR1cmVcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy51bmJpbmQgPSBmdW5jdGlvbihlbCwgdHlwZSwgZm4sIGNhcHR1cmUpe1xuICBldmVudC51bmJpbmQoZWwsIHR5cGUsIGZuLCBjYXB0dXJlKTtcbn07XG4iLCJ2YXIgYmluZCA9IHdpbmRvdy5hZGRFdmVudExpc3RlbmVyID8gJ2FkZEV2ZW50TGlzdGVuZXInIDogJ2F0dGFjaEV2ZW50JyxcbiAgICB1bmJpbmQgPSB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciA/ICdyZW1vdmVFdmVudExpc3RlbmVyJyA6ICdkZXRhY2hFdmVudCcsXG4gICAgcHJlZml4ID0gYmluZCAhPT0gJ2FkZEV2ZW50TGlzdGVuZXInID8gJ29uJyA6ICcnO1xuXG4vKipcbiAqIEJpbmQgYGVsYCBldmVudCBgdHlwZWAgdG8gYGZuYC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gY2FwdHVyZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydHMuYmluZCA9IGZ1bmN0aW9uKGVsLCB0eXBlLCBmbiwgY2FwdHVyZSl7XG4gIGVsW2JpbmRdKHByZWZpeCArIHR5cGUsIGZuLCBjYXB0dXJlIHx8IGZhbHNlKTtcbiAgcmV0dXJuIGZuO1xufTtcblxuLyoqXG4gKiBVbmJpbmQgYGVsYCBldmVudCBgdHlwZWAncyBjYWxsYmFjayBgZm5gLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtCb29sZWFufSBjYXB0dXJlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy51bmJpbmQgPSBmdW5jdGlvbihlbCwgdHlwZSwgZm4sIGNhcHR1cmUpe1xuICBlbFt1bmJpbmRdKHByZWZpeCArIHR5cGUsIGZuLCBjYXB0dXJlIHx8IGZhbHNlKTtcbiAgcmV0dXJuIGZuO1xufTsiLCIhIGZ1bmN0aW9uKG5hbWUsIGRlZmluaXRpb24pIHtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicpIGRlZmluZShkZWZpbml0aW9uKTtcbiAgZWxzZSB0aGlzW25hbWVdID0gZGVmaW5pdGlvbigpO1xufSgnc3RpY2t5JywgZnVuY3Rpb24oKSB7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHN0aWNreShlbCwgdG9wKSB7XG5cbiAgICB2YXIgcmVxdWlyZWRPcmlnaW5hbFN0eWxlcyA9IFsncG9zaXRpb24nLCAndG9wJywgJ2xlZnQnLCAnei1pbmRleCddO1xuXG4gICAgdmFyIHJlcXVpcmVkVG9wID0gdG9wIHx8IDA7XG4gICAgdmFyIG9yaWdpbmFsUmVjdCA9IGNhbGNSZWN0KGVsKTtcbiAgICB2YXIgc3R5bGVzID0ge1xuICAgICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgICB0b3A6IHJlcXVpcmVkVG9wICsgJ3B4JyxcbiAgICAgIGxlZnQ6IG9yaWdpbmFsUmVjdC5sZWZ0ICsgJ3B4JyxcbiAgICAgIC8vIHdpZHRoOiBvcmlnaW5hbFJlY3Qud2lkdGggKyAncHgnLFxuICAgICAgJ3otaW5kZXgnOiA5OTk5XG4gICAgfVxuICAgIHZhciBvcmlnaW5hbFN0eWxlcyA9IHt9XG4gICAgcmVxdWlyZWRPcmlnaW5hbFN0eWxlcy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgb3JpZ2luYWxTdHlsZXNba2V5XSA9IGVsLnN0eWxlW2tleV07XG4gICAgfSk7XG5cbiAgICB2YXIgb25zY3JvbGw7XG4gICAgaWYgKHdpbmRvdy5vbnNjcm9sbCkge1xuICAgICAgb25zY3JvbGwgPSB3aW5kb3cub25zY3JvbGw7XG4gICAgfVxuICAgIFxuICAgIHdpbmRvdy5vbnNjcm9sbCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoZ2V0V2luZG93U2Nyb2xsKCkudG9wID4gb3JpZ2luYWxSZWN0LnRvcCAtIHJlcXVpcmVkVG9wKSB7XG4gICAgICAgIGZvciAoa2V5IGluIHN0eWxlcykge1xuICAgICAgICAgIGVsLnN0eWxlW2tleV0gPSBzdHlsZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbC5jbGFzc05hbWUgPSAnc3R1Y2snXG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NOYW1lID0gJ2VsLXN0dWNrJ1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChrZXkgaW4gb3JpZ2luYWxTdHlsZXMpIHtcbiAgICAgICAgICBlbC5zdHlsZVtrZXldID0gb3JpZ2luYWxTdHlsZXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBlbC5jbGFzc05hbWUgPSAnbm90LXN0dWNrJ1xuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTmFtZSA9ICdlbC1ub3Qtc3R1Y2snXG4gICAgICB9XG4gICAgICBvbnNjcm9sbCAmJiBvbnNjcm9sbChldmVudClcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjYWxjUmVjdChlbCkge1xuICAgIHZhciByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdmFyIHdpbmRvd1Njcm9sbCA9IGdldFdpbmRvd1Njcm9sbCgpXG4gICAgcmV0dXJuIHtcbiAgICAgIGxlZnQ6IHJlY3QubGVmdCArIHdpbmRvd1Njcm9sbC5sZWZ0LFxuICAgICAgdG9wOiByZWN0LnRvcCArIHdpbmRvd1Njcm9sbC50b3AsXG4gICAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogcmVjdC5oZWlnaHRcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRXaW5kb3dTY3JvbGwoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvcDogd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AsXG4gICAgICBsZWZ0OiB3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnRcbiAgICB9XG4gIH1cblxufSk7XG4iXX0=
