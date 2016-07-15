'use strict';

// # Deco 2

// A pollyfill to add Object.getOwnPropertyDescriptors.
require('ecma-proposal-object.getownpropertydescriptors');

const Bursary = require('bursary');
const RequireIndex = require('requireindex');

// ## Private Members
// A function that assigns/merges a series of objects.  It copies
// property definitions, not just values.
const assign = (o, ...updates) => {
  for (const update of updates.filter(identity)) {
    const d = descriptors(update);
    Reflect.deleteProperty(d, 'constructor');
    Reflect.deleteProperty(d, 'prototype');
    Object.defineProperties(o, d);
  }

  return o;
};
// Make shallow copy of an object or array and merge additional arguments.
const copy = (...a) => assign({}, ...a);
const descriptors = (o) => Object.getOwnPropertyDescriptors(o);
const hasOwnProperty = (o, name) =>
  Reflect.apply(Reflect.hasOwnProperty, o, [ name ]);
const identity = (a) => a;
const initializeConstructor = (factory) => {
  const constructors = secrets.constructorsByFactory(factory);
  const factoryConstructor = function factoryConstructor (...parameters) {
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
  };

  Reflect.defineProperty(factory.prototype, 'constructor', {
    configurable: true,
    enumerable: false,
    value: factoryConstructor,
    writable: true
  });
};
const isClass = (a) => {
  if (!isFunction(a)) return false;
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
// Static members for the created constructors.
const statics = {
  // Use assignment based inheritence to mix in members from objects, vanilla
  // JavaScript constructors, and/or Deco mixins.
  concatenate (...mixins) {
    // TODO // make this internal
    // TODO // s/mixin/decorator/ ?

    assign(this.prototype, ...mixins.map((mixin) => {
      return isFunction(mixin) ? mixin.prototype : mixin;
    }));

    this.mergeConstructors(...mixins.map((mixin) => {
      if (hasOwnProperty(mixin, 'constructor')) return mixin.constructor;
      if (isDeco(mixin)) return mixin.prototype.constructor;
      if (isFunction(mixin) && !isClass(mixin)) {
        if (!mixin.prototype) return mixin;
        return mixin.prototype.constructor;
      }
      if (isClass(mixin)) {
        return function (...parameters) {
          const o = Reflect.construct(mixin, parameters);
          assign(this, o);
          return this;
        };
      }
      return;
    }));

    this.defaults(...mixins.map((mixin) =>
      isDeco(mixin) ? mixin.defaults() : mixin.defaults));

    return this;
  },
  // Defaults that will be merged with constructor options passed in by the
  // end user of the factory.
  defaults (...updates) {
    const defaults = secrets.defaultsByFactory(this);
    assign(defaults, ...updates);
    if (!Object.keys(defaults).length) return;
    return copy(defaults);
  },
  // Load and apply mixins from a directory.
  load (directory, ...files) {
    const MixinByName = RequireIndex(directory, ...files);
    const mixins = Object.keys(MixinByName).map((name) => MixinByName[name]);
    this.concatenate(...mixins);
    return this;
  },
  // Constructors that will be applied sequentially to newly created instances.
  mergeConstructors (...updates) {
    const constructors = secrets.constructorsByFactory(this);
    constructors.push(...updates.filter(identity));
    return this;
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
const trim = (strings) => {
  const lines = strings.raw[0].split('\n');
  const trimmed = lines.map((s) => s.trim());

  const notEmpty = trimmed.filter(identity);
  return notEmpty.join('\n');
};
const validate = (...mixins) => {
  if (mixins.filter(isClass).length > 1) {
    throw new Error('Only one class may be concatenated.');
  }
};

/*

   ## Module Definition

   A function used to create factory functions (*classes*) by mixing in any
   number of objects and/or vanilla JavaScript classes.  Deco factories
   themselves can be passed in as a mixin to another call to `Deco()`.

*/
const Deco = module.exports = function Deco (...mixins) {
  validate(...mixins);

  // A factory function for creating new instances of the "class."
  const factory = function factory (...parameters) {
    const ƒ = factory.prototype.constructor;

    const create = () => Reflect.construct(ƒ, parameters, factory);

    if (!this) return create();

    // If the factory was called from a containing object, create
    // the object (don't mix in) e.g. when called as `YourLibrary.Factory()`.
    for (const key of Reflect.ownKeys(this)) {
      if (this[key] === factory) return create();
    }

    return Reflect.apply(ƒ, this, parameters);
  };

  assign(factory, statics);
  factory.prototype = Object.create(Deco.prototype);
  Reflect.setPrototypeOf(factory, factory.prototype);
  initializeConstructor(factory);
  factory.concatenate(...mixins);

  return factory;
};

Deco.prototype = () => {};
Deco.prototype.isDeco = true;

// TODO default name is current filename ?
