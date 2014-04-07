// __Dependencies__

var util = require('util');
var requireindex = require('requireindex');

// __Private Module Members__

function getValue (key) { return this[key] }
function isNotFunction (value) { return typeof value !== 'function' }

function parse (args) {
  var incoming = args[0];
  var decorators;

  // Parse.
  if (!incoming) decorators = [];
  else if (Array.isArray(incoming)) decorators = [].concat(incoming);
  else if (typeof incoming === 'function') decorators = [].concat(incoming);
  else if (typeof incoming === 'string') decorators = deco.require.apply(deco, args);
  else throw new Error('Indecipherable arguments.');

  // Validate.
  if (decorators.some(isNotFunction)) throw new Error('Encountered non-function decorator.');

  return decorators;
}

// __Module Definition__
var deco = module.exports = function deco () {
  // Decorators to be applied to each newly constructed object.
  var decorators = parse(arguments);
  // Default constructor hash.
  var defaults = {};
  // Internal private data.
  var internal = {};

  // Protect is protected instance data
  // TODO always make protect last, so that vairable number of arguments are allowed for initial Constructor call
  var Constructor = function (incoming, protect) {
    // The object to be decorated.
    var o;
    // Incoming constructor options merged with defaults.
    var merged;
    // Constructor options that have been overwritten by a decorator.
    var overwritten;

    // Default protected instance values.
    if (!protect) {
      protect = {
        options: function (newOptions) {
          overwritten = deco.merge(overwritten || defaults, newOptions);
        }
      };
    }

    // Initialize the incoming constructor options, if necessary.
    if (incoming === undefined || incoming === null) incoming = {};
    // Merge the incoming options with any defaults, if they're a hash.
    if (typeof incoming === 'object') merged = deco.merge(defaults, incoming);

    // If `this`, the object to be decorated, has already been set it means
    // the object that is being decorated is already created. (It will be set to
    // `global` if not, thus creating the danger associated with the `new`
    // keyword, and its accidental omission.)
    if (this !== global && this !== internal.container) o = this;
    // If it hasn't been set yet, check for a factory function.
    else if (internal.factory) o = internal.factory(); // TODO constructor options
    // Otherwise, construct the object to be decorated.
    else o = Object.create(Constructor.prototype);

    // If the constructor inherits, call the super constructor on the object
    // to be decorated. // TODO this doesn't work for Error (in a weird way), does it work in general?
    if (Constructor.super_) Constructor.super_.call(o, incoming);

    // Apply decorators.
    decorators.forEach(function (decorator) {
      decorator.call(o, overwritten || merged || incoming, protect);
    });
    // The object has been created and decorated.  Done!
    return o;
  };

  Constructor.decorators = function () {
    decorators = decorators.concat(parse(arguments));
    return Constructor;
  };

  Constructor.defaults = function (incoming) {
    defaults = deco.merge(defaults, incoming);
    return Constructor;
  };

  Constructor.inherit = function (super_) {
    util.inherits(Constructor, super_);
    return Constructor;
  };

  Constructor.factory = function (factory) {
    internal.factory = factory;
    return Constructor;
  };

  Constructor.container = function (container) {
    internal.container = container;
    return Constructor;
  };

  return Constructor;
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
