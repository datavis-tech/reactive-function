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

Suppose you'd like to have another property that represents the full name of the person.

```javascript
var fullName = ReactiveProperty();
```

You could set the full name value like this.

```javascript
fullName(firstName() + " " + lastName());
```

However, this sets the value of `fullName` only once, and it does not get updated when `firstName` or `lastName` change.

Here's how you can define a reactive function that updates the full name whenever the first name or last name changes.

```javascript
ReactiveFunction({
  inputs: [firstName, lastName],
  output: fullName,
  callback: function (first, last){
    return first + " " + last;
  }
});
```

This sets up a function that will be invoked when its inputs (`firstName` and `lastName`) are both defined and whenever either one changes. The function will be invoked on the next tick of the JavaScript event loop after it is defined and after any dependencies change.

The data flow graph defined above looks like this.

<img src="https://cloud.githubusercontent.com/assets/68416/15389922/cf3f24dc-1dd6-11e6-92d6-058051b752ea.png">

To force a synchronous evaluation of all reactive functions whose dependencies have updated, you can call

```javascript
ReactiveFunction.digest();
```

Now you can access the computed value of the reactive function by invoking it as a getter.

```javascript
console.log(fullName()); // Prints "Jane Smith"
```

For more detailed example code, have a look at the [tests](https://github.com/datavis-tech/reactive-function/blob/master/test.js).

[![Build Status](https://travis-ci.org/datavis-tech/reactive-function.svg?branch=master)](https://travis-ci.org/datavis-tech/reactive-function)

# Installing

If you are using NPM, install this package with:

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
<a name="digest" href="#digest">#</a> ReactiveFunction.<b>digest</b>()
<a name="next-frame" href="#next-frame">#</a> <i>reactiveFunction</i>.<b>nextFrame</b>(<i>callback</i>)
<a name="destroy" href="#destroy">#</a> <i>reactiveFunction</i>.<b>destroy</b>()

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
