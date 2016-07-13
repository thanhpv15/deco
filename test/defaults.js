'use strict';

const Code = require('code');
const Deco = require('..');
const Lab = module.exports.lab = require('lab').script();

const describe = Lab.describe;
const expect = Code.expect;
const it = Lab.it;

describe('Deco', () => {
  it('does not provide options by default', (done) => {
    const Factory = Deco({
      constructor (...parameters) {
        expect(parameters).to.have.length(0);
        done();
      }
    });

    Factory();
  });

  it('provides a factory options object', (done) => {
    const Factory = Deco({
      constructor (...parameters) {
        expect(parameters).to.have.length(1);

        const options = parameters.shift();
        expect(options).to.exist();
        expect(options).to.equal({ mints: 'trebor' });
        done();
      }
    });

    Factory.defaults({ mints: 'trebor' });

    Factory();
  });

  it('allows setting defaults via mixin', (done) => {
    const Factory = Deco({
      constructor (options) {
        expect(options).to.exist();
        expect(options.genre).to.equal('reggae');
        expect(options.artist).to.equal('midnite');
        done();
      },
      defaults: { genre: 'reggae', artist: 'midnite' }
    });

    Factory();
  });

  it('allows merging in additional defaults', (done) => {
    const Factory = Deco({
      constructor (options) {
        expect(options).to.exist();
        expect(options.artist).to.equal('lutan fyah');
        expect(options.genre).to.equal('reggae');
        expect(options.label).to.equal('gargamel records');
        done();
      },
      defaults: { artist: 'midnite', genre: 'reggae' }
    });

    Factory.defaults({ artist: 'lutan fyah', label: 'gargamel records' });

    Factory();
  });

  it('allows merging in additional defaults from a Deco factory', (done) => {
    const Factory1 = Deco();
    Factory1.defaults({
      artist: 'khari kill',
      song: 'on the battlefield'
    });

    const Factory2 = Deco(Factory1, {
      constructor (options) {
        expect(options).to.exist();
        expect(options.artist).to.equal('khari kill');
        expect(options.song).to.equal('on the battlefield');
        done();
      }
    });

    Factory2();
  });

  it('allows non-object constructor options', (done) => {
    const C = (a, b) => {
      expect(a).to.equal('pisco');
      expect(b).to.equal(1);
      done();
    };
    const Factory = Deco(C);

    Factory('pisco', 1);
  });
});
