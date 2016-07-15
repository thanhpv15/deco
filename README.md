![deco.js](https://raw.githubusercontent.com/wprl/deco/master/deco.jpeg "deco.js")
=======
Compose modular decorators to build factories.  You're Node.js code will never have been as organized, reusable, and pluggable.

Summary
-------

 * Compose decorators, classes, factories, etc. into new factory functions
 * Build factories in a way similar to partial classes
 * Use es5 & es6 classes as decorators
 * Class-like factories while avoiding problematic classical concepts like `new`, `super`, and `extends`.

Usage Overview
--------------

The main functionality is provided by the `deco()` function.  It builds factories.

```javascript
const Deco = require('.');

const Factory = Deco();
const o = Factory();
```

Decorators can be defined when the factory is built.  Custom constructor logic can be supplied.

```javascript
const Beer = Deco({
  constructor () {
    this.created = new Date();
  }
});

const pint = Beer();
// `pint.created` will be the time `Beer()` was called.
```

Factories can be used as decorators

```javascript
const Lager = Deco(Beer, {
  fermentation () { return 'bottom' }
});

const drink = Lager();
// `drink.created` will be the time `Beer()` was called.
// `drink.fermentation()` will return `'bottom'`.
```

Load a directory of decorator files into a constructor by sending in a path.

```javascript
const Composed1 = Deco.loadFrom('./test/decorators');
```

Or to load specific files in a specific order:

```javascript
const Composed2 = Deco.loadFrom('./test/decorators', 'd1', 'd2');
```

Deco.js factories are themselves decorators!  Use them to group decorators for use in other factories, or call them directly on existing objects.

```javascript
const Another = Deco(Composed2, Deco({ /* ... */ }));

// also...

const existing = { a: 1, b: 2, c: 3 };
Another.call(existing);
```

Deco.js provides a better way to provide default constructor options.

```javascript
const Ale = Deco(Beer, {
  constructor (options) {
    // When `stout` is being created:
    // `options.yeast` will be set to "Nottingham."
    // `options.hops` will have the default value of "Nugget."
  }
});

Ale.defaults({
  yeast: 'Dry English Ale',
  hops: 'Nugget'
});

const stout = Ale({ yeast: 'Nottingham' });
```

You can have factories create objects of other instances.  Only the first constructor in the chain can change the constructed object.
```javascript
const ErrorFactory = Deco(Error);
// `ErrorFactory()` will create the object to be decorated by
// calling the factory function e.g. `express()`.
```

Contact
-------

 * http://kun.io/
 * @wprl

&copy; 2014 William P. Riley-Land
