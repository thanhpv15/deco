'use strict';

// # Deco 2

const Assign = require('copy-properties/assign');
const Bursary = require('bursary');
const CallerPath = require('caller-path');
const Copy = require('copy-properties/copy');
const Fs = require('fs');
const Path = require('path');

// ## Utility Functions

// Check if the given value is a class.
const isClass = (a) => {
  if (a[symbols.isClassWrapper] === true) return true;
  if (!isFunction(a)) return false;
  if (isDeco(a)) return false;
  if (!Reflect.ownKeys(a).includes('prototype')) return false;
  if (a.toString().indexOf('class') !== 0) return false;
  return true;
};
// Check if the given value was created by Deco.
const isDeco = (a) => a[symbols.isDeco] === true;
// Check if the given valye is a function.
const isFunction = (a) => a instanceof Function;
// constructorsByFactory stores the initialization methods for each factory
//   function created with Deco.
// stateByInstance stores the private internal state for each object created
//   by a Deco factory.
const secrets = Bursary({
  constructorsByFactory: Array,
  stateByInstance: Object
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
// Ensure there is only one class in the given decorators.
const validate = (...constructors) => {
  const classCount = constructors.filter(isClass).length;
  if (classCount > 1) throw new Error('Only one class may be concatenated.');
  if (classCount === 1 && !isClass(constructors[0])) { // TODO // ?
    throw new Error('Class constructors must be the first in the chain.');
  }
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
    if (isDeco(decorator)) return decorator.prototype.constructor;
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
  const constructors = secrets.constructorsByFactory(factory);
  const factoryConstructor = function factoryConstructor (...parameters) {
    /* eslint-disable no-invalid-this */

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
  const constructors = secrets.constructorsByFactory(factory);
  constructors.push(...updates.filter((a) => a));
  validate(...constructors);
};

/*
    ## Factory public static members

    Static members for the created factories.
*/

const statics = {
  // Add a property with hidden state to the factory prototype.
  property (name, initial, ƒ) { // TODO // Use Deco.secrets
    Reflect.defineProperty(this.prototype, name, {
      get () {
        const state = secrets.stateByInstance(this);
        const a = state[name];
        return a === undefined ? initial : a;
      },
      set (a) {
        const state = secrets.stateByInstance(this);
        if (ƒ) state[name] = Reflect.apply(ƒ, this, [ a, state[name] ]);
        else state[name] = a;
        return this[name];
      }
    });

    return this;
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

  // Set up the factory statics, prototype, etc.
  Assign(factory, statics);
  setPrototype(factory, Object.create(Deco.prototype));
  initializeConstructor(factory);
  concatenate(factory, ...decorators);

  return factory;
};

// Set up Deco's prototype.  The factory will cause most created objects
// to inherit from Deco.
setPrototype(Deco, () => {});
Deco.prototype[symbols.isDeco] = true;

// ## Deco Public Methods

// Load and apply decorators from the caller's directory.
Deco.load = (...files) => {
  const directory = Path.dirname(CallerPath());
  return Deco.loadFrom(directory, ...files);
};
// Load and apply decorators from a directory.
Deco.loadFrom = (directory, ...files) => {
  const factory = Deco();
  concatenate(factory, ...Deco.requireFrom(directory, ...files));
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
  if (!files.length) files.push(...Fs.readdirSync(directory));
  return files.map((file) => require(Path.resolve(directory, file)));
  /* eslint-enable global-require */
};

Object.freeze(Deco);
