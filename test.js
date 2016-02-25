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
    var c = ReactiveFunction(a, b, function (a, b){
      return a + b;
    });
    ReactiveFunction.digest();
    assert.equal(c(), 15);
  });

  it("Should depend on any number of reactive properties.", function () {
    var a = ReactiveProperty(5);
    var b = ReactiveProperty(10);
    var c = ReactiveProperty(15);

    var d = ReactiveFunction(a, function (a){ return a * 2; });
    var e = ReactiveFunction(a, b, c, function (a, b, c){ return a + b + c; });

    ReactiveFunction.digest();

    assert.equal(d(), 10);
    assert.equal(e(), 30);
  });

  it("Should depend on a reactive function.", function () {
    var a = ReactiveProperty(5);
    var b = ReactiveFunction(a, function (a){ return a * 2; });
    var c = ReactiveFunction(b, function (b){ return b / 2; });
    ReactiveFunction.digest();
    assert.equal(c(), 5);
  });

  it("Should depend on a reactive property and a reactive function.", function () {
    var a = ReactiveProperty(5);
    var b = ReactiveProperty(10);
    var c = ReactiveFunction(a, function (a){ return a * 2; });
    var d = ReactiveFunction(b, c, function (b, c){ return b + c; });
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
    var b = ReactiveFunction(a, function (a){ return a * 2; });
    var c = ReactiveFunction(b, function (b){ return b + 5; });
    var d = ReactiveFunction(a, function (a){ return a * 3; });
    var e = ReactiveFunction(c, d, function (c, d){ return c + d; });
    ReactiveFunction.digest();
    assert.equal(e(), ((a() * 2) + 5) + (a() * 3));
  });

  it("Should throw an error if attempting to set the value directly.", function () {
    var a = ReactiveProperty(5);
    var b = ReactiveFunction(a, function (a){ return a * 2; });
    assert.throws(function (){
      b(5);
    });
  });

  it("Should clear changed nodes on digest.", function () {
    var numInvocations = 0;
    var a = ReactiveProperty(5);
    var b = ReactiveFunction(a, function (a){
      numInvocations++;
      return a * 2;
    });
    ReactiveFunction.digest();
    ReactiveFunction.digest();
    assert.equal(numInvocations, 1);
  });

  it("Should automatically digest on next tick.", function (done) {
    var a = ReactiveProperty(5);
    var b = ReactiveProperty(10);

    var c = ReactiveFunction(a, b, function (a, b){
      return a + b;
    });

    setTimeout(function (){
      assert.equal(c(), 15);
      done();
    }, 0);
  });
});
