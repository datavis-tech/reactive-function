var ReactiveProperty = require("./reactive-property.js");
var Graph = require("./graph-data-structure.js");

// The singleton data dependency graph.
// Nodes are reactive properties and reactive functions.
// Edges represent dependencies of reactive functions.
var graph = Graph();

// This object accumulates nodes that have changed.
// Keys are node ids, values are truthy (the object acts like a Set).
var changedNodes = {};


// A lookup table for properties based on their assigned id.
var propertiesById = {};

// This function assigns ids to properties for use as nodes in the graph.
var assignId = (function(){
  var idCounter = 1;
  return function (property){
    if(!property.id){
      property.id = idCounter++;
      propertiesById[property.id] = property;
    }
  };
}());

// Looks up a property by its id.
function lookup(id){
  return propertiesById[id];
}

// Gets a property value.
function get(property){
  return property();
}

//ReactiveFunction(dependencies... , callback)
function ReactiveFunction(){

  var dependencies = Array.apply(null, arguments);
  var callback = dependencies.pop();

  var reactiveFunction = ReactiveProperty();

  // TODO listen for external changes and throw an exception.

  reactiveFunction.evaluate = function (){
    reactiveFunction(callback.apply(null, dependencies.map(get)));
  };

  dependencies.forEach(assignId);
  assignId(reactiveFunction);

  // TODO provide an API for removing these edges
  dependencies.forEach(function (dependency){
    graph.addEdge(dependency.id, reactiveFunction.id);
  });

  // TODO provide an API for removing these listeners
  var listeners = dependencies.map(function (dependency){
    return dependency.on(function (){
      changedNodes[dependency.id] = true;
    });
  });

  return reactiveFunction;
}

ReactiveFunction.digest = function (){
  graph
    .topologicalSort(Object.keys(changedNodes))
    .map(lookup)
    .forEach(function (reactiveFunction){
      reactiveFunction.evaluate();
    });
  changedNodes = {};
};


///////////////////////////////////////////////////////////////////////

var a = ReactiveProperty(5);
var b = ReactiveProperty(10);

var c = ReactiveFunction(a, b, function (a, b){
  return a + b;
});

var d = ReactiveFunction(a, c, function (a, c){
  return c / a;
});

var e = ReactiveFunction(c, d, function (c, d){
  return c * d;
});

ReactiveFunction.digest();

console.log(c()); // 15
console.log(d()); // 3
console.log(e()); // 45
