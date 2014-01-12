var expect = require('expect.js');
var deco = require('..');

describe('deco', function () {

  it('should allow building a constructor with default behavior', function () {
    var c = deco();
    var o = c();

    expect(c).to.be.a(Function);
    expect(o).to.be.an(Object);
    expect(Object.keys(o)).to.eql([]);
  });

  it('should allow building a constructor from a single decorator', function () {
    var c = deco(function () { this.genre = 'reggae' });
    var o = c();

    expect(c).to.be.a(Function);
    expect(o).to.be.an(Object);
    expect(o).to.have.property('genre', 'reggae');
  });

  it('should allow building a constructor from a series of decorators', function () {
    var d1 = require('./decorators/d1');
    var d2 = require('./decorators/d2');
    var c = deco([d1, d2]);
    var o = c();

    expect(c).to.be.a(Function);
    expect(o).to.be.an(Object);
    expect(o).to.have.property('artist', 'busy signal');
    expect(o).to.have.property('genre', 'reggae');
  });

  it('should allow building a constructor from a directory of decorator files', function () {
    var c = deco(__dirname + '/decorators');
    var o = c();

    expect(c).to.be.a(Function);
    expect(o).to.be.an(Object);
    expect(o).to.have.property('artist', 'busy signal');
    expect(o).to.have.property('genre', 'reggae');
  });

  it('should allow building a constructor from a list of string file names', function () {
    var c = deco(__dirname + '/decorators', ['d1']);
    var o = c();

    expect(c).to.be.a(Function);
    expect(o).to.be.an(Object);
    expect(o).not.to.have.property('artist');
    expect(o).to.have.property('genre', 'reggae');
  });

  it('should allow adding a single decorator', function () {
    var c = deco();
    var o;

    c.decorators(require('./decorators/d1'));

    o = c();

    expect(c).to.be.a(Function);
    expect(o).to.be.an(Object);
    expect(o).to.have.property('genre', 'reggae');
  });

  it('should allow adding a series of decorators', function () {
    var d1 = require('./decorators/d1');
    var d2 = require('./decorators/d2');
    var c = deco();
    var o;

    c.decorators([ d1, d2 ]);

    o = c();

    expect(c).to.be.a(Function);
    expect(o).to.be.an(Object);
    expect(o).to.have.property('artist', 'busy signal');
    expect(o).to.have.property('genre', 'reggae');
  });

  it('should allow adding a directory of decorator files', function () {
    var c = deco();
    var o;

    c.decorators(__dirname + '/decorators');

    o = c();

    expect(c).to.be.a(Function);
    expect(o).to.be.an(Object);
    expect(o).to.have.property('artist', 'busy signal');
    expect(o).to.have.property('genre', 'reggae');
  });

  it('should allow adding a series of file names', function () {
    var c = deco();
    var o;

    c.decorators(__dirname + '/decorators', ['d1']);

    o = c();

    expect(c).to.be.a(Function);
    expect(o).to.be.an(Object);
    expect(o).not.to.have.property('artist');
    expect(o).to.have.property('genre', 'reggae');
  });

  it('should not overwrite decorators when adding more', function () {
    var d1 = require('./decorators/d1');
    var d2 = require('./decorators/d2');
    var c = deco();
    var o;

    c.decorators(d1);
    c.decorators(d2);

    o = c();

    expect(c).to.be.a(Function);
    expect(o).to.be.an(Object);
    expect(o).to.have.property('artist', 'busy signal');
    expect(o).to.have.property('genre', 'reggae');
  });

  it('should allow adding defaults', function () {
    var c = deco();

    c.defaults({ genre: 'reggae', artist: 'midnite' });
    c.decorators(function (options) {
      expect(options).to.have.property('genre', 'reggae');
      expect(options).to.have.property('artist', 'midnite');
    });

    c();
  });

  it('should allow merging in additional defaults', function () {
    var c = deco();

    c.defaults({ genre: 'reggae', artist: 'midnite' });
    c.defaults({ label: 'gargamel records', artist: 'lutan fyah' });
    c.decorators(function (options) {
      expect(options).to.have.property('genre', 'reggae');
      expect(options).to.have.property('artist', 'lutan fyah');
      expect(options).to.have.property('label', 'gargamel records');
    });

    c();
  });

  it('should allow inheriting', function () {
    var Parent = function Parent () {};
    var c = deco();
    var o;

    c.inherit(Parent);
    o = c();

    expect(Parent.isPrototypeOf(o)).to.be(true);
  });

  it('should allow constructors to act as decorators', function () {
    var c1 = deco(__dirname + '/decorators');
    var c2 = deco(c1);
    var o = c2();

    expect(c1).to.be.a(Function);
    expect(c2).to.be.a(Function);
    expect(o).to.be.an(Object);
    expect(o).to.have.property('artist', 'busy signal');
    expect(o).to.have.property('genre', 'reggae');
  });

});
