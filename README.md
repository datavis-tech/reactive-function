# reactive-function [![Build Status](https://travis-ci.org/curran/reactive-function.svg?branch=master)](https://travis-ci.org/curran/reactive-function)

[![NPM](https://nodei.co/npm/reactive-function.png)](https://npmjs.org/package/reactive-function)

A library for managing data flows and changing state.

# Usage

If you are using NPM, install this package with:

`npm install reactive-function`

Require it in your code like this:

```javascript
var ReactiveFunction = require("reactive-function");
```

This library is designed to work with [reactive-property](https://github.com/curran/reactive-property), you'll need that too.

```javascript
var ReactiveProperty = require("reactive-property");
```

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
    return first + " " last;
  }
});
```

This defines a "reactive function" that will be invoked when its inputs (`firstName` and `lastName`) are both defined and whenever either one changes. The function will be invoked on the next tick of the JavaScript event loop after it is defined and after any dependencies change.

To force a synchronous evaluation of all reactive functions whose dependencies have updated, you can call

```javascript
ReactiveFunction.digest();
```

Now you can access the computed value of the reactive function by invoking it as a getter.

```javascript
console.log(fullName()); // Prints "Jane Smith"
```

For more detailed example code, have a look at the [tests](https://github.com/curran/reactive-function/blob/master/test.js).

Related work:

 * [ReactiveJS](https://github.com/mattbaker/Reactive.js)
 * [EmberJS Computed Properties](https://guides.emberjs.com/v2.0.0/object-model/computed-properties/)
 * [AngularJS Digest](https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$digest)
 * [ZJONSSON/clues](https://github.com/ZJONSSON/clues)
 * [Model.js](https://github.com/curran/model)
