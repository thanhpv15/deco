'use strict';

const Code = require('code');
const Deco = require('..');
const Lab = module.exports.lab = require('lab').script();
const Path = require('path');

const describe = Lab.describe;
const expect = Code.expect;
const it = Lab.it;

describe('Deco', () => {
  it('builds an empty factory', (done) => {
    const Factory = Deco();
    const o = Factory();

    expect(Factory.isDeco).to.equal(true);
    expect(Factory).to.be.an.instanceof(Deco);
    expect(Factory).to.be.an.instanceof(Function);
    expect(o.isDeco).to.equal(true);
    expect(o).to.be.an.instanceof(Deco);
    expect(o).to.be.an.instanceof(Factory);
    expect(o).to.be.an.instanceof(Object);
    expect(Object.keys(o)).to.equal([]);

    done();
  });

  it('builds a factory with a definition', (done) => {
    const Factory = Deco({ genre: 'soul' });
    const o = Factory();

    expect(o).to.exist();
    expect(o.genre).to.equal('soul');

    done();
  });

  it('allows calling a factory from a container object', (done) => {
    const container = { Factory: Deco() };
    const o = container.Factory();

    expect(o).to.be.an.instanceof(container.Factory);
    expect(o).to.be.an.instanceof(Function);
    expect(o).to.be.an.instanceof(Object);

    done();
  });

  it('allows factories to act as decorators', (done) => {
    const Factory1 = Deco.loadFrom(Path.join(__dirname, '/decorators'));
    const Factory2 = Deco(Factory1);
    const o = Factory2();

    expect(Factory1).to.be.an.instanceof(Function);
    expect(Factory2).to.be.an.instanceof(Function);
    expect(o).not.to.be.an.instanceof(Factory1);
    expect(o).to.be.an.instanceof(Factory2);
    expect(o.artist).to.equal('busy signal');
    expect(o.genre).to.equal('reggae');

    done();
  });
});
