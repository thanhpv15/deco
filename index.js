'use strict';

// # Deco 2

const Assign = require('copy-properties/assign');
const Bursary = require('bursary');
const CallerPath = require('caller-path');
const Fs = require('fs');
const Path = require('path');

// ## Utility Functions

// Check if the given value is a class.
const isClass = (a) => {
  if (!isFunction(a)) return false;
  if (!Reflect.ownKeys(a).includes('prototype')) return false;
  if (a.toString().indexOf('class') !== 0) return false;
  return true;
};
// Check if the given value was created by Deco.
const isDeco = (a) => a[symbols.isDeco] === true;
// Check if the given valye is a function.
const isFunction = (a) => typeof a === 'function';
// constructors stores the initialization methods for each factory
//   function created with Deco.
// defaults stores the defaults associated with a Deco factory.
const secrets = Bursary({
  constructors: Array,
  defaults: Object // TODO // store but do not auto-apply defaults!  Add back default static immutable meethod!
});
// Set `prototype` and `__proto__` for the given object.
// Note: this may be redundant when v8 bug is fixed see: http://... TODO
const setPrototype = (o, prototype) => {
  o.prototype = prototype;
  Reflect.setPrototypeOf(o, prototype);
};
// Symbols used internally.
const symbols = {
  isClassWrapper: Symbol('isClassWrapper'),
  isDeco: Symbol('isDeco')
};

// ## Factory Private Static Members

// Use assignment based inheritence to mix in members from objects, vanilla
// JavaScript constructors, and/or Deco decorators.
const concatenate = (factory, ...decorators) => {
  Assign(factory.prototype, ...decorators.map((decorator) =>
    isFunction(decorator) ? decorator.prototype : decorator));

  mergeConstructors(factory, ...decorators.map((decorator) => {
    if (Reflect.hasOwnProperty.call(decorator, 'constructor')) {
      return decorator.constructor;
    }
    if (isDeco(decorator)) return decorator.prototype.constructor; // TODO del
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
};
// Create and assign the constructor to the given factory prototype.
const initializeConstructor = (factory) => {
  const constructors = secrets(factory).constructors;
  const factoryConstructor = function factoryConstructor (...parameters) {
    /* eslint-disable no-invalid-this */

    // TODO // allow this.setArguments in constructors?

    // Apply each merged constructor function, one after the other.
    return constructors.reduce((o, ƒ) => {
      const next = Reflect.apply(ƒ, o, parameters);
      if (next === undefined) return o;
      if (next === o) return o;
      Assign(next, factory.prototype);
      return next;
    }, this);
    /* eslint-enable no-invalid-this */
  };

  Reflect.defineProperty(factory.prototype, 'constructor', {
    configurable: true,
    enumerable: false,
    value: factoryConstructor,
    writable: true
  });
};
// Constructors that will be applied sequentially to newly created instances.
const mergeConstructors = (factory, ...updates) => {
  const constructors = secrets(factory).constructors;
  constructors.push(...updates.filter((a) => a));
};

//    ## Public Static Factory Members

const statics = {
  defaults (...updates) {
    const current = defaultsByFactory(this);
    if (updates.length) Assign(current, ...updates);
    return Copy(current);
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
    const create = () => Reflect.construct(ƒ, parameters, factory);
    const ƒ = factory.prototype.constructor;

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
    return Reflect.apply(ƒ, this, parameters);
    /* eslint-enable no-invalid-this */
  };

  // Set up the factory prototype, statics, and constructor,
  // then apply the given decorators.
  setPrototype(factory, Object.create(Deco.prototype));
  initializeConstructor(factory);
  Assign(factory, statics);
  concatenate(factory, ...decorators);

  Object.freeze(factory);
  Object.freeze(factory.prototype); // TODO // set prototype parent to first constructor?

  return factory;
};

// Set up Deco's prototype.  The factory will cause most created objects
// to inherit from Deco.
setPrototype(Deco, () => {});
Deco.prototype[symbols.isDeco] = true;

// ## Deco Public Methods

//
Deco.defaults = (options, ...updates) => {
  return Copy(options, ...updates); // TODO what is a better name for fullOptions?
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
