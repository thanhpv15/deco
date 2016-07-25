'use strict';

//    # Prototype Tool

//    ## Dependencies

const Clone = require('@kunio/d/clone');

//    ## Module Definition

const PrototypeTool = module.exports = {};

// Calculate the prototype chain of a given prototype.
const chain = (prototype) => {
  if (!prototype) return [];
  return [ prototype, ...chain(Reflect.getPrototypeOf(prototype)) ];
};

// Copy all methods from a given prototype's chain into one object.
PrototypeTool.flatten = (prototype) => Clone(...chain(prototype).reverse());
// Set `prototype` property and the actual prototype for the given object.
PrototypeTool.set = (o, C) => {
  const prototype = Object.create(C.prototype);
  o.prototype = prototype;
  Reflect.setPrototypeOf(o, prototype);
};
