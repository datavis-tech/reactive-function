var ReactiveProperty = require("reactive-property");
var Graph = require("graph-data-structure");

// The singleton data dependency graph.
// Nodes are reactive properties.
// Edges are dependencies between reactive function inputs and outputs.
var graph = Graph();

// This object accumulates nodes that have changed since the last digest.
// Keys are node ids, values are truthy (the object acts like a Set).
var changed = {};

// A map for properties based on their assigned id.
// Keys are property ids, values are reactive properties.
var properties = {};

// Assigns ids to properties for use as nodes in the graph.
// If the property already has an id, does nothing.
var assignId = (function(){
  var counter = 1;
  return function (property){
    if(!property.id){
      property.id = counter++;
      properties[property.id] = property;
    }
  };
}());

// The reactive function constructor.
// Accepts an options object with
//  * inputs - An array of reactive properties.
//  * callback - A function with arguments corresponding to values of inputs.
//  * output - A reactive property.
function ReactiveFunction(options){

  // TODO validate options, throw exceptions

  var inputs = options.inputs;
  var callback = options.callback;
  var output = options.output || function (){};

  // The returned object.
  var reactiveFunction = {};

  // This gets invoked during a digest, after inputs have been evaluated.
  output.evaluate = function (){

    // Get the values for each of the input reactive properties.
    var values = inputs.map(function (input){
      return input();
    });

    // If all input values are defined,
    if(defined(values)){

      // invoke the callback and assign the output value.
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
        changed[property.id] = true;
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

    // Remove the reference to the 'evaluate' function.
    delete output.evaluate;

  };

  return reactiveFunction;
}

// Propagates changes through the dependency graph.
ReactiveFunction.digest = function (){

  graph
    .topologicalSort(Object.keys(changed), false)
    .map(function (id){
      return properties[id];
    })
    .forEach(function (property){
      property.evaluate();
    });

  changed = {};
};

// This function queues a digest at the next tick of the event loop.
var queueDigest = debounce(ReactiveFunction.digest);

// Returns a function that, when invoked, schedules the given function
// to execute on the next tick of the JavaScript event loop.
// Multiple sequential executions of the returned function within the same tick of
// the event loop will collapse into a single invocation of the original function
// on the next tick.
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
