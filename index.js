'use strict';

// # Deco 2

// ## Dependencies

const Bursary = require('bursary');
const CallerPath = require('caller-path');
const D = require('@kunio/d');
const Fs = require('fs');
const Path = require('path');
const PrototypeTool = require('./prototype-tool');

// ## Utility Functions
//
// Check if the given value is a class.
const isClass = (a) => {
  if (a.toString().indexOf('class') !== 0) return false;
  return true;
};
// constructors stores the initialization methods for each factory
//   function created with Deco.
// defaults stores the defaults associated with a Deco factory.
const secrets = Bursary({
  constructors: Array,
  defaults: Object
});

// ## Factory Private Static Members
//
// Constructors that will be applied sequentially to newly
// created instances.
const concatenateConstructors = (factory, ...decorators) => {
  const constructors = secrets(factory).constructors;
  constructors.push(...decorators.map((decorator) => {
    if (Reflect.hasOwnProperty.call(decorator, 'constructor')) {
      return decorator.constructor;
    }
    if (typeof decorator === 'function' && !isClass(decorator)) {
      if (!decorator.prototype) return decorator;
      return decorator.prototype.constructor;
    }
    if (isClass(decorator)) {
      return (...parameters) => Reflect.construct(decorator, parameters);
    }
    return undefined;
  }).filter(D.identity));
};
// Merge any defaults of the given decorators into this factory's defaults.
const concatenateDefaults = (factory, ...decorators) => {
  D.assign(secrets(factory).defaults, ...decorators.map((decorator) => {
    const defaults = secrets(decorator).defaults;
    if (Reflect.ownKeys(defaults).length) return defaults;
    if (Reflect.hasOwnProperty.call(decorator, 'defaults')) {
      return decorator.defaults;
    }
    return undefined;
  }).filter(D.identity));
};
// Concatenate the flattened prototype chain of the given decorators
// to the factory prototype.
const concatenatePrototypes = (factory, ...decorators) => {
  D.assign(factory.prototype, ...decorators.map((decorator) => {
    if (typeof decorator !== 'function') return decorator;
    return PrototypeTool.flatten(decorator.prototype);
  }).filter(D.identity));
};
// Use assignment based inheritence to mix in members from objects, vanilla
// JavaScript constructors, and/or Deco decorators.
const concatenate = (factory, ...decorators) => {
  concatenateConstructors(factory, ...decorators);
  concatenateDefaults(factory, ...decorators);
  concatenatePrototypes(factory, ...decorators);
};
// Create and assign the constructor to the given factory prototype.
const initialize = (factory) => {
  // ### Public instance members
  const instance = {
    constructor: function factoryConstructor (...parameters) {
      /* eslint-disable no-invalid-this */
      const constructors = secrets(factory).constructors;

      // Apply each merged constructor function, one after the other.
      return constructors.reduce((o, ƒ) => {
        const next = ƒ.apply(o, parameters);
        if (next === undefined) return o;
        if (next === o) return o;
        D.assign(next, factory.prototype);
        return next;
      }, this);
      /* eslint-enable no-invalid-this */
    },
    defaults (...updates) {
      return D.clone(secrets(factory).defaults, ...updates);
    }
  };

  // ### Public static members
  /* eslint-disable no-use-before-define */
  const statics = {
    defaults (...updates) {
      return Deco(this, ...updates.map((o) => ({ defaults: o })));
    }
  };
  /* eslint-enable no-use-before-define */

  // Apply public instance members to the factory prototype.
  for (const name of Reflect.ownKeys(instance)) {
    Reflect.defineProperty(factory.prototype, name, {
      configurable: true,
      enumerable: false,
      value: instance[name],
      writable: true
    });
  }

  // Apply public static members to the factory.
  for (const name of Reflect.ownKeys(statics)) {
    Reflect.defineProperty(factory, name, {
      configurable: true,
      enumerable: false,
      value: statics[name],
      writable: true
    });
  }
};

// ## Module Definition
//
// A function used to create factory functions (*classes*) by mixing in any
// number of objects and/or vanilla JavaScript classes.  Deco factories
// themselves can be passed in as a decorator to another call to `Deco()`.

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
    D.assign(this, factory.prototype);
    return ƒ.apply(this, parameters);
    /* eslint-enable no-invalid-this */
  };

  // Set up the factory prototype, statics, and constructor,
  // then apply the given decorators.
  PrototypeTool.set(factory, Deco);
  initialize(factory);
  concatenate(factory, ...decorators.filter(D.identity));

  // Make the factory immutable.
  Object.freeze(factory);
  Object.freeze(factory.prototype);

  return factory;
};

// Set up Deco's prototype.  The factory will cause most created objects
// to inherit from Deco.
PrototypeTool.set(Deco, Function);

// ## Deco Public Methods
// Allow a way for instances to store private data.
Deco.hidden = (definition) => Bursary(definition);
// Load and apply decorators from the caller's directory.
Deco.load = (...files) => {
  const directory = Path.dirname(CallerPath());
  return Deco.loadFrom(directory, ...files);
};
// Load and apply decorators from a directory.
Deco.loadFrom = (directory, ...files) =>
  Deco(...Deco.requireFrom(directory, ...files));
// Require all files in the caller's directory.
Deco.require = (...files) => {
  const directory = Path.dirname(CallerPath());
  return Deco.requireFrom(directory, ...files);
};
// Require a directory, optionally specify names/order of the files
// to be loaded.
Deco.requireFrom = (directory, ...files) => {
  /* eslint-disable global-require */
  if (!files.length) files.push(...Fs.readdirSync(directory));
  const notIndex = files.filter((file) => {
    if (file === 'index.js') return false;
    if (file === 'index.json') return false;
    if (file === 'index.node') return false;
    return true;
  });
  return notIndex.map((file) => require(Path.resolve(directory, file)));
  /* eslint-enable global-require */
};
