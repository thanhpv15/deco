// __Dependencies__
var util = require('util');
var requireindex = require('requireindex');

// __Private Module Members__
function getValue (key) { return this[key] }

function parse (args) {
  var incoming = args[0];
  var decorators;

  // Parse.
  if (!incoming) decorators = [];
  else if (typeof incoming === 'function') decorators = [].concat(incoming);
  else if (Array.isArray(incoming)) decorators = [].concat(incoming);
  else if (typeof incoming === 'string') decorators = deco.require.apply(deco, args);
  else throw new Error('Indecipherable arguments.');

  // Validate.
  if (decorators.some(function (d) { return typeof d !== 'function' })) throw new Error('Encountered non-function decorator.')

  return decorators;
}

// __Module Definition__
var deco = module.exports = function deco () {
  // Decorators to be applied to each newly constructed object.
  var decorators = parse(arguments);
  // Default constructor hash.
  var defaults = {};

  // Protect is protected instance data
  var constructor = function (incoming, protect) {
    var o;
    var merged;
    var overwritten;

    if (!incoming) incoming = {};
    if (!protect) protect = {};
    if (typeof incoming === 'object') merged = deco.merge(defaults, incoming);
    // Two arguments means the constructor was called as a decorator.
    if (arguments.length === 2) o = this;
    // Otherwise, construct an object before applying decorators.
    else o = constructor.super_ ? constructor.super_() : Object.create(Object);

    // Apply decorators.
    decorators.forEach(function (decorator) {
      var options = overwritten || merged || incoming || {};
      var out = decorator.call(o, options, protect);
      if (out) overwritten = deco.merge(defaults, out);
    });

    return o;
  };

  constructor.decorators = function () {
    decorators = decorators.concat(parse(arguments));
  };

  constructor.defaults = function (incoming) {
    defaults = deco.merge(defaults, incoming);
  };

  constructor.inherit = function (super_) {
    util.inherits(constructor, super_);
  };

  return constructor;
};

// __Public Module Members__

deco.merge = function (defaults, incoming) {
  var keys;
  var merged = {};

  if (!defaults) defaults = {};
  if (!incoming) incoming = {};

  keys = Object.keys(defaults).concat(Object.keys(incoming));
  keys.forEach(function (key) {
    merged[key] = incoming[key] === undefined ? defaults[key] : incoming[key];
  });

  return merged;
};

deco.require = function () {
  var decoratorFor = requireindex.apply(requireindex, arguments);
  var decorators = Object.keys(decoratorFor).map(getValue.bind(decoratorFor));
  decorators.hash = decoratorFor;
  return decorators;
};

// __Built-In Decorators__

deco.builtin = {};

// A decorator that calls `.set` on each constructor options argument.
// Useful with Express apps.
deco.builtin.setOptions = function (options) {
  var that = this;
  Object.keys(options).forEach(function (key) {
    var value = options[key];
    that.set(key, value);
  });
};
