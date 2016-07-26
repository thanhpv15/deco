# ![deco.js](https://raw.githubusercontent.com/wprl/deco/master/deco.jpeg "deco.js")

![Codeship](https://codeship.com/projects/9440eb40-357b-0134-488a-06ccef9b395f/status?branch=v2)

![NPM](https://nodei.co/npm/deco.png?downloads=true&downloadRank=true&stars=true)

Composable decorators for ES6.  You're Node.js code will never have been as organized, reusable, and pluggable.

## Summary

-   Provides class-like decorators and factories while avoiding problematic classical concepts like `new`, `super`, `extends`, and `instanceof`.
-   Compose objects, factory functions, ES5 constructors, and/or ES6 classes with one simple interface.
-   Write code in a style similar to partial classes.
-   Optionally, set default options for each class.
-   Easily create properties that use private data internally.

## Usage Overview

The main functionality is provided by the `deco()` function.  It is used to compose decorators.

Decorators are defined when they are built.  They are immutable.

```javascript
const Deco = require('deco');

const Decorator = Deco({
  ƒ () { return 4 }
});
```

Decorators can decorate existing objects.

```javascript
const existing = {
  g () { return 5 }
};

Decorator.call(existing);
expect(existing.ƒ()).to.equal(4);
expect(existing.g()).to.equal(5);
```

Decorators can be used as factories.  Factories are functions that create objects but don't require using the `new` keyword.

```javascript
const o = Decorator();
expect(o.ƒ()).to.equal(4);
```

Custom constructor logic can be supplied.

```javascript
const Beer = Deco({
  constructor () {
    this.created = Date.now();
  }
});

const pint = Beer();
expect(pint.created).to.be.above(1469655052201);
```

Decorators can be composed into new decorators:

```javascript
const Lager = Deco(Beer, {
  fermentation () { return 'bottom' }
});

const drink = Lager();
expect(drink.created).to.be.above(1469655052201);
expect(drink.fermentation()).to.equal('bottom');
```

Decorators execute the constructors of composed definitions sequentially.

```javascript
const TastyBeer = Deco(Beer, {
  constructor () {
    this.tasted = this.created + 86400000;
  }
});
expect(drink.created).to.be.above(1469655052201);
expect(drink.tasted).to.be.above(1469741452201);
```

### Partials / Loading from File

A directory of decorator files can be composed into a single decorator handily.

```javascript
const Composed1 = Deco.loadFrom('./test/decorators');
expect(Composed1().flavor).to.equal('bitter');
expect(Composed1().type).to.equal('liqueur');
```

Specific files can be loaded from the directory in a specified order.

```javascript
const Composed2 = Deco.loadFrom('./test/decorators', 'd2', 'd1');
expect(Composed2().flavor).to.equal('bitter');
expect(Composed2().type).to.equal('liqueur');
```

Use `Deco.load` instead of `loadFrom` to load definition files from the current directory.

### Composition

You can have factories create objects of custom instances by passing in a constructor that returns an object.

```javascript
const ErrorDecorator = Deco(Error);
expect(ErrorDecorator()).to.be.an.instanceof(Error);

// or...

const OtherDecorator = Deco(() => ({ a: 1 }));
const other = OtherDecorator();
expect(other.a).to.equal(1);

// and even...

const C = class {
  ƒ () { return 1 }
};

const CompatibleDecorator = Deco(C, {
  g () { return 2 }
});

const xyz = CompatibleDecorator();

expect(xyz).to.be.an.instanceof(C);
expect(xyz.ƒ()).to.equal(1);
expect(xyz.g()).to.equal(2);

// or compose several types of definitions in one go:

const AllAtOnce = Deco(C, function () { this.x = 'y' }, { z: 100 });
const all = AllAtOnce();
expect(all).to.be.an.instanceof(C);
expect(all.ƒ()).to.equal(1);
expect(all.x).to.equal('y');
expect(all.z).to.equal(100);
```

### Defaults

Decorators can be associated with a defaults object.  Here's an example using the defaults in a constructor.

```javascript
const DecoratorWithDefaults = Deco({
  defaults: { a: 1, yoyo: 4 }
});

const CheckDecoratorWithDefaults = Deco(DecoratorWithDefaults, {
  constructor (given) {
    const options = this.defaults(given);
    expect(options).to.equal({ a: 1, b: 2, yoyo: 3 });
  }
});

CheckDecoratorWithDefaults({ b: 2, yoyo: 3 });
```

Decorators have a `defaults` method which can be used to create a new immutable decorator by merging in new defaults.

```javascript
const DecoratorNewDefaults = DecoratorWithDefaults.defaults({ a: 2, b: 2 });
const CheckDecoratorNewDefaults = Deco(DecoratorNewDefaults, {
  constructor () {
    expect(this.defaults()).to.equal({ a: 2, b: 2, yoyo: 4 });
  }
});

CheckDecoratorNewDefaults();
```

### Private Data

Deco provides an easy mechanism for creating properties backed with private data.

```javascript
const hidden = Deco.hidden();

const DecoratorWithSecrets = Deco({
  get knox () {
    return hidden(this).knox
  },
  set knox (a) {
    hidden(this).knox = a + 1;
    return this.knox;
  }
});

const o1 = DecoratorWithSecrets();
expect(o1.knox).to.equal(undefined);
o1.knox = 1;
expect(o1.knox).to.equal(2);
```

Try deco in your project today!

### Contact

-   <http://kun.io/>
-   @wprl
-   william@kun.io

© 2016 Kun.io Labs
