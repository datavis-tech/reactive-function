var ReactiveProperty = require("./reactive-property.js");
var Graph = require("./graph-data-structure.js");

// Messages for exceptions thrown.
var errors = {
  notASetter: Error("You cannot set the value of a reactive function directly.")
};

// The singleton data dependency graph.
// Nodes are reactive properties and reactive functions.
// Edges represent dependencies of reactive functions.
var graph = Graph();

// This object accumulates nodes that have changed since the last digest.
// Keys are node ids, values are truthy (the object acts like a Set).
var changedNodes = {};


// A lookup table for properties based on their assigned id.
var propertiesById = {};

// Assigns ids to properties for use as nodes in the graph.
var assignId = (function(){
  var idCounter = 1;
  return function (property){
    if(!property.id){
      property.id = idCounter++;
      propertiesById[property.id] = property;
    }
  };
}());

//ReactiveFunction(dependencies... , callback)
function ReactiveFunction(){

  // Parse arguments.
  var dependencies = Array.apply(null, arguments);
  var callback = dependencies.pop();

  // This stores the output value.
  var value;

  // The returned reactive function acts as a getter (not a setter).
  var reactiveFunction = function (){
    if(arguments.length > 0){ throw errors.notASetter; }
    return value;
  };

  // This gets invoked during a digest, after dependencies have been evaluated.
  reactiveFunction.evaluate = function (){
    value = callback.apply(null, dependencies.map(function (dependency){
      return dependency();
    }));
  };

  // Assign node ids to dependencies and the reactive function.
  assignId(reactiveFunction);
  dependencies.forEach(assignId);

  // Set up edges in the graph from each dependency.
  dependencies.forEach(function (dependency){
    graph.addEdge(dependency.id, reactiveFunction.id);
  });

  // Compute which of the dependencies are properties (excludes reactive functions).
  var properties = dependencies
    .filter(function (dependency){
      return dependency.on;
    });

  // Add change listeners to each dependency that is a property.
  var listeners = properties
    .map(function (property){
      return property.on(function (){
        changedNodes[property.id] = true;
        queueDigest();
      });
    });

  // This function must be called to explicitly destroy a reactive function.
  // Garbage collection is not enough, as we have added listeners and edges.
  reactiveFunction.destroy = function (){

    // TODO test
    // Remove change listeners from dependencies that are properties.
    listeners.forEach(function (listener, i){
      properties[i].off(listener);
    });

    // TODO test
    // Remove the edges that were added to the dependency graph.
    dependencies.forEach(function (dependency){
      graph.removeEdge(dependency.id, reactiveFunction.id);
    });

  };

  return reactiveFunction;
}

// Propagates changes through the dependency graph.
ReactiveFunction.digest = function (){
  graph
    .topologicalSort(Object.keys(changedNodes))
    .map(function (id){
      return propertiesById[id];
    })
    .forEach(function (reactiveFunction){
      reactiveFunction.evaluate();
    });
  changedNodes = {};
};

// This function queues a digest at the next tick of the event loop.
var queueDigest = debounce(ReactiveFunction.digest);

// Similar to http://underscorejs.org/#debounce
function debounce(fn){
  var timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(fn)
  };
};


// TESTS /////////////////////////////////////////////////////////////////////
var assert = require("assert");

// Should depend on two reactive properties.
var a = ReactiveProperty(5);
var b = ReactiveProperty(10);

var c = ReactiveFunction(a, b, function (a, b){
  return a + b;
});

ReactiveFunction.digest();

assert.equal(c(), 15);


// Should depend on any number of reactive properties.
var a = ReactiveProperty(5);
var b = ReactiveProperty(10);
var c = ReactiveProperty(15);

var d = ReactiveFunction(a, function (a){ return a * 2; });
var e = ReactiveFunction(a, b, c, function (a, b, c){ return a + b + c; });

ReactiveFunction.digest();

assert.equal(d(), 10);
assert.equal(e(), 30);


// Should depend on a reactive function.
var a = ReactiveProperty(5);
var b = ReactiveFunction(a, function (a){ return a * 2; });
var c = ReactiveFunction(b, function (b){ return b / 2; });
ReactiveFunction.digest();
assert.equal(c(), 5);


// Should depend on a reactive property and a reactive function.
var a = ReactiveProperty(5);
var b = ReactiveProperty(10);
var c = ReactiveFunction(a, function (a){ return a * 2; });
var d = ReactiveFunction(b, c, function (b, c){ return b + c; });
ReactiveFunction.digest();
assert.equal(d(), 20);


// Should handle tricky case.
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


// Should throw an error if attempting to set the value directly.
var a = ReactiveProperty(5);
var b = ReactiveFunction(a, function (a){ return a * 2; });
try{
  b(5);
} catch (err){
  console.log("Error thrown correctly.");
}


// Should clear changed nodes on digest.
var numInvocations = 0;
var a = ReactiveProperty(5);
var b = ReactiveFunction(a, function (a){
  numInvocations++;
  return a * 2;
});
ReactiveFunction.digest();
ReactiveFunction.digest();
assert.equal(numInvocations, 1);


// Should automatically digest on next tick.
var a = ReactiveProperty(5);
var b = ReactiveProperty(10);

var c = ReactiveFunction(a, b, function (a, b){
  return a + b;
});

setTimeout(function (){
  assert.equal(c(), 15);
  //done();
}, 0);
