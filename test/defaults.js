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
});
