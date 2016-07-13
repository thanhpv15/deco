'use strict';

const Code = require('code');
const Deco = require('..');
const Lab = module.exports.lab = require('lab').script();

const hoursInDay = 24;

const describe = Lab.describe;
const expect = Code.expect;
const it = Lab.it;

describe('Deco', () => {
  it('allows inheriting', (done) => {
    const Factory = Deco();
    const Parent = function Parent () { return this };
    Factory.inherit(Parent);

    const o = Factory();
    expect(o).to.be.an.instanceof(Factory);
    expect(o).to.be.an.instanceof(Object);
    expect(o).to.be.an.instanceof(Parent);

    done();
  });

  it('allows returning a new object', (done) => {
    const Factory = Deco();
    const Parent = function Parent () { return Object.create(null) };
    Factory.inherit(Parent);

    const o = Factory();
    expect(o).to.be.an.instanceof(Factory);
    expect(o).to.be.an.instanceof(Object);
    expect(o).not.to.be.an.instanceof(Parent);

    done();
  });

  it('allows inheriting from Error', (done) => {
    const Factory = Deco();
    Factory.inherit(Error);

    const o = Factory();
    expect(o).to.be.an.instanceof(Error);
    expect(o).to.be.an.instanceof(Factory);
    expect(o).to.be.an.instanceof(Object);

    done();
  });

  it('allows inheriting from Number', (done) => {
    const Factory = Deco();
    Factory.inherit(Number);

    const o = Factory();
    expect(o.toPrecision).to.exist();
    expect(o).to.be.an.instanceof(Factory);
    expect(o).to.be.an.instanceof(Number);
    expect(o).to.be.an.instanceof(Object);

    done();
  });

  it('allows inheriting from a class', (done) => {
    const ZombiesAteMyNeighbors = class {
      ƒ () { return hoursInDay }
    };
    const Factory = Deco();
    Factory.inherit(ZombiesAteMyNeighbors);

    const o = Factory();
    expect(o.ƒ()).to.equal(hoursInDay);
    expect(o).not.to.be.an.instanceof(Deco);
    expect(o).to.be.an.instanceof(Factory);
    expect(o).to.be.an.instanceof(Object);
    expect(o).to.be.an.instanceof(ZombiesAteMyNeighbors);

    done();
  });

  it('allows a factory in a container object to inherit', (done) => {
    const container = { Factory: Deco() };

    container.Factory.inherit(Error);

    const o = container.Factory();

    expect(o).to.be.an.instanceof(container.Factory);
    expect(o).to.be.an.instanceof(Error);
    expect(o).to.be.an.instanceof(Object);

    done();
  });
});
