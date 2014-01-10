// __Dependencies__
var requireindex = require('requireindex');

// __Module Definition__
var deco = module.exports = function (decorators, options) {
  var o = this;
  var r = o;

  decorators.forEach(function (decorator) {
    r = decorator.apply(r, options);
  });

  return r;
};

// __Public Module Methods__
deco.require = requireindex;
