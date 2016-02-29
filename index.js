var ReactiveProperty = require("reactive-property");
var Graph = require("graph-data-structure");

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

  // TODO check for wrong number of args

  // Parse arguments.
  var args = Array.apply(null, arguments);
  var dependencies = args.splice(1);
  var callback = args[0];

  // TODO check for correct type for dependencies
  // TODO check for correct type for callback

  // This stores the output value.
  var value;

  // The returned reactive function acts as a getter (not a setter).
  var reactiveFunction = function (){

    if(arguments.length > 0){
      throw errors.notASetter;
    }

    return value;
  };

  // This gets invoked during a digest, after dependencies have been evaluated.
  reactiveFunction.evaluate = function (){
  
    // TODO add condition that all dependency values are defined.
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

    // Remove change listeners from dependencies that are properties.
    listeners.forEach(function (listener, i){
      properties[i].off(listener);
    });

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

// Returns a function that, when invoked, schedules the given function
// to execute on the next tick of the JavaScript event loop.
// Multiple sequential executions of the returned function within the same tick of
// the event loop will collapse into a single invocation of the original function.
// Similar to http://underscorejs.org/#debounce
function debounce(fn){
  var timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(fn)
  };
};

module.exports = ReactiveFunction;
