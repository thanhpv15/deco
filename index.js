'use strict';

//    # Deco 2

const Assign = require('copy-properties/assign');
const Bursary = require('bursary');
const CallerPath = require('caller-path');
const Copy = require('copy-properties/copy');
const Fs = require('fs');
const Path = require('path');

//    ## Utility Functions
// Calculate the prototype chain of a given prototype.
const chain = (prototype) => {
  if (!prototype) return [];
  return [ prototype, ...chain(Reflect.getPrototypeOf(prototype)) ];
};
// Copy all methods from a given prototype's chain into one object.
const flatten = (prototype) => Copy(...chain(prototype).reverse());
// Check if the given value is a class.
const isClass = (a) => {
  if (!isFunction(a)) return false;
  if (!Reflect.ownKeys(a).includes('prototype')) return false;
  if (a.toString().indexOf('class') !== 0) return false;
  return true;
};
// Check if the given value is a function.
const isFunction = (a) => typeof a === 'function';
// constructors stores the initialization methods for each factory
//   function created with Deco.
// defaults stores the defaults associated with a Deco factory.
const secrets = Bursary({
  constructors: Array,
  defaults: Object
});
// Set `prototype` property and the actual prototype for the given object.
const setPrototype = (o, prototype) => {
  o.prototype = prototype;
  Reflect.setPrototypeOf(o, prototype);
};
// Symbols used internally.
const symbols = {
  isClassWrapper: Symbol('isClassWrapper')
};

//    ## Factory Private Static Members

// Use assignment based inheritence to mix in members from objects, vanilla
// JavaScript constructors, and/or Deco decorators.
const concatenate = (factory, ...decorators) => {
  // Merge constructors
  mergeConstructors(factory, ...decorators.map((decorator) => {
    if (Reflect.hasOwnProperty.call(decorator, 'constructor')) { // TODO // move to mergeC?
      return decorator.constructor;
    }
    if (isFunction(decorator) && !isClass(decorator)) {
      if (!decorator.prototype) return decorator;
      return decorator.prototype.constructor;
    }
    if (isClass(decorator)) {
      const ƒ = (...parameters) => Reflect.construct(decorator, parameters);
      ƒ[symbols.isClassWrapper] = true;
      return ƒ;
    }
    return undefined;
  }));

  // Merge defaults
  Assign(secrets(factory).defaults, ...decorators.map((decorator) => {
    if (Reflect.hasOwnProperty.call(decorator, 'defaults')) {
      return decorator.defaults;
    }
    return undefined;
  }));

  // Merge prototypes
  Assign(factory.prototype, ...decorators.map((decorator) =>
    isFunction(decorator) ? flatten(decorator.prototype) : decorator));
};
// Create and assign the constructor to the given factory prototype.
const initialize = (factory) => {
  const members = {
    constructor: function factoryConstructor (...parameters) {
      /* eslint-disable no-invalid-this */
      const constructors = secrets(factory).constructors;

      // Apply each merged constructor function, one after the other.
      return constructors.reduce((o, ƒ) => {
        const next = ƒ.apply(o, parameters);
        if (next === undefined) return o;
        if (next === o) return o;
        Assign(next, factory.prototype);
        return next;
      }, this);
      /* eslint-enable no-invalid-this */
    },
    defaults (...updates) {
      return Copy(secrets(factory).defaults, ...updates);
    }
  };

  for (const name of Reflect.ownKeys(members)) {
    Reflect.defineProperty(factory.prototype, name, {
      configurable: true,
      enumerable: false,
      value: members[name],
      writable: true
    });
  }

  Assign(factory, statics); // TODO // enumerability
};
// Constructors that will be applied sequentially to newly created instances.
const mergeConstructors = (factory, ...updates) => {
  const constructors = secrets(factory).constructors;
  constructors.push(...updates.filter((a) => a));
};

//    ## Public Static Factory Members

const statics = {
  defaults (...updates) {
    const current = secrets(this).defaults;
    if (updates.length) Assign(current, ...updates);
    return Copy(current);
    return Deco(this, { defaults: current }); // TODO // ?
  }
};

//    ## Module Definition
//
//    A function used to create factory functions (*classes*) by mixing in any
//    number of objects and/or vanilla JavaScript classes.  Deco factories
//    themselves can be passed in as a decorator to another call to `Deco()`.

const Deco = module.exports = function Deco (...decorators) {
  // A factory function for creating new instances of the "class."
  const factory = function factory (...parameters) {
    /* eslint-disable no-invalid-this */
    const ƒ = factory.prototype.constructor;

    const create = () => Reflect.construct(ƒ, parameters, factory);

    // When called as e.g. `Factory()`.
    if (!this) return create();

    // If the factory was called from a containing object, also create
    // the object e.g. when called as `YourLibrary.Factory()`.
    for (const key of Reflect.ownKeys(this)) {
      if (this[key] === factory) return create();
    }

    // If the decorator is called directly, e.g. `Factory.call(o)`, assign the
    // prototype properties and run the object through the constructor chain
    // manually.
    Assign(this, factory.prototype);
    return ƒ.apply(this, parameters);
    /* eslint-enable no-invalid-this */
  };

  // Set up the factory prototype, statics, and constructor,
  // then apply the given decorators.
  setPrototype(factory, Object.create(Deco.prototype));
  initialize(factory);
  concatenate(factory, ...decorators);

  Object.freeze(factory);
  Object.freeze(factory.prototype);

  return factory;
};

// Set up Deco's prototype.  The factory will cause most created objects
// to inherit from Deco.
setPrototype(Deco, Object.create(Function.prototype));

//    ## Deco Public Methods
//
Deco.defaults = (options, ...updates) => {
  return Copy(options, ...updates);
};
// Load and apply decorators from the caller's directory.
Deco.load = (...files) => {
  const directory = Path.dirname(CallerPath());
  return Deco.loadFrom(directory, ...files);
};
// Load and apply decorators from a directory.
Deco.loadFrom = (directory, ...files) => {
  const factory = Deco(...Deco.requireFrom(directory, ...files));
  return factory;
};
// Require all files in the caller's directory.
Deco.require = (...files) => {
  const directory = Path.dirname(CallerPath());
  return Deco.requireFrom(directory, ...files);
};
// Require a directory, optionally specify names/order of the files
//  to be loaded.
Deco.requireFrom = (directory, ...files) => {
  /* eslint-disable global-require */
  // TODO // leave out index.js or any other files?  Glance over requireindex code.
  if (!files.length) files.push(...Fs.readdirSync(directory));
  return files.map((file) => require(Path.resolve(directory, file)));
  /* eslint-enable global-require */
};
// Allow a way for instances to store private data.
Deco.hidden = (definition) => Bursary(definition);

Object.freeze(Deco);
Object.freeze(Deco.prototype);
