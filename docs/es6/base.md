# 箭头函数

> **箭头函数表达式的语法比函数表达式更简洁，并且没有自己的this，arguments，super或 new.target。这些函数表达式更适用于那些本来需要匿名函数的地方，并且它们不能用作构造函数。**

## 基础用法

```
var elements = [
  'Hydrogen',
  'Helium',
  'Lithium',
  'Beryllium'
];

elements.map(function(element) { 
  return element.length; 
}); 
// 返回数组：[8, 6, 7, 9]

// 上面的普通函数可以改写成如下的箭头函数
elements.map((element) => {
  return element.length;
}); 
// [8, 6, 7, 9]

// 当箭头函数只有一个参数时，可以省略参数的圆括号
elements.map(element => {
 return element.length;
}); 
// [8, 6, 7, 9]

// 当箭头函数的函数体只有一个 `return` 语句时，可以省略 `return` 关键字和方法体的花括号
elements.map(element => element.length); 
// [8, 6, 7, 9]
```

## 不绑定this

在箭头函数出现之前，每个新定义的函数都有它自己的 this值（在构造函数的情况下是一个新对象，在严格模式的函数调用中为 undefined，如果该函数被作为'对象方法'调用则为基础对象等）。

```
function Person() {
  // Person() 构造函数定义 `this`作为它自己的实例.
  this.age = 0;

  setInterval(function growUp() {
    // 在非严格模式, growUp()函数定义 `this`作为全局对象, 
    // 与在 Person()构造函数中定义的 `this`并不相同.
    this.age++;
  }, 1000);
}

var p = new Person();
```

箭头函数不会创建自己的this,它只会从自己的作用域链的上一层继承this。因此，在下面的代码中，传递给setInterval的函数内的this与封闭函数中的this值相同：

```
function Person(){
  this.age = 0;

  setInterval(() => {
    this.age++; // |this| 正确地指向 p 实例
  }, 1000);
}

var p = new Person();
```

### 通过 call 或 apply 调用

箭头函数没有自己的this指针，通过 call() 或 apply() 方法调用一个函数时，只能传递参数（不能绑定this），他们的第一个参数会被忽略。
箭头函数被声明的时候，就会从自己的作用域链的上一层继承this，call() 或 apply()调用箭头函数，跟普通函数效果不同，this不会发生改变！

```
var a = {
  o: 1
}
var b = {
  o: 2
}
// 声明函数objFun
function objFun () {
  return () => {
    console.log(this)
  }
}
// 此时箭头函数被声明，this确定
var c = objFun.call(a)
// 结果{o: 1}
c()
// 更改不会生效,结果{o: 1}
c.call(b)
```

## 不绑定this

箭头函数不绑定Arguments对象。因此，在本示例中，arr使用的是创建的arguments数组，foo中f函数中的arguments只是引用了封闭作用域内的arguments。

```
var arguments = [1, 2, 3];
// 此处的arguments就是上面的数组，不是函数内的参数
var arr = () => arguments[0];

var a = arr();
// 1
console.log(a);

function foo (n, s) {
  // 隐式绑定 foo 函数的 arguments 对象. arguments[0] 是 n
  // arguments[1]=4 n=1 ; 4 + 1 = 5
  var f = () => arguments[1] + n;
  return f();
}

var f = foo(1, 4);
// 5
console.log(f);
```

##像函数一样使用箭头函数

箭头函数继承父作用域this

```
'use strict';
var obj = {
  i: 10,
  b: () => console.log(this.i, this),
  c: function() {
    console.log( this.i, this)
  }
}
obj.b(); 
// undefined, Window{...}
obj.c(); 
// 10, Object {...}
```

Object.defineProperty()的示例

```
'use strict';
var obj = {
  a: 10
};
Object.defineProperty(obj, "b", {
  get: () => {
    console.log(this.a, typeof this.a, this);
    return this.a+10; 
   // 代表全局对象 'Window', 因此 'this.a' 返回 'undefined'
  }
});
// undefined   "undefined"   Window {postMessage: ƒ, blur: ƒ, focus: ƒ, close: ƒ, frames: Window, …}
obj.b;
```

prototype示例

```
foo = 1111
function A() {
  this.foo = 1
}

A.prototype.bar = () => console.log(this.foo)

let a = new A()
// 打印结果1111。此处箭头函数指向仍然是Window
a.bar()  
```

##使用 new 操作符
箭头函数不能用作构造器，和 new一起用会抛出错误。
```
var Foo = () => {};
// TypeError: Foo is not a constructor
var foo = new Foo();
```

##使用prototype属性
箭头函数没有prototype属性。
```
var Foo = () => {};
// undefined
console.log(Foo.prototype);
```

##使用 yield 关键字
yield 关键字通常不能在箭头函数中使用（除非是嵌套在允许使用的函数内）。因此，箭头函数不能用作生成器。
