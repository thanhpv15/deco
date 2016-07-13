'use strict';

const Code = require('code');
const Deco = require('..');
const Lab = module.exports.lab = require('lab').script();

const arbitrary = 987;
const arbitraryBackwards = 789;
const describe = Lab.describe;
const expect = Code.expect;
const it = Lab.it;

describe('Deco', () => {
  it('allows adding a property from the factory definition', (done) => {
    const Factory = Deco({
      get test () { return arbitrary },
      set test (a) {}
    });
    const o = Factory();

    expect(o).to.exist();
    expect(o.test).to.exist();
    expect(o.test).to.equal(arbitrary);

    o.test = undefined;
    expect(o.test).to.equal(arbitrary);

    done();
  });

  it('allows adding a Deco property', (done) => {
    const Factory = Deco();
    const o = Factory();

    expect(o.channels).not.to.exist();
    Factory.property('channels', true);
    expect(o.channels).to.exist();

    done();
  });

  it('allows setting a Deco property', (done) => {
    const Factory = Deco();
    const o = Factory();

    Factory.property('panels', true);
    expect(o.panels).to.equal(true);

    o.panels = false;
    expect(o.panels).to.equal(false);

    o.panels = undefined;
    expect(o.panels).to.equal(true);

    done();
  });

  it('allows specifying a setter function with a Deco property', (done) => {
    const Factory = Deco();
    const o = Factory();

    Factory.property('flanels', 'yo', (a) => a ? `${a}yo` : undefined);
    expect(o.flanels).to.equal('yo');

    o.flanels = 'hey-';
    expect(o.flanels).to.equal('hey-yo');

    o.flanels = undefined;
    expect(o.flanels).to.equal('yo');

    done();
  });

  it('allows mixing in a property from the factory definition', (done) => {
    const Factory1 = Deco({
      get test () { return arbitrary },
      set test (a) {}
    });
    const Factory2 = Deco(Factory1);
    const o = Factory2();

    expect(o).to.exist();
    expect(o.test).to.exist();
    expect(o.test).to.equal(arbitrary);

    o.test = undefined;
    expect(o.test).to.equal(arbitrary);

    done();
  });

  it('allows mixing in a Deco property', (done) => {
    const Factory1 = Deco();
    Factory1.property('balsam', arbitrary);
    const Factory2 = Deco(Factory1);
    const o = Factory2();

    expect(o).to.exist();
    expect(o.balsam).to.equal(arbitrary);

    o.balsam = arbitraryBackwards;
    expect(o.balsam).to.equal(arbitraryBackwards);

    o.balsam = undefined;
    expect(o.balsam).to.equal(arbitrary);

    done();
  });
});
