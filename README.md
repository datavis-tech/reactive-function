# reactive-function

A library for managing data flows and changing state.

[![NPM](https://nodei.co/npm/reactive-function.png)](https://npmjs.org/package/reactive-function)
[![NPM](https://nodei.co/npm-dl/reactive-function.png?months=3)](https://npmjs.org/package/reactive-function)

This library provides the ability to define reactive data flows by modeling application state as a directed graph and using [topological sorting](https://en.wikipedia.org/wiki/Topological_sorting) to compute the order in which changes should be propagated. This library works only with stateful properties encapsulated using [reactive-property](https://github.com/datavis-tech/reactive-property). The topological sorting algorithm is implemented in another package, [graph-data-structure](https://github.com/datavis-tech/graph-data-structure).

Suppose you have two reactive properties to represent someone's first and last name.

```javascript
var firstName = ReactiveProperty("Jane");
var lastName = ReactiveProperty("Smith");
```

Another reactive property can represent the full name of the person.

```javascript
var fullName = ReactiveProperty();
```

You could set the full name value like this.

```javascript
fullName(firstName() + " " + lastName());
```

However, the above code sets the value of `fullName` only once. It does not get updated when `firstName` or `lastName` change.

Here's how you can define a **[ReactiveFunction](#constructor)** that automatically updates `fullName` whenever `firstName` or `lastName` change.

```javascript
var reactiveFunction = ReactiveFunction({
  inputs: [firstName, lastName],
  output: fullName,
  callback: function (first, last){
    return first + " " + last;
  }
});
```

<p align="center">
<img src="https://cloud.githubusercontent.com/assets/68416/15389922/cf3f24dc-1dd6-11e6-92d6-058051b752ea.png">
<small>The data flow graph for the example code above.</small>
</p>

Whenever `firstName` or `lastName` change, the callback defined above will be executed on the next animation frame. If you don't want to wait until the next animation frame, you can force a synchronous evaluation of the data flow graph by invoking **[digest](#digest).

```javascript
ReactiveFunction.digest();
```

Now you can access the computed `fullName` value by invoking it as a getter.

```javascript
console.log(fullName()); // Prints "Jane Smith"
```

For more detailed example code, have a look at the [tests](https://github.com/datavis-tech/reactive-function/blob/master/test.js).

[![Build Status](https://travis-ci.org/datavis-tech/reactive-function.svg?branch=master)](https://travis-ci.org/datavis-tech/reactive-function)

# Installing

If you are using [NPM](npmjs.com), install this package with:

`npm install reactive-function`

Require it in your code like this:

```javascript
var ReactiveFunction = require("reactive-function");
```

This library is designed to work with [reactive-property](https://github.com/datavis-tech/reactive-property), you'll need that too.

```javascript
var ReactiveProperty = require("reactive-property");
```

## API Documentation

<a name="constructor" href="#constructor">#</a> <b>ReactiveFunction</b>(<i>options</i>)

Construct a new reactive function. The *options* argument should have the following properties.

 * *inputs* - An array of **[ReactiveProperty](https://github.com/datavis-tech/reactive-property#constructor)** instances.
 * *output* - An instance **[ReactiveProperty](https://github.com/datavis-tech/reactive-property#constructor)**.
 * *callback* - A function whose arguments are values corresponding to *inputs*.

This constructor sets up a reactive function such that *callback* be invoked when all properties in *inputs* are defined and whenever they. The *callback* function will be invoked on the **[nextFrame](#next-frame)** after inputs change.

<a name="destroy" href="#destroy">#</a> <i>reactiveFunction</i>.<b>destroy</b>()

Cleans up resources allocated to this reactive function and removes listeners from inputs.

<a name="digest" href="#digest">#</a> ReactiveFunction.<b>digest</b>()

Propagates changes from input properties through the data flow graph defined by all reactive properties using [topological sorting](https://en.wikipedia.org/wiki/Topological_sorting).

<a name="next-frame" href="#next-frame">#</a> ReactiveFunction.<b>nextFrame</b>(<i>callback</i>)

Queues the given function to execute on the next animation frame. This is a simple polyfill for `[requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)` that falls back to `[setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout)`.

The main reason for having this is for use in the [tests](https://github.com/datavis-tech/reactive-function/blob/master/test.js), which run in a Node.js environment where `requestAnimationFrame` is not available.

## Related Work

 * [ReactiveJS](https://github.com/mattbaker/Reactive.js)
 * [vogievetsky/DVL](https://github.com/vogievetsky/DVL)
 * [EmberJS Computed Properties](https://guides.emberjs.com/v2.0.0/object-model/computed-properties/)
 * [AngularJS Digest](https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$digest)
 * [ZJONSSON/clues](https://github.com/ZJONSSON/clues)
 * [Model.js](https://github.com/curran/model)

<p align="center">
  <a href="https://datavis.tech/">
    <img src="https://cloud.githubusercontent.com/assets/68416/15298394/a7a0a66a-1bbc-11e6-9636-367bed9165fc.png">
  </a>
</p>
