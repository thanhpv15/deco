/* eslint-disable literate/comment-coverage */

'use strict';

const Code = require('code');
const Deco = require('..');
const Lab = module.exports.lab = require('lab').script();

const arbitrary = 987;
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
});
