// __Dependencies__
var requireindex = require('requireindex');

// __Module Definition__
var deco = module.exports = function (decorators, options) {
  var o = this;

  decorators.forEach(function (decorator) {
    decorator.call(o, options);
  });

  return o;
};

// __Public Module Methods__
deco.require = function (path) {
  var decoratorFor = requireindex(path);
  var decorators = Object.keys(decoratorFor).map(function (key) { return decoratorFor[key] });
  decorators.hash = decoratorFor;
  return decorators;
};
