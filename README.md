deco.js
=======
Compose modular decorators to build constructors.  You're Node.js code will never have been as organized, reusable, and pluggable.

Summary
-------

 * Compose decorators into constructors and modules
 * Supports public, private, and protected instance members
 * Build constructors & modules in a way similar to partial classes
 * Uses Node's built-in inherits functionality
 * Easily plug your constructors at runtime with additional decorators

Usage Overview
--------------

The main functionality is provided by the `deco()` function.  It builds constructors.

    var deco = require('deco');

    var Constructor = deco();
    var o = Constructor();

Inheritence can be achieved by the `inherits` constructor method.  For example to build an express app with the constructor:

    Constructor.inherits(require('express'));

To provide a constructor with decorators, use the `decorators` constructor method.

    Constructor.decorators(function () {
      this.cheese = 'Shropshire Blue';
    });

    var snack = Constructor();
    // `snack.cheese` will be "Shropshire Blue."

Decorators can also be supplied when the constructor is built.

    var Ale = deco(function () {
      this.created = new Date();
    });

Arrays of decorator functions are also allowed.

    var Lager = deco([ f1, f2 ]);

Deco.js provides a better way to provide default constructor options.

    Ale.defaults({
      yeast: 'Dry English Ale',
      hops: 'Nugget'
    });

    var stout = Ale({ yeast: 'Nottingham' });
    // `stout.created` was set to the current date.
    // `stout.yeast` was set to "Nottingham."
    // `stout.hops` has the default value of "Nugget."

Load a directory of decorator files into a constructor by sending in a path.

    var Composed = deco(__dirname);

Or to only load specific files:

    Composed = deco(__dirname, [ 'decorator1', 'decorator2' ]);

Deco.js constructors are themselves decorators!

    var AnotherConstructor = deco([ Composed, function () { /* ... */ }]);

Protected instance members are passed into your decorators by deco.  Each constructed object has internal access to protected data, but it is hidden from outside code.

    var Bee = deco(function (options, protected) {
      protected.poisoned = true;
    });

    Bee.decorators(function (options, protected) {
      if (protected.poisoned) this.behavior = 'erratic';
    });

To overwrite constructor options, return a value.  The returned options will be merged with the constructor's defaults.

    var FortifiedWine = deco(function (optionsString) {
      return { name: optionsString };
    });

    FortifiedWine.decorators(function (options) {
      this.name = options.name;
    });

    var quaff = FortifiedWine('sherry');
    // `quaff.name` will be set to "sherry."

Contact
-------

 * http://kun.io/
 * @wprl

&copy; 2014 William P. Riley-Land
