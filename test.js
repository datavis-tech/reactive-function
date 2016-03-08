// Unit tests for reactive-function.
var assert = require("assert");

// If using from the NPM package, this line would be
// var ReactiveFunction = require("reactive-function");
var ReactiveFunction = require("./index.js");

var ReactiveProperty = require("reactive-property");

describe("ReactiveFunction", function() { 

  it("Should depend on two reactive properties.", function () {

    var a = ReactiveProperty(5);
    var b = ReactiveProperty(10);

    var c = ReactiveProperty();

    ReactiveFunction({
      inputs: [a, b],
      output: c,
      callback: function (a, b){
        return a + b;
      }
    });

    ReactiveFunction.digest();
    assert.equal(c(), 15);
  });

  it("Should depend on any number of reactive properties.", function () {
    var a = ReactiveProperty(5);
    var b = ReactiveProperty(10);
    var c = ReactiveProperty(15);

    var d = ReactiveProperty();
    var e = ReactiveProperty();

    ReactiveFunction({
      inputs: [a],
      output: d,
      callback: function (a){
        return a * 2;
      }
    });

    ReactiveFunction({
      inputs: [a, b, c],
      output: e,
      callback: function (a, b, c){
        return a + b + c;
      }
    });

    ReactiveFunction.digest();

    assert.equal(d(), 10);
    assert.equal(e(), 30);
  });

  it("Should depend on a reactive function output.", function () {

    var a = ReactiveProperty(5);

    var b = ReactiveProperty();
    var c = ReactiveProperty();

    ReactiveFunction({
      inputs: [a],
      output: b,
      callback: function (a){
        return a * 2;
      }
    });

    ReactiveFunction({
      inputs: [b],
      output: c,
      callback: function (b){
        return b / 2;
      }
    });

    ReactiveFunction.digest();
    assert.equal(c(), 5);
  });

  it("Should depend on a property and a reactive function output.", function () {

    var a = ReactiveProperty(5);
    var b = ReactiveProperty(10);

    var c = ReactiveProperty();
    var d = ReactiveProperty();

    ReactiveFunction({
      inputs: [a],
      output: c,
      callback: function (a){
        return a * 2;
      }
    });

    ReactiveFunction({
      inputs: [b, c],
      output: d,
      callback: function (b, c){
        return b + c;
      }
    });

    ReactiveFunction.digest();
    assert.equal(d(), 20);
  });

  it("Should handle tricky case.", function () {
    //      a
    //     / \
    //    b   |
    //    |   d
    //    c   |
    //     \ /
    //      e   
    var a = ReactiveProperty(5);

    var b = ReactiveProperty();
    var c = ReactiveProperty();
    var d = ReactiveProperty();
    var e = ReactiveProperty();

    ReactiveFunction({ inputs: [a],    output: b, callback: function (a){    return a * 2; } });
    ReactiveFunction({ inputs: [b],    output: c, callback: function (b){    return b + 5; } });
    ReactiveFunction({ inputs: [a],    output: d, callback: function (a){    return a * 3; } });
    ReactiveFunction({ inputs: [c, d], output: e, callback: function (c, d){ return c + d; } });

    ReactiveFunction.digest();

    assert.equal(e(), ((a() * 2) + 5) + (a() * 3));
  });

  //it("Should throw an error if attempting to set the value directly.", function () {
  //  var a = ReactiveProperty(5);

  //  var b = ReactiveFunction(function (a){
  //    return a * 2;
  //  }, a);

  //  assert.throws(function (){
  //    b(5);
  //  });
  //});

  //it("Should clear changed nodes on digest.", function () {
  //  var numInvocations = 0;
  //  var a = ReactiveProperty(5);
  //  var b = ReactiveFunction(function (a){
  //    numInvocations++;
  //    return a * 2;
  //  }, a);
  //  ReactiveFunction.digest();
  //  ReactiveFunction.digest();
  //  assert.equal(numInvocations, 1);
  //});

  //it("Should automatically digest on next tick.", function (done) {
  //  var a = ReactiveProperty(5);
  //  var b = ReactiveProperty(10);

  //  var c = ReactiveFunction(function (a, b){
  //    return a + b;
  //  }, a, b);

  //  setTimeout(function (){
  //    assert.equal(c(), 15);
  //    done();
  //  }, 0);
  //});

  //it("Should remove listeners on destroy.", function (done){
  //  var a = ReactiveProperty(5);
  //  var b = ReactiveProperty(10);

  //  var c = ReactiveFunction(function (a, b){
  //    return a + b;
  //  }, a, b);

  //  setTimeout(function (){

  //    c.destroy();

  //    // Without the call to destroy(), this would trigger a digest.
  //    a(20);
  //    setTimeout(function (){

  //      // Confirm that a digest did not happen.
  //      assert.equal(c(), 15);

  //      done();
  //    }, 0);
  //  }, 0);
  //});

  //it("Should remove edges on destroy.", function (){
  //  var a = ReactiveProperty(5);
  //  var b = ReactiveProperty(10);

  //  var c = ReactiveFunction(function (a, b){
  //    return a + b;
  //  }, a, b);

  //  ReactiveFunction.digest();
  //  assert.equal(c(), 15);

  //  c.destroy();

  //  a(20);

  //  ReactiveFunction.digest();
  //  assert.equal(c(), 15);
  //});

  //it("Should not invoke if a dependency is undefined.", function (){
  //  var numInvocations = 0;
  //  var a = ReactiveProperty();
  //  var b = ReactiveProperty(10);
  //  ReactiveFunction(function (a, b){
  //    console.log(a);
  //    numInvocations++;
  //  }, a, b);
  //  ReactiveFunction.digest();
  //  assert.equal(numInvocations, 0);
  //});

  //it("Should not invoke if a dependency is null.", function (){
  //  var numInvocations = 0;
  //  var a = ReactiveProperty(null);
  //  var b = ReactiveProperty(10);
  //  ReactiveFunction(function (a, b){
  //    console.log(a);
  //    numInvocations++;
  //  }, a, b);
  //  ReactiveFunction.digest();
  //  assert.equal(numInvocations, 0);
  //});
});
