deco.js
=======
Compose modular decorators to build constructors.

How to Use Deco.js
------------------

The main functionality is provided by the `deco()` function.

    var deco = require('deco');

    var Constructor = deco();
    var vanilla = Constructor();

To provide a constructor with decorators, either

    Constructor.decorators(function () {
      this.cheese = 'Windlsleydale';
    });

    var snack = Constructor();
    // snack.cheese === '';

Decorators can also be supplied when the constructor is built.

    var Ale = deco(function () {
      this.created = new Date();
    });

Deco.js provides a better way to provide default constructor options.

   Ale.defaults({
     yeast: 'Dry English Ale',
     hops: 'Nugget'
   });

   var stout = Ale({ yeast: 'Xyz' });
   // `stout.created` was set to the current date.
   // `stout.yeast` was set to
   // `stout.hops` has the default value of Nugget.

Load a directory of decorator files by sending in a path.

  var ComposedDecorators = deco(__dirname);

Deco.js constructors are themselves decorators!

  var MyOtherDecorator = deco([ ComposedDecorators, function () { /* ... */ }]);

And there you have it!

Contact
-------

 * http://kun.io/
 * @wprl

&copy; 2014 William P. Riley-Land
