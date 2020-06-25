---
tags: iOS开发,Object-C,Swift
---
# iOS开发

iOS开发其实就是利用苹果公司的Object-C（后面统一简称：OC）或者swift编程语言，来开发iPhone和iPad等设备上使用的一些列应用程序

## Object-C

### 简介

* Object-C 是MAC OSX和iOS开发的基础语言
* Object-C 通常写作 Objective-C 或者 Obj-C 或 OC，是根据C语言所衍生出来的语言，继承了C语言的特性，是扩充C的面向对象编程语言

> 注意：
> 虽然Object-C是C语言派生的语言，但是OC是一种面向对象的计算机语言，而C是面向过程的语言

### 特点

* Object-C 是非常“实际”的语言。它使用一个用C写成，很小的运行库，OC写成的程序通常不会比其原始码大很多
* Objective-C 的最初版本并不支持垃圾回收
* Objective-C 不包括命名空间机制(namespace mechanism)
* 虽然 Objective-C 是C的母集，但它也不视C的基本型别为第一级的对象
* 和C++不同，Objective-C 不支持运算子重载（它不支持ad-hoc多型）
* Object-C 仅支持单一父类继承，不支持多重继承

## Swift

### 简介

* Swift，苹果于2014年WWDC（苹果开发者大会）发布的新开发语言，可与Objective-C*共同运行于Mac OS和iOS平台，用于搭建基于苹果平台的应用程序
* Swift是一款易学易用的编程语言，而且它还是第一套具有与脚本语言同样的表现力和趣味性的系统编程语言。Swift的设计以安全为出发点，以避免各种常见的编程错误类别
* 2015年12月4日，苹果公司宣布其Swift编程语言现在开放源代码。长600多页的 The Swift Programming Language 可以在线免费下载

>
> **Swift每个版本变化都非常大，以至于许多开发人员调侃：‘更新一个版本，相当于重新学习一门新的编程语言！！！！’**
> **小峰哥友情提示：如果打算采用Swift重写项目，请三思！三思！三思！**
>

### 特点

* Swift语法相对于OC来说，更简单和简介
* Swift具有更强的类型安全
* Swift对函数式编程的支持：
    * Swift 语言本身提供了对函数式编程的支持。 
    * Objc 本身是不支持的，但是可以通过引入 ReactiveCocoa 这个库来支持函数式编程。
* Swift可以编写 OS X 下的自动化脚本

### 缺点

* App体积变大
* Xcode 支持不够好
* 第三方库的支持不够多（解决方法：桥接）
* 频繁变动的语法和编译问题