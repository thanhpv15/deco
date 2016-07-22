/* eslint-disable literate/comment-coverage */

'use strict';

const Code = require('code');
const Deco = require('..');
const Lab = module.exports.lab = require('lab').script();

const describe = Lab.describe;
const expect = Code.expect;
const it = Lab.it;

describe('Deco', () => {
  it('provides a method to apply defaults', (done) => {
    const Factory = Deco({
      constructor (given) {
        const options = this.defaults(given);
        expect(options).to.equal({ a: 1, b: 2, yoyo: 3 });
        done();
      },
      defaults: { a: 1, yoyo: 4 }
    });

    Factory({ b: 2, yoyo: 3 });
  });

  it('merges defaults when concatenating', (done) => {
    const Factory1 = Deco({ defaults: { a: 1 }});
    const Factory2 = Deco(Factory1, { defaults: { a: 2 }});
    const Factory3 = Deco(Factory2, {
      constructor () {
        const options = this.defaults();
        expect(options).to.equal({ a: 2 });
        done();
      }
    });
    Factory3();
  });

  it('works with es6 default parameters', (done) => {
    const Factory1 = Deco({
      constructor (zoom = true, given, message = 'five') {
        const options = this.defaults(given);
        expect(message).to.equal('three');
        expect(options).to.equal({ a: 1, b: 2, yoyo: 4 });
        expect(zoom).to.equal(true);
        done();
      },
      defaults: { a: 1, b: 2 }
    });
    Factory1(undefined, { yoyo: 4 }, 'three');
  });

  it('allows a developer to get a new class with given defaults', (done) => {
    const Factory1 = Deco({ defaults: { a: 1, yoyo: 4 }});
    const Factory2 = Factory1.defaults({ a: 2, b: 2 });
    const Factory3 = Deco(Factory2, {
      constructor () {
        expect(this.defaults()).to.equal({ a: 2, b: 2, yoyo: 4 });
        done();
      }
    });

    Factory3();
  });
});
