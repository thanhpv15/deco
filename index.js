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
  // Static protected members.
  var internal = {};

  // Protect is protected instance data
  // TODO always make protect last, so that vairable number of arguments are allowed for initial Constructor call
  var Constructor = function (incoming, protect) {
    var o;
    var merged;
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

    // Build the object to be decorated, if necessary.  Two arguments means the
    // constructor was called as a decorator.  This means the object that is
    // being decorated is already created.
    if (arguments.length === 2) o = this;
    // Otherwise, construct an object before applying decorators.  If the
    // constructor inherits, create the object to be decorated by calling the
    // inherited constructor.
    else o = Object.create(Constructor.prototype);

    // if (internal.useNew) o = new Constructor.super_(incoming);
    // else
    if (Constructor.super_) Constructor.super_.call(o, incoming);

    // Apply decorators.
    decorators.forEach(function (decorator) {
      decorator.call(o, overwritten || merged || incoming, protect);
    });

    return o;
  };

  Constructor.decorators = function () {
    decorators = decorators.concat(parse(arguments));
  };

  Constructor.defaults = function (incoming) {
    defaults = deco.merge(defaults, incoming);
  };

  Constructor.inherit = function (super_, useNew) {
    internal.useNew = useNew ? true : false;
    util.inherits(Constructor, super_);
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
