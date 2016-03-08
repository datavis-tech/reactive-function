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


// A map for properties based on their assigned id.
// Keys are property ids, values are reactive properties.
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

function ReactiveFunction(options){

  var inputs = options.inputs;
  var callback = options.callback;
  var output = options.output;

  // TODO check for correct type for inputs
  // TODO check for correct type for callback

  // The returned reactive function acts as a getter (not a setter).
  var reactiveFunction = {};

  // This gets invoked during a digest, after inputs have been evaluated.
  output.evaluate = function (){

    var values = inputs.map(function (input){
      return input();
    });

    if(defined(values)){
      output(callback.apply(null, values));
    }

  };

  // Assign node ids to inputs and the reactive function.
  assignId(output);
  inputs.forEach(assignId);

  // Set up edges in the graph from each input.
  inputs.forEach(function (input){
    graph.addEdge(input.id, output.id);
  });

  // Add change listeners to each input property.
  var listeners = inputs
    .map(function (property){
      return property.on(function (){
        changedNodes[property.id] = true;
        queueDigest();
      });
    });

  // This function must be called to explicitly destroy a reactive function.
  // Garbage collection is not enough, as we have added listeners and edges.
  reactiveFunction.destroy = function (){

    // Remove change listeners from inputs.
    listeners.forEach(function (listener, i){
      inputs[i].off(listener);
    });

    // Remove the edges that were added to the dependency graph.
    inputs.forEach(function (input){
      graph.removeEdge(input.id, output.id);
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
    .forEach(function (property){
      property.evaluate();
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

// Returns true if all elements of the given array are defined.
function defined(arr){
  return !arr.some(function (d){
    return typeof d === "undefined" || d === null;
  });
}

module.exports = ReactiveFunction;
