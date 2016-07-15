'use strict';

// # Deco 2

// A pollyfill to add Object.getOwnPropertyDescriptors.
require('ecma-proposal-object.getownpropertydescriptors');

const Bursary = require('bursary');
const CallerPath = require('caller-path');
const Fs = require('fs');
const Path = require('path');

// ## Utility Functions

// A function that assigns/merges a series of objects.  It copies
// property definitions, not just values.
const assign = (o, ...updates) => {
  for (const update of updates.filter(identity)) {
    const definition = descriptors(update);
    Reflect.deleteProperty(definition, 'constructor');
    Reflect.deleteProperty(definition, 'prototype');
    Object.defineProperties(o, definition);
  }

  return o;
};
// Make shallow copy of an object or array and merge additional arguments.
const copy = (...a) => assign({}, ...a);
// Get own descriptors of a given object.
const descriptors = (o) => Object.getOwnPropertyDescriptors(o);
// Check if a given object has an own property by a given name.
const hasOwnProperty = (o, name) =>
  Reflect.apply(Reflect.hasOwnProperty, o, [ name ]);
// Function that returns the identity of the given value.
const identity = (a) => a;
// Check if the given value is a class.
const isClass = (a) => {
  if (!isFunction(a)) return false;
  if (isDeco(a)) return false;
  if (!Reflect.ownKeys(a).includes('prototype')) return false;
  if (a.toString().indexOf('class') !== 0) return false;
  return true;
};
// Check if the given value was created by Deco.
const isDeco = (a) => a instanceof Deco;
// Check if the given valye is a function.
const isFunction = (a) => a instanceof Function;
// Check if the given value is undefined.
const isUndefined = (a) => a === undefined;
// constructorsByFactory stores the initialization methods for each factory
//   function created with Deco.
// defaultsByFactory stores the default constructor options for each
//   factory function created with Deco.
// stateByInstance stores the private internal state for each object created
//   by a Deco factory.
const secrets = Bursary({
  constructorsByFactory: Array,
  defaultsByFactory: Object,
  stateByInstance: Object
});
// A template tag that trims each line and removes it if empty.
const trim = (strings) => {
  const lines = strings.raw[0].split('\n');
  const trimmed = lines.map((s) => s.trim());
  return trimmed.filter(identity).join('\n');
};
// Ensure there is only one class in the given decorators.
const validate = (...decorators) => {
  if (decorators.filter(isClass).length > 1) {
    throw new Error('Only one class may be concatenated.');
  }
};

// ## Factory Private Static Members

// Use assignment based inheritence to mix in members from objects, vanilla
// JavaScript constructors, and/or Deco decorators.
const concatenate = (factory, ...decorators) => {
  assign(factory.prototype, ...decorators.map((decorator) =>
    isFunction(decorator) ? decorator.prototype : decorator));

  mergeConstructors(factory, ...decorators.map((decorator) => {
    if (hasOwnProperty(decorator, 'constructor')) return decorator.constructor;
    if (isDeco(decorator)) return decorator.prototype.constructor;
    if (isFunction(decorator) && !isClass(decorator)) {
      if (!decorator.prototype) return decorator;
      return decorator.prototype.constructor;
    }
    if (isClass(decorator)) {
      return (...parameters) => Reflect.construct(decorator, parameters);
    }
    return undefined;
  }));

  factory.defaults(...decorators.map((decorator) =>
    isDeco(decorator) ? decorator.defaults() : decorator.defaults));
};
// Create and assign the constructor to the given factory prototype.
const initializeConstructor = (factory) => {
  const constructors = secrets.constructorsByFactory(factory);
  const factoryConstructor = function factoryConstructor (...parameters) {
    /* eslint-disable no-invalid-this */

    // If defaults have been assigned, merge them with the last parameter.
    if (factory.defaults()) {
      if (!parameters.length) parameters.push({});
      const last = parameters.slice(-1).pop();
      const options = copy(factory.defaults(), last);
      assign(last, options);
    }

    // Apply each merged constructor function, one after the other.
    // Only the first constructor is allowed to reassign the object.
    return constructors.reduce((o, ƒ) => {
      const next = Reflect.apply(ƒ, o, parameters);
      if (isUndefined(next)) return o;
      if (next === o) return o;

      const isFirst = ƒ === constructors[0];
      if (!isFirst) {
        throw new Error(trim`
          Only the first constructor may create an object.`);
      }
      return assign(next, factory.prototype);
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
  constructors.push(...updates.filter(identity));
};

/*
    ## Factory public static members

    Static members for the created factories.
*/

const statics = {
  // Defaults that will be merged with constructor options passed in by the
  // end user of the factory.
  defaults (...updates) {
    const defaults = secrets.defaultsByFactory(this);
    assign(defaults, ...updates);
    if (!Object.keys(defaults).length) return undefined;
    return copy(defaults);
  },
  // Add a property with hidden state to the factory prototype.
  property (name, initial, ƒ) {
    Reflect.defineProperty(this.prototype, name, {
      get () {
        const state = secrets.stateByInstance(this);
        const a = state[name];
        return isUndefined(a) ? initial : a;
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
  validate(...decorators);

  // A factory function for creating new instances of the "class."
  const factory = function factory (...parameters) {
    /* eslint-disable no-invalid-this */
    const create = () => Reflect.construct(ƒ, parameters, factory);
    const ƒ = factory.prototype.constructor;

    if (!this) return create();

    // If the factory was called from a containing object, create
    // the object (don't mix in) e.g. when called as `YourLibrary.Factory()`.
    for (const key of Reflect.ownKeys(this)) {
      if (this[key] === factory) return create();
    }

    assign(this, factory.prototype);
    return Reflect.apply(ƒ, this, parameters);
    /* eslint-enable no-invalid-this */
  };

  // Set up the factory statics, prototype, etc.
  assign(factory, statics);
  factory.prototype = Object.create(Deco.prototype);
  Reflect.setPrototypeOf(factory, factory.prototype);
  initializeConstructor(factory);
  concatenate(factory, ...decorators);

  return factory;
};

// Set up Deco's prototype.  The factory will cause created objects
// to inherity from Deco.
Deco.prototype = () => {};
Deco.prototype.isDeco = true;

// Load and apply decorators from the caller's directory.
Deco.load = (...files) => {
  const directory = Path.dirname(CallerPath());
  return Deco.loadFrom(directory, ...files);
};

// Load and apply decorators from a directory.
Deco.loadFrom = (directory, ...files) => {
  const factory = Deco();

  if (!files.length) files.push(...Fs.readdirSync(directory));

  /* eslint-disable global-require */
  concatenate(factory, ...files.map((file) =>
    require(Path.resolve(directory, file))));
  /* eslint-enable global-require */

  return factory;
};
