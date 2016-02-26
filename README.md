# reactive-function
A library for managing data flows and changing state.

# Usage

If you are using NPM, install this package with:

`npm install reactive-function`

Require it in your code like this:

```javascript
var ReactiveFunction = require("reactive-function");
```

This library is designed to function with instances of [reactive-property](https://github.com/curran/reactive-property), so you'll need to require that too.

```javascript
var ReactiveProperty = require("reactive-property");
```

Let's say you have two reactive properties to represent someone's name.

```javascript
var firstName = ReactiveProperty("Jane");
var lastName = ReactiveProperty("Smith");
```

You can define a reactive function that depends on those two properties.

```javascript
var fullName = ReactiveFunction(function (first, last){
  return first + " " + last;
}, firstName, lastName);
```

To synchronously evaluate the data dependency graph, invoke the `digest` function.

```javascript
ReactiveFunction.digest();
```

Now, you can access the value of the reactive function as a getter.

```javascript
console.log(fullName()); // Prints "Jane Smith"
```

Here's some sample code from the tests that demonstrates the features of this library.

```javascript
it("Should depend on any number of reactive properties.", function () {
  var a = ReactiveProperty(5);
  var b = ReactiveProperty(10);
  var c = ReactiveProperty(15);

  var d = ReactiveFunction(function (a){
    return a * 2;
  }, a);

  var e = ReactiveFunction(function (a, b, c){
    return a + b + c;
  }, a, b, c);

  ReactiveFunction.digest();

  assert.equal(d(), 10);
  assert.equal(e(), 30);
});

it("Should depend on a reactive function.", function () {
  var a = ReactiveProperty(5);

  var b = ReactiveFunction(function (a){
    return a * 2;
  }, a);

  var c = ReactiveFunction(function (b){
    return b / 2;
  }, b);

  ReactiveFunction.digest();
  assert.equal(c(), 5);
});

it("Should depend on a reactive property and a reactive function.", function () {
  var a = ReactiveProperty(5);
  var b = ReactiveProperty(10);

  var c = ReactiveFunction(function (a){
    return a * 2;
  }, a);

  var d = ReactiveFunction(function (b, c){
    return b + c;
  }, b, c);

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

  var b = ReactiveFunction(function (a){ return a * 2; }, a);
  var c = ReactiveFunction(function (b){ return b + 5; }, b);
  var d = ReactiveFunction(function (a){ return a * 3; }, a);
  var e = ReactiveFunction(function (c, d){ return c + d; }, c, d);

  ReactiveFunction.digest();

  assert.equal(e(), ((a() * 2) + 5) + (a() * 3));
});

it("Should throw an error if attempting to set the value directly.", function () {
  var a = ReactiveProperty(5);

  var b = ReactiveFunction(function (a){
    return a * 2;
  }, a);

  assert.throws(function (){
    b(5);
  });
});

it("Should clear changed nodes on digest.", function () {
  var numInvocations = 0;
  var a = ReactiveProperty(5);
  var b = ReactiveFunction(function (a){
    numInvocations++;
    return a * 2;
  }, a);
  ReactiveFunction.digest();
  ReactiveFunction.digest();
  assert.equal(numInvocations, 1);
});

it("Should automatically digest on next tick.", function (done) {
  var a = ReactiveProperty(5);
  var b = ReactiveProperty(10);

  var c = ReactiveFunction(function (a, b){
    return a + b;
  }, a, b);

  setTimeout(function (){
    assert.equal(c(), 15);
    done();
  }, 0);
});
```

# Case Study: Width and Height

Suppose you have some reactive properties that change, such as `width` and `height`.

```javascript
var my = {
  width: ReactiveProperty(),
  height: ReactiveProperty()
};
```

Suppose also that you have a function that resizes an SVG element that depends on those two properties.

```javascript
var svg = d3.select("body").append("svg");
function render(){
  svg
    .attr("width", my.width())
    .attr("height", my.height());
}
```

How can you invoke the `render function` when `my.width` and `my.height` change?

Related work:

 * [ReactiveJS](https://github.com/mattbaker/Reactive.js)
