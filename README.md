# ![deco.js](https://raw.githubusercontent.com/wprl/deco/master/deco.jpeg "deco.js")

![Codeship](https://codeship.com/projects/9440eb40-357b-0134-488a-06ccef9b395f/status?branch=v2)

[![NPM](https://nodei.co/npm/deco.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/deco/)

Compose modular decorators to build factories.  You're Node.js code will never have been as organized, reusable, and pluggable.

## Summary

-   Provides class-like factories while avoiding problematic classical concepts like `new`, `super`, and `extends`.
-   Compose decorators, factory functions, objects, and even ES6 classes with one simple interface.
-   Write code in a style similar to partial classes.
-   Optionally, set default options for each class.
-   Easily create properties that use private data internally.

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

Use `Deco.load` instead of `loadFrom` to load the current directory.

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

You can have factories create objects of other instances by passing in a constructor that returns an object.

```javascript
const ErrorFactory = Deco(Error);
expect(ErrorFactory()).to.be.an.instanceof(Error);

// or...

const OtherFactory = Deco(() => ({ a: 1 }));
const other = OtherFactory();
expect(other.a).to.equal(1);

// and even...

const C = class {
  ƒ () { return 1 }
};

const CompatibleFactory = Deco(C, {
  g () { return 2 }
});

const xyz = CompatibleFactory();

expect(xyz).to.be.an.instanceof(C);
expect(xyz.ƒ()).to.equal(1);
expect(xyz.g()).to.equal(2);

// or all at once...

const AllAtOnce = Deco(C, CompatibleFactory, function () { this.x = 'y' }, { z: 100 });
const all = AllAtOnce();
expect(all).to.be.an.instanceof(C);
expect(all.ƒ()).to.equal(1);
expect(all.g()).to.equal(2);
expect(all.x).to.equal('y');
expect(all.z).to.equal(100);
```

Defaults

```javascript
const FactoryWithDefaults = Deco({
  constructor (given) {
    const options = this.defaults(given);
    expect(options).to.equal({ a: 1, b: 2, yoyo: 3 });
  },
  defaults: { a: 1, yoyo: 4 }
});

FactoryWithDefaults({ b: 2, yoyo: 3 });

const Factory1 = Deco({ defaults: { a: 1, yoyo: 4 }});
const Factory2 = Factory1.defaults({ a: 2, b: 2 });
const Factory3 = Deco(Factory2, {
  constructor () {
    expect(this.defaults()).to.equal({ a: 2, b: 2, yoyo: 4 });
  }
});
```

Properties

```javascript
const hidden = Deco.hidden();

const FactoryWithSecrets = Deco({
  get masonic () { return hidden(this).masonic },
  set masonic (a) {
    hidden(this).masonic = a + 1;
    return this.masonic;
  }
});
const o1 = FactoryWithSecrets();
expect(o1.masonic).to.equal(undefined);
o1.masonic = 1;
expect(o1.masonic).to.equal(2);
```

## Contact

-   <http://kun.io/>
-   @wprl
-   william@kun.io

© 2016 Kun.io Labs
