# ![deco.js](https://raw.githubusercontent.com/wprl/deco/master/deco.jpeg "deco.js")

Compose modular decorators to build factories.  You're Node.js code will never have been as organized, reusable, and pluggable.

## Summary

-   Compose decorators, classes, factories, etc. into new factory functions
-   Build factories in a way similar to partial classes
-   Use es5 & es6 classes as decorators
-   Class-like factories while avoiding problematic classical concepts like `new`, `super`, and `extends`.

## Usage Overview

The main functionality is provided by the `deco()` function.  It builds factories.

```javascript
const Deco = require('deco');

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
expect(pint.created).to.be.an.instanceof(Date);
```

Factories can be used as decorators

```javascript
const Lager = Deco(Beer, {
  fermentation () { return 'bottom' }
});

const drink = Lager();
expect(drink.created).to.be.an.instanceof(Date);
expect(drink.fermentation()).to.equal('bottom');
```

Load a directory of decorator files into a constructor by sending in a path.

```javascript
const Composed1 = Deco.loadFrom('./test/decorators');
expect(Composed1().artist).to.equal('busy signal');
expect(Composed1().genre).to.equal('reggae');
```

Or to load specific files in a specific order:

```javascript
const Composed2 = Deco.loadFrom('./test/decorators', 'd1', 'd2');
expect(Composed2().artist).to.equal('busy signal');
expect(Composed2().genre).to.equal('reggae');
```

Deco.js factories are themselves decorators!  Use them to group decorators for use in other factories, or call them directly on existing objects.

```javascript
const Another = Deco(Composed2, Deco({ /* ... */ }));
expect(Another().artist).to.equal('busy signal');
expect(Another().genre).to.equal('reggae');

// also...

const existing = { a: 1, b: 2, c: 3 };
Another.call(existing);
expect(existing.a).to.equal(1);
expect(existing.b).to.equal(2);
expect(existing.c).to.equal(3);
expect(existing.artist).to.equal('busy signal');
expect(existing.genre).to.equal('reggae');
```

You can have factories create objects of other instances.

```javascript
const ErrorFactory = Deco(Error);
expect(ErrorFactory()).to.be.an.instanceof(Error);
```

## Contact

-   <http://kun.io/>
-   @wprl
-   william@kun.io

© 2016 Kun.io Labs
