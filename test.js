// Unit tests for reactive-function.
var assert = require("assert");

// If using from the NPM package, this line would be
// var ReactiveFunction = require("reactive-function");
var ReactiveFunction = require("./index.js");

var ReactiveProperty = require("reactive-property");

var outputGraph = require("graph-diagrams")({

  // If true, writes graph files to ../graph-diagrams for visualization.
  outputGraphs: false,
  project: "reactive-function"
});

function output(name){
  outputGraph(ReactiveFunction.serializeGraph(), name);
}

describe("ReactiveFunction", function() { 

  describe("Core Functionality", function() { 
    it("Should depend on two reactive properties.", function () {

      var firstName = ReactiveProperty("Jane");
      var lastName = ReactiveProperty("Smith");

      var fullName = ReactiveProperty();

      var reactiveFunction = ReactiveFunction({
        inputs: [firstName, lastName],
        output: fullName,
        callback: function (first, last){
          return first + " " + last;
        }
      });

      ReactiveFunction.digest();
      assert.equal(fullName(), "Jane Smith");

      firstName("John");
      ReactiveFunction.digest();
      assert.equal(fullName(), "John Smith");

      lastName("Lennon");
      ReactiveFunction.digest();
      assert.equal(fullName(), "John Lennon");

      // For serialization.
      firstName.propertyName = "firstName";
      lastName.propertyName = "lastName";
      fullName.propertyName = "fullName";
      output("full-name");

      reactiveFunction.destroy();
    });

    it("Should depend on any number of reactive properties.", function () {
      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);
      var c = ReactiveProperty(15);

      var d = ReactiveProperty();
      var e = ReactiveProperty();

      var rf1 = ReactiveFunction({
        inputs: [a],
        output: d,
        callback: function (a){
          return a * 2;
        }
      });

      var rf2 = ReactiveFunction({
        inputs: [a, b, c],
        output: e,
        callback: function (a, b, c){
          return a + b + c;
        }
      });

      ReactiveFunction.digest();

      assert.equal(d(), 10);
      assert.equal(e(), 30);

      // For serialization.
      a.propertyName = "a";
      b.propertyName = "b";
      c.propertyName = "c";
      d.propertyName = "d";
      e.propertyName = "e";
      output("any-number");

      rf1.destroy();
      rf2.destroy();
    });

    it("Should depend on a reactive function output.", function () {

      var a = ReactiveProperty(5);
      var b = ReactiveProperty();
      var c = ReactiveProperty();

      var rf1 = ReactiveFunction({
        inputs: [a],
        output: b,
        callback: function (a){
          return a * 2;
        }
      });

      var rf2 = ReactiveFunction({
        inputs: [b],
        output: c,
        callback: function (b){
          return b / 2;
        }
      });

      ReactiveFunction.digest();
      assert.equal(c(), 5);

      // For serialization.
      a.propertyName = "a";
      b.propertyName = "b";
      c.propertyName = "c";
      output("abc");

      rf1.destroy();
      rf2.destroy();
    });

    it("Should depend on a property and a reactive function output.", function () {

      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);

      var c = ReactiveProperty();
      var d = ReactiveProperty();

      var rf1 = ReactiveFunction({
        inputs: [a],
        output: c,
        callback: function (a){
          return a * 2;
        }
      });

      var rf2 = ReactiveFunction({
        inputs: [b, c],
        output: d,
        callback: function (b, c){
          return b + c;
        }
      });

      ReactiveFunction.digest();
      assert.equal(d(), 20);

      // For serialization.
      a.propertyName = "a";
      b.propertyName = "b";
      c.propertyName = "c";
      d.propertyName = "d";
      output("abcd");

      rf1.destroy();
      rf2.destroy();
    });

    it("Should handle tricky case.", function () {

      // This is the case where model-js failed (https://github.com/curran/model),
      // which cropped up as flashes of inconstistent states in Chiasm visualizations.
      // For example, it happens when you change the X column in this example
      // "Magic Heat Map" http://bl.ocks.org/curran/a54fc3a6578efcdc19f4
      // This flaw in model-js is the main inspiration for making this library and using topological sort.
      //
      //      a
      //     / \
      //    b   |
      //    |   d
      //    c   |
      //     \ /
      //      e   
      //
      var a = ReactiveProperty(5);
      var b = ReactiveProperty();
      var c = ReactiveProperty();
      var d = ReactiveProperty();
      var e = ReactiveProperty();

      var rfs = [
        ReactiveFunction({ inputs: [a],    output: b, callback: function (a){    return a * 2; } }),
        ReactiveFunction({ inputs: [b],    output: c, callback: function (b){    return b + 5; } }),
        ReactiveFunction({ inputs: [a],    output: d, callback: function (a){    return a * 3; } }),
        ReactiveFunction({ inputs: [c, d], output: e, callback: function (c, d){ return c + d; } })
      ];

      ReactiveFunction.digest();
      assert.equal(e(), ((a() * 2) + 5) + (a() * 3));

      a(10);
      ReactiveFunction.digest();
      assert.equal(e(), ((a() * 2) + 5) + (a() * 3));

      // For serialization.
      a.propertyName = "a";
      b.propertyName = "b";
      c.propertyName = "c";
      d.propertyName = "d";
      e.propertyName = "e";
      output("tricky-case");

      rfs.forEach(function (reactiveFunction){
        reactiveFunction.destroy();
      });
    });

    it("Should automatically digest on next tick.", function (done) {
      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);
      var c = ReactiveProperty();

      var reactiveFunction = ReactiveFunction({
        inputs: [a, b],
        output: c,
        callback: function (a, b){
          return a + b;
        }
      });

      ReactiveFunction.nextFrame(function (){
        assert.equal(c(), 15);
        reactiveFunction.destroy();
        done();
      }, 0);

    });

    it("Should not invoke if an input is undefined.", function (){
      var numInvocations = 0;
      var a = ReactiveProperty();
      var b = ReactiveProperty(10);
      var c = ReactiveProperty();

      var reactiveFunction = ReactiveFunction({
        inputs: [a, b],
        output: c,
        callback: function (a, b){
          numInvocations++;
          return a + b;
        }
      });

      ReactiveFunction.digest();
      assert.equal(numInvocations, 0);

      reactiveFunction.destroy();
    });

    it("Should invoke if an input is null.", function (){
      var numInvocations = 0;
      var a = ReactiveProperty(null);
      var b = ReactiveProperty(10);
      var c = ReactiveProperty();

      var reactiveFunction = ReactiveFunction({
        inputs: [a, b],
        output: c,
        callback: function (a, b){
          numInvocations++;
          return a + b;
        }
      });

      ReactiveFunction.digest();
      assert.equal(numInvocations, 1);

      reactiveFunction.destroy();
    });

    it("Should invoke if a single input is null.", function (){
      var numInvocations = 0;
      var a = ReactiveProperty(null);

      var reactiveFunction = ReactiveFunction({
        inputs: [a],
        callback: function (a, b){
          numInvocations++;
        }
      });

      ReactiveFunction.digest();
      assert.equal(numInvocations, 1);

      reactiveFunction.destroy();
    });

    it("Should work without any output specified.", function (){
      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);
      var sideEffect = 0;
      var rf = ReactiveFunction({
        inputs: [a, b],
        callback: function (a, b){ sideEffect++; }
      });
      ReactiveFunction.digest();
      assert(sideEffect);
      rf.destroy();
    });

    it("Should work asynchronously.", function (done){
      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);
      var c = ReactiveProperty();

      var rf = ReactiveFunction({
        inputs: [a, b],
        callback: function (a, b) {
          setTimeout(function(){
            c(a + b);
          }, 10);
        }
      });

      c.on(function(value){
        assert.equal(value, 15);
        rf.destroy();
        done();
      });
    });
  });

  describe("Cleanup", function (){

    it("Should clear changed nodes on digest.", function () {
      var numInvocations = 0;
      var a = ReactiveProperty(5);
      var b = ReactiveProperty();

      var reactiveFunction = ReactiveFunction({
        inputs: [a],
        output: b,
        callback: function (a){
          numInvocations++;
          return a * 2;
        }
      });

      ReactiveFunction.digest();
      ReactiveFunction.digest();
      assert.equal(numInvocations, 1);

      reactiveFunction.destroy();
    });

    it("Should remove listeners on destroy.", function (done){
      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);
      var c = ReactiveProperty();

      var rf = ReactiveFunction({
        inputs: [a, b],
        output: c,
        callback: function (a, b){
          return a + b;
        }
      });

      // Wait until after the first auto-digest.
      ReactiveFunction.nextFrame(function (){

        rf.destroy();

        // Without the call to destroy(), this would trigger a digest.
        a(20);

        // Give time for an auto-digest to occur.
        ReactiveFunction.nextFrame(function (){

          // Confirm that a digest did not occur.
          assert.equal(c(), 15);

          done();
        }, 0);
      }, 0);
    });

    it("Should remove edges on destroy.", function (){
      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);
      var c = ReactiveProperty();

      var rf = ReactiveFunction({
        inputs: [a, b],
        output: c,
        callback: function (a, b){
          return a + b;
        }
      });

      ReactiveFunction.digest();

      assert.equal(c(), 15);

      rf.destroy();

      a(20);

      ReactiveFunction.digest();
      assert.equal(c(), 15);
    });

    it("Should remove the 'evaluate' function from the output on destroy.", function (){
      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);
      var c = ReactiveProperty();

      var rf = ReactiveFunction({
        inputs: [a, b],
        output: c,
        callback: function (a, b){
          return a + b;
        }
      });

      assert.equal(typeof c.evaluate, "function");

      rf.destroy();
      assert.equal(typeof c.evaluate, "undefined");
    });
  });
  
  describe("Data Binding", function (){

    it("Should be able to implement unidirectional data binding.", function (){
      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);
      var reactiveFunction = ReactiveFunction({
        inputs: [a],
        output: b,
        callback: function (a){
          return a;
        }
      });

      ReactiveFunction.digest();
      assert.equal(b(), 5);

      // For serialization.
      a.propertyName = "a";
      b.propertyName = "b";
      output("ab");

      reactiveFunction.destroy();
    });

    it("Should be able to implement bidirectional data binding.", function (){

      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);

      function identity(x){ return x; }
      var rf1 = ReactiveFunction({ inputs: [a], output: b, callback: identity });
      var rf2 = ReactiveFunction({ inputs: [b], output: a, callback: identity });

      ReactiveFunction.digest();

      // The most recently added edge takes precedence.
      assert.equal(b(), 10);

      a(50);
      ReactiveFunction.digest();
      assert.equal(b(), 50);

      b(100);
      ReactiveFunction.digest();
      assert.equal(a(), 100);

      // For serialization.
      a.propertyName = "a";
      b.propertyName = "b";
      output("data-binding");

      rf1.destroy();
      rf2.destroy();
    });

    it("Should compute Ohm's Law.", function (){

      // These symbols are used in the definition of Ohm's law.
      // See https://en.wikipedia.org/wiki/Ohm%27s_law
      var I = ReactiveProperty();
      var V = ReactiveProperty();
      var R = ReactiveProperty();

      var rfs = [

        // I = V / R
        ReactiveFunction({
          inputs: [V, R],
          output: I,
          callback: function (v, r){ return v / r; }
        }),

        // V = I * R
        ReactiveFunction({
          inputs: [I, R],
          output: V,
          callback: function (i, r){ return i * r; }
        }),

        // R = V / I
        ReactiveFunction({
          inputs: [V, I],
          output: R,
          callback: function (v, i){ return v / i; }
        })
      ];

      V(9)
      I(2)
      ReactiveFunction.digest();
      assert.equal(R(), 4.5);

      R(6)
      I(2)
      ReactiveFunction.digest();
      assert.equal(V(), 12);

      V(9);
      R(18);
      ReactiveFunction.digest();
      assert.equal(I(), 0.5);

      V(9)
      I(2)
      ReactiveFunction.digest();
      assert.equal(R(), 4.5);

      // For serialization.
      V.propertyName = "V";
      I.propertyName = "I";
      R.propertyName = "R";
      output("ohms-law");

      rfs.forEach(function (reactiveFunction){
        reactiveFunction.destroy();
      });
    });

    it("Should support unidirectional data binding via link().", function (){
      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);

      var reactiveFunction = ReactiveFunction.link(a, b);

      ReactiveFunction.digest();
      assert.equal(b(), 5);

      reactiveFunction.destroy();
    });
  });

  describe("Serialization", function() { 
    it("Should serialize the data flow graph.", function (){

      var firstName = ReactiveProperty("Jane");
      var lastName = ReactiveProperty("Smith");
      var fullName = ReactiveProperty();

      // For serialization.
      firstName.propertyName = "firstName";
      lastName.propertyName = "lastName";
      fullName.propertyName = "fullName";

      var rf = ReactiveFunction({
        inputs: [firstName, lastName],
        output: fullName,
        callback: function (first, last){
          return first + " " + last;
        }
      });

      var serialized = ReactiveFunction.serializeGraph();

      //console.log(JSON.stringify(serialized, null, 2));

      assert.equal(serialized.nodes.length, 3);
      assert.equal(serialized.links.length, 2);

      var idStart = 58;

      assert.equal(serialized.nodes[0].id, String(idStart));
      assert.equal(serialized.nodes[1].id, String(idStart + 1));
      assert.equal(serialized.nodes[2].id, String(idStart + 2));

      assert.equal(serialized.nodes[0].propertyName, "fullName");
      assert.equal(serialized.nodes[1].propertyName, "firstName");
      assert.equal(serialized.nodes[2].propertyName, "lastName");

      assert.equal(serialized.links[0].source, String(idStart + 1));
      assert.equal(serialized.links[0].target, String(idStart));
      assert.equal(serialized.links[1].source, String(idStart + 2));
      assert.equal(serialized.links[1].target, String(idStart));
                                               
      rf.destroy();
    });

    it("Should serialize the data flow graph and omit property names if they are not present.", function (){

      var firstName = ReactiveProperty("Jane");
      var lastName = ReactiveProperty("Smith");
      var fullName = ReactiveProperty(); 
      var rf = ReactiveFunction({
        inputs: [firstName, lastName],
        output: fullName,
        callback: function (first, last){
          return first + " " + last;
        }
      });

      var serialized = ReactiveFunction.serializeGraph();

      assert.equal(serialized.nodes.length, 3);
      assert.equal(serialized.links.length, 2);

      // These tests may easily break if earlier tests are modified.
      // Fix by copying values from:
      //console.log(JSON.stringify(serialized, null, 2));

      var idStart = 61;

      assert.equal(serialized.nodes[0].id, String(idStart));
      assert.equal(serialized.nodes[1].id, String(idStart + 1));
      assert.equal(serialized.nodes[2].id, String(idStart + 2));

      assert.equal(typeof serialized.nodes[0].propertyName, "undefined");

      assert.equal(serialized.links[0].source, String(idStart + 1));
      assert.equal(serialized.links[0].target, String(idStart));
      assert.equal(serialized.links[1].source, String(idStart + 2));
      assert.equal(serialized.links[1].target, String(idStart));

      rf.destroy();
    });

    it("Should serialize case without any output specified and use empty string as property name.", function (){
      var a = ReactiveProperty(5);
      var b = ReactiveProperty(10);
      var sideEffect = 0;

      var rf = ReactiveFunction({
        inputs: [a, b],
        callback: function (a, b){
          sideEffect++;
        }
      });

      // For serialization.
      a.propertyName = "a";
      b.propertyName = "b";
      var serialized = ReactiveFunction.serializeGraph();

      assert.equal(serialized.nodes.length, 3);
      assert.equal(serialized.links.length, 2);

      //console.log(JSON.stringify(serialized, null, 2));

      var idStart = 64;

      assert.equal(serialized.nodes[0].id, String(idStart));
      assert.equal(serialized.nodes[1].id, String(idStart + 1));
      assert.equal(serialized.nodes[2].id, String(idStart + 2));

      assert.equal(serialized.nodes[0].propertyName, "");
      assert.equal(serialized.nodes[1].propertyName, "a");
      assert.equal(serialized.nodes[2].propertyName, "b");

      assert.equal(serialized.links[0].source, String(idStart + 1));
      assert.equal(serialized.links[0].target, String(idStart));
      assert.equal(serialized.links[1].source, String(idStart + 2));
      assert.equal(serialized.links[1].target, String(idStart));
      
      rf.destroy();
    });
  });
});
