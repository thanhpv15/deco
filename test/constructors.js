'use strict';

const Code = require('code');
const Deco = require('..');
const Lab = module.exports.lab = require('lab').script();

const describe = Lab.describe;
const expect = Code.expect;
const it = Lab.it;

describe('Deco', () => {
  it('sets constructor on created objects', (done) => {
    const Factory = Deco();
    const o = Factory();
    expect(o).to.be.an.instanceof(Factory);
    expect(o.constructor).to.equal(Factory.prototype.constructor);
    done();
  });

  it('copies constructors when concatenating a Deco factory', (done) => {
    const Factory1 = Deco({
      constructor () { done() }
    });
    const Factory2 = Deco(Factory1);
    Factory2();
  });

  it('allows returning a new object', (done) => {
    const Parent1 = () => Object.create(null);
    const Parent2 = () => {};

    const Factory = Deco({}, Parent1, Parent2);
    const o = Factory();
    expect(o).not.to.be.an.instanceof(Factory);
    expect(o).not.to.be.an.instanceof(Object);
    expect(o).not.to.be.an.instanceof(Parent1);
    expect(o).not.to.be.an.instanceof(Parent2);

    done();
  });

  it('only allows the first constructor to return an object', (done) => {
    const Parent1 = () => Object.create(null);
    const Parent2 = () => Object.create(null);

    const Factory = Deco(Parent1, Parent2);
    expect(() => Factory())
      .to.throw('Only the first constructor may create an object.');
    done();
  });
});
