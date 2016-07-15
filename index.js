'use strict';

// # Deco 2

// A pollyfill to add Object.getOwnPropertyDescriptors.
require('ecma-proposal-object.getownpropertydescriptors');

const Bursary = require('bursary');
const RequireIndex = require('requireindex');  // TODO // consider alternate

/*
    ## Utility Functions
*/

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
const descriptors = (o) => Object.getOwnPropertyDescriptors(o);
const hasOwnProperty = (o, name) =>
  Reflect.apply(Reflect.hasOwnProperty, o, [ name ]);
const identity = (a) => a;
const isClass = (a) => {
  if (!isFunction(a)) return false;
  if (isDeco(a)) return false;
  if (Reflect.ownKeys(a).includes('arguments')) return false;
  if (!Reflect.ownKeys(a).includes('prototype')) return false;
  return true;
};
const isDeco = (a) => a instanceof Deco;
const isFunction = (a) => a instanceof Function;
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
const trim = (strings) => {
  const lines = strings.raw[0].split('\n');
  const trimmed = lines.map((s) => s.trim());
  return trimmed.filter(identity).join('\n');
};
const validate = (...decorators) => {
  if (decorators.filter(isClass).length > 1) {
    throw new Error('Only one class may be concatenated.');
  }
};

/*
    ## Factory private static members
*/

// Use assignment based inheritence to mix in members from objects, vanilla
// JavaScript constructors, and/or Deco decorators.
const concatenate = (factory, ...decorators) => {
  assign(factory.prototype, ...decorators.map((mixin) =>
    isFunction(mixin) ? mixin.prototype : mixin));

  mergeConstructors(factory, ...decorators.map((mixin) => {
    if (hasOwnProperty(mixin, 'constructor')) return mixin.constructor;
    if (isDeco(mixin)) return mixin.prototype.constructor;
    if (isFunction(mixin) && !isClass(mixin)) {
      if (!mixin.prototype) return mixin;
      return mixin.prototype.constructor;
    }
    if (isClass(mixin)) {
      return function classConstructorWrapper (...parameters) {
        /* eslint-disable no-invalid-this */
        const o = Reflect.construct(mixin, parameters);
        assign(this, o);
        return this;
        /* eslint-enable no-invalid-this */
      };
    }
    return undefined;
  }));

  factory.defaults(...decorators.map((mixin) =>
    isDeco(mixin) ? mixin.defaults() : mixin.defaults));
};
const initializeConstructor = (factory) => {
  const constructors = secrets.constructorsByFactory(factory);
  const factoryConstructor = function factoryConstructor (...parameters) {
    /* eslint-disable no-invalid-this */
    if (factory.defaults()) {
      if (!parameters.length) parameters.push({});
      const last = parameters.slice(-1).pop();
      const options = copy(factory.defaults(), last);
      assign(last, options);
    }

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

/*
    ## Module Definition

    A function used to create factory functions (*classes*) by mixing in any
    number of objects and/or vanilla JavaScript classes.  Deco factories
    themselves can be passed in as a mixin to another call to `Deco()`.
*/

const Deco = module.exports = function Deco (...decorators) {
  validate(...decorators);

  // A factory function for creating new instances of the "class."
  const factory = function factory (...parameters) {
    /* eslint-disable no-invalid-this */
    const ƒ = factory.prototype.constructor;

    const create = () => Reflect.construct(ƒ, parameters, factory);

    if (!this) return create();

    // If the factory was called from a containing object, create
    // the object (don't mix in) e.g. when called as `YourLibrary.Factory()`.
    for (const key of Reflect.ownKeys(this)) {
      if (this[key] === factory) return create();
    }

    return Reflect.apply(ƒ, this, parameters);
    /* eslint-enable no-invalid-this */
  };

  assign(factory, statics);
  factory.prototype = Object.create(Deco.prototype);
  Reflect.setPrototypeOf(factory, factory.prototype);
  initializeConstructor(factory);
  concatenate(factory, ...decorators);

  return factory;
};

Deco.prototype = () => {};
Deco.prototype.isDeco = true;

  // Load and apply decorators from a directory.
Deco.load = (directory, ...files) => {
  const factory = Deco();
  let DecoratorByName;

  if (files.length) {
    DecoratorByName = RequireIndex(directory, files);
  }
  else {
    DecoratorByName = RequireIndex(directory);
  }

  const decorators = Object.keys(DecoratorByName)
    .map((name) => DecoratorByName[name]);

  concatenate(factory, ...decorators);
  return factory;
};
