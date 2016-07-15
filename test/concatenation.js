'use strict';

const Code = require('code');
const Deco = require('..');
const Decorator1 = require('./decorators/d1');
const Decorator2 = require('./decorators/d2');
const Lab = module.exports.lab = require('lab').script();
const Path = require('path');

const describe = Lab.describe;
const expect = Code.expect;
const it = Lab.it;
const meaningOfLife = 42;
const pathToDecorators = Path.join(__dirname, '/decorators');

describe('Deco', () => {
  it('concatenates a series of decorators', (done) => {
    const Factory = Deco(Decorator1, Decorator2);
    const o = Factory();

    expect(o).to.exist();
    expect(o.artist).to.equal('busy signal');
    expect(o.genre).to.equal('reggae');

    done();
  });

  it('concatenates from a directory of decorator files', (done) => {
    const Factory = Deco().load(pathToDecorators);
    const o = Factory();

    expect(o).to.exist();
    expect(o.artist).to.equal('busy signal');
    expect(o.genre).to.equal('reggae');

    done();
  });

  it('concatenates from a list of string file names', (done) => {
    const Factory = Deco().load(pathToDecorators, [ 'd1' ]);
    const o = Factory();

    expect(o).to.exist();
    expect(o.artist).not.to.exist();
    expect(o.genre).to.equal('reggae');

    done();
  });

  it('allows concatenating a class', (done) => {
    const GarbageDay = class {
      constructor () { this.test = true }
      ƒ () { return meaningOfLife }
    };
    const Factory = Deco(GarbageDay);

    const o = Factory();
    expect(o.ƒ()).to.equal(meaningOfLife);
    expect(o.isDeco).to.equal(true);
    expect(o.test).to.equal(true);
    expect(o).to.be.an.instanceof(Deco);
    expect(o).to.be.an.instanceof(Factory);
    expect(o).to.be.an.instanceof(Function);
    expect(o).not.to.be.an.instanceof(GarbageDay);
    expect(o).to.be.an.instanceof(Object);

    done();
  });

  it('disallows concatenating more than one class', (done) => {
    const FunRangers = class {};
    const GarbageDay = class {};
    expect(() => Deco(FunRangers, GarbageDay))
      .to.throw('Only one class may be concatenated.');
    done();
  });

  it('allows concatenating a vanilla factory function', (done) => {
    const C = () => done();
    const Factory = Deco(C);
    Factory();
  });
});
