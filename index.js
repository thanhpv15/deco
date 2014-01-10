// __Dependencies__
var requireindex = require('requireindex');

// __Module Definition__
var deco = module.exports = function (decorators, options) {
  var o = this;
  var r = o;

  decorators.forEach(function (decorator) {
    r = decorator.call(r, options);
  });

  return r;
};

// __Public Module Methods__
deco.require = function (path) {
  var decoratorFor = requireindex(path);
  var decorators = Object.keys(decoratorFor).map(function (key) { return decoratorFor[key] });
  decorators.hash = decoratorFor;
  return decorators;
};
