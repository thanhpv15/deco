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
});
