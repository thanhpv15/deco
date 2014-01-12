// __Dependencies__
var requireindex = require('requireindex');
var util = require('util');

// __Private Module Members__
function getValue (key) { return this[key] }

function parse (args) {
  var initial = args[0];
  var decorators;

  if (!initial) decorators = [];
  else if (typeof initial === 'function') decorators = [].concat(initial);
  else if (Array.isArray(initial)) decorators = [].concat(initial);
  else if (typeof initial === 'string') decorators = deco.require.apply(deco, args);
  else throw new Error('Indecipherable arguments.');

  return decorators;
}

// __Module Definition__
var deco = module.exports = function deco () {
  // Decorators to be applied to each newly constructed object.
  var decorators = parse(arguments);
  // Default constructor hash.
  var defaults = {};
  // Protected member data.
  var protect = {};

  var constructor = function (incoming, externalProtect) {
    var actAsDecorator = (arguments.length === 2);
    var merged = deco.merge(defaults, incoming);
    var o;

    if (actAsDecorator) o = this;
    else o = Object.create(constructor.super_ || Object);

    decorators.forEach(function (decorator) {
      decorator.call(o, merged, externalProtect || protect);
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
  var merged = {};
  var keys;

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

// A decorator that calls `.set` on each cobnstructor options argument.
// Useful with Express apps.
deco.builtin.setOptions = function (options) {
  var that = this;
  Object.keys(options).forEach(function (key) {
    var value = options[key];
    that.set(key, value);
  });
};
