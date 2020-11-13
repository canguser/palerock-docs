# 模拟 Vue 中 JS 动态表达式在模版中被动态解析的实现
最近在写自己的一个 web 框架 `ref-lit.js`，仅仅打算自己练练手，在这个框架中，其模版语法借助了 `lit-html.js`，而 `lit-html.js` 是通过 ES2015 规范中的`模版字符串`实现的 HTML 模版以及表达式的绑定的，虽然好用，但是考虑到兼容问题，我就想着自己去写一个解析模版的方法，将类似于 Vue 中的模版解析为模版字符串的结果。而为了能够达到学习和提升的效果，我不打算第一时间去参考 Vue 的源码，想着通过自己的知识体系能不能实现这个需求，那么，首先从最基础的 JS 表达式入手。

## 什么是 JS 表达式
通常意义上，对于表达式，我们可以理解为：  
 `是由运算元和运算符(可选)构成，并产生运算结果的语法结构`  
 而在 JS 中，表达式大概可以分为`基本表达式`，`复杂表达式`以及`复合表达式`

 - 基本表达式
    - this、null、arguments等内置的关键字
    - 变量：即一个已声明的标识符
    - 字面量：仅包括数字字面量、布尔值字面量、字符串字面量、正则字面量
    - 分组表达式：即用来表示立刻进行计算的
    - *以上表达式都是原子表达式，是无法分解的表达式*
- 复杂表达式
    复杂表达式是需要其它表达式参与而组合而成的表达式，
    - 对象的初始化表达式、数组的初始化表达式
    ```javascript
    // e.g.
    // 数组初始化
    [expression,expression,expression]
    // 对象初始化
    {
        expression: expression,
        expression: expression,
        expression: expression
    }
    // 或
    {
        [expression]: expression,
        [expression]: expression,
        [expression]: expression
    }
    ```
    **注意**：由于 `{}` 在 JS 中有代码块的作用，一半情况不能在无赋值情况下直接使用，在一个包含一个及以上除对象声明的的表达式的代码块中，无赋值情况的直接使用会报错
    ```javascript
    // 错误
    const a = 1;
    {
        number: a
    }
    ```
    ```javascript
    // 正确(不推荐)，
    const a = 1;
    (
        {
            number: a
        }
    )
    ```
    ```javascript
    // 正确
    const a = 1;
    const b = {
        number: a
    }
    ```
    ```javascript
    // 正确
    const a = 1;
    function b(){
        return {
            number: a
        }
    }
    ```
    - 属性访问表达式
    ```javascript
    // e.g.
    a.b
    ```
    - 函数定义表达式
    ```javascript
    // e.g.
    // 普通函数
    function(){
        // do something
    }
    // 箭头函数
    () => {
        // do something
    }
    ```
    **注意**：和对象声明类似，在没有赋值的情况下最好不要直接使用
    - 调用表达式
    ```javascript
    // e.g.
    // 调用一个方法
    a()
    ```
- 复合表达式
    复合表达式是指将多个表达式通过运算符号连接从而形成新的表达式
    ```javascript
    // e.g.
    1 + 2 + 3
    ```

> 需要注意的是，在 JS 中，表达式总是具有**返回值**的，其中，复合表达式的值是运算结果，其它表达式是其本身，由于每个表达式都有返回值，因此每个表达式都能作为'邻近'的表达式的运算元参与运算。可以将无限个表达式'邻近'地连接成复合表达式。

## Vue 中的 JS 表达式
在 Vue 或其它模版渲染框架中，我们常常会在 HTML 模版中通过表达式来绑定相应的区域以供将表达式的结果渲染到页面上或方法中，以 Vue 为例子，在 Vue 中，大概支持以下表达式
- 变量/方法：即一个已在 vue 的 context 中申明的变量或方法
    ```html
    <p @click="clickHandler">{{content}}</p>
    ```
    以上代码中的 `clickHandler` 和 `content` 都是该类型的表达式，当然，属性访问表达式也是属于该类型。
- 属性访问表达式：同上
- 数组/对象声明表达式
    ```html
    <p :class="{'a':isA}"></p>
    ```
- 函数定义表达式: 以表达式声明一个方法
    ```html
    <p @click="()=>{handleClick()}"></p>
    ```
- 函数调用表达式
    ```html
    <p @click="clickHandler()"></p>
    ```
- 复合表达式：运算符参与的表达式，如二元、三元表达式
    ```html
    <p v-if="a && b || c">{{c ? d : ( f + g )}}</p>
    ```

综合看来，在 Vue 中，大部分表达式类型（除了 this，arguments 等）都能得到支持。
但是，细心的朋友可能会发现，在 Vue 中的表达式和我们通常意义上的 JS 表达式有一丢丢不同，比如上面的一个例子 `{'a':isA}` 这是声明一个对象的表达式，其中引用了变量 `isA`, 然而在 JS 中正常的书写表达式是需要在表达式之前声明 `isA` 这个变量的，如下
```javascript
function test(){
    const isA = false;
    return {'a': isA};
}
```
而在 Vue 中，`isA` 这个变量是申明在 Vue 的 context 上下文中的，按理说是不能直接调用的，就好比以下代码
```javascript
'use strict'
function test(){
    const context = {isA: false};
    return {'a': isA}; // - > 在 use strict 情况下报错：isA is not defined  
}
```
那 Vue 究竟是怎么实现该表达式正常运行的呢？为了揭开这个问题，我们首先得知道在 Vue 中，是怎么去解析表达式的。

## JS 中的动态调用方法

在 Vue 里面，我们可以理解表达式是作为字符串是嵌套在 HTML 模版的中一部分，Vue 在解析 HTML 模版的同时，也解析了该表达式，难道是 Vue 专门写了一套解析代码来解析相应字符串？这不是没有可能，只是要解析到和 JS 表达式几乎一致，需要很大的工作/代码量，所以可以排除这个可能，除此之外那肯定是使用 JS 内置的解析代码的函数，那答案就只有以下两种可能性了
1. `eval`
2. `new Function`

### 使用 `eval` 方法解析表达式
`eval` 方法可以动态执行表达式并获取表达式的值作为返回值，如在 `const a = eval('1+2+3')` 代码中，获取到 `a == 6`，并且 `eval` 可以获取到上下文中声明的变量
```javascript
// eval e.g.
const a = 1;
const b = 2;
const c = eval('a + b'); // - > 3
```
看起来和 Vue 的表达式解析很接近了，但还是差一点，Vue 中是能够直接获取到 context 变量中的的属性值，而 `eval` 是直接取的是上下文中的值，到这里，我又有了一个猜想，难道是 Vue 中先将所有 context 变量中的属性名在上下文声明一遍，然后再调用 `eval` 方法，类似以下代码
```javascript
const context = {
    a:1,
    b:2,
    c:3
}

const a = context.a;
const b = context.a;
const c = context.c;

const result = eval('a + b + c');
```
不过想来也有问题，毕竟随着上下文的属性变化，有多少个属性是不定的，除非将其声明在 `eval` 中，但如果要声明在 `eval` 中，由于 `eval` 只能接受一个表达式，要在上下文声明变量就只能使用函数声明+调用表达式，还得去用循环拼接字符串，不过第一感觉还是可行的， 示例代码大概如下
```javascript
const context = {
    a:1,
    b:2,
    c:3
}

const result = eval(
    '(function(){' +
        'const a = context.a;' +
        'const b = context.b;' +
        'const c = context.b;' +
        'return a + b + c' +
    '})()'
);
```
如上诉代码，中间部分上下文变量声明改成循环遍历 context 对象中的 key 就可以达到我们想要的效果了。
```javascript
const context = {
    a:1,
    b:2,
    c:3
}

const result = eval(
    '(function(){' +
        Object.keys(context).map(
            key => 'const ' + key + ' = context[' + key + '];'
        ).join('') +
        'return a + b + c' +
    '})()'
);
```
乍一看，好像没啥问题，但一旦 context 中属性多了，成千上万个，那不是要生成一个超长的方法？这谁抵得住？不用想，Vue 肯定不是这样来解析表达式的。  
好吧，使用 `eval` 方法不能找到解决方案，那只有试试 `new Function`

### 使用 `new Function` 解析表达式

与 `eval` 方法最大的不同在于，`new Function` 返回的是一个方法，而前者返回的是一个表达式的值，在使用 `new Function` 时，其构造方法可以接受多个参数
    - 最后一个参数是构成方法体的字符串
    - 前面的参数代表该方法接受参数的 name

```javascript
// e.g.

const func = new Function('return 100'); // 没有指定参数 name，只有方法体
// 等同于 const func = function(){ return 100 }

func() // - > 100

const func2 = new Function('name','return name'); // 指定了一个参数
// 等同于 const func2 = function(name){ return name }

func2('test') // - > test

const func3 = new Function('name','age','return name + age'); // 指定了两个参数
// 等同于 const func2 = function(name, age){ return name + age }

func2('test',18) // - > test18

```

在执行 `new Function` 生成的方法时，其上下文不能获取到非 global 的已声明的变量，但是可以获取到参数传递的值。  
因此，按之前 `eval` 拼接字符串的思路，也是完全可行的

```javascript

const context = {
    a:1,
    b:2,
    c:3
}

const func = new Function(
    'context',
    Object.keys(context).map(
        key => 'const ' + key + ' = context[' + key + '];'
    ).join('') +
    'return a + b + c;'
);

const result = func(context);
```

与 `eval` 类似，也有着一旦 context 属性过多，方法体太大的问题。  

### 字符串替换？
那 Vue 到底是怎么做到的呢，突然，我灵机一闪，之前全都是字符串拼接来解决问题，那如果不拼接，如果我把表达式字符串里面的变量做一下替换不就成了？假设表达式是 `a + b + c`, 我给替换成 `context.a + context.b + context.c` 不久成了？

带着这股兴奋，我立马去尝试了一下，仿佛被一盆冷水浇过，看似简单的替换居然有着很大的难度，其原因就在于 JS 的表达式实在是太丰富了，没法去简单地一一找到每种表达式其变量所在位置从而替换，这本质上就是在探索 JS 语法的构成。

想到语法的构成，想起了多年前看过的编译原理，莫非，莫非 Vue 是用编译原理的知识来解决这个问题的？真牛*啊，想到这里，我默默的回忆起了遥远的记忆，`AST - 抽象语法树` 出现在我的脑海中，嗯，是它了。

## 什么是 AST - 抽象语法树

抽象语法树（AST），就如同其命名而言，是对语法的抽象，以树与节点的数据结构呈现，是与特定编程语言无特定关系的结构，每一种编程语言书写的代码都可以生成它的抽象语法树。  
`AST` 就是将代码拆解，拆分至最小的不可划分的模块，以 `Tree` 的数据形式表明代码是怎么被解析的。  
实际上，在 JS 中，很少会在日常业务中涉及到 `AST`，用到 `AST` 的通常是在前端自动化工程框架（如 `webpack`、`vue-cli`）中，某些大型框架的内部实现（如 `Vue` 的 `HTML template`）中，或者是有批量修改源代码的工程需求中才会用到。但尽管如此，`AST` 的能力十分强大。  

在本文的需求中，简单的使用 `eval` 或 `new Function` 是没能优雅地实现相应需求的，那么如果再加上 `AST` 呢？我们简单的整理一下逻辑
1. 我们可以将待解析的表达式字符串解析成抽象语法树(`AST`)，再把我们想要得到的结果也去解析成语法树。
2. 对比两个语法树，我们可以找到某些语法节点的不同以及其规律，然后将第一个语法树的某些节点按照一定规律进行增/删/改操作变为和第二个语法树一致的数据结构
3. 将改动过的语法树再重新解析为表达式
4. 这时使用 `eval` 或 `new Function` 将表达式解析出来不就可以了嘛

## recast.js

有了思路，那么我要怎样才能将 JS 代码转换为语法树呢，重复造轮子的事我是不推荐的。因此我发现了 `recast.js`，该 JS 能够完美的实现解析语法树以及再转为 JS 的需求，也完美的遵循了 [Node 标准](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API#Node_objects)，那我们接下来看看，如果使用 `recast.js`，应该怎样去实现本文的需求吧

> 关于 recast.js 的具体用法参考其 [Github 主页](https://github.com/benjamn/recast)

### 分析差异
首先，我们得了解，在 `recast` 中，应该怎么解析 JS 为 AST，`recast` 提供了一个很简单的方法 `parse`，通过该方法，我们可以将 JS 表达式快速地解析为 `AST`
```javascript
// 解析初始的表达式
recast.parse('a + b + c');

// 解析预期结果
recast.parse('context.a + context.b + context.c');
```
当然，以上结果也可以在一些在线 AST 解析网站中更直观的获取（比如[astexplorer.net](https://astexplorer.net/)）  
解析的结果大致如下：
- 原始表达式
    ```json
    {
    "type": "Program",
    "start": 0,
    "end": 9,
    "body": [
        {
        "type": "ExpressionStatement",
        "start": 0,
        "end": 9,
        "expression": {
            "type": "BinaryExpression",
            "start": 0,
            "end": 9,
            "left": {
            "type": "BinaryExpression",
            "start": 0,
            "end": 5,
            "left": {
                "type": "Identifier",
                "start": 0,
                "end": 1,
                "name": "a"
            },
            "operator": "+",
            "right": {
                "type": "Identifier",
                "start": 4,
                "end": 5,
                "name": "b"
            }
            },
            "operator": "+",
            "right": {
            "type": "Identifier",
            "start": 8,
            "end": 9,
            "name": "c"
            }
        }
        }
    ],
    "sourceType": "module"
    }
    ```
- 预期结果表达式
    ```json
    {
    "type": "Program",
    "start": 0,
    "end": 33,
    "body": [
        {
        "type": "ExpressionStatement",
        "start": 0,
        "end": 33,
        "expression": {
            "type": "BinaryExpression",
            "start": 0,
            "end": 33,
            "left": {
            "type": "BinaryExpression",
            "start": 0,
            "end": 21,
            "left": {
                "type": "MemberExpression",
                "start": 0,
                "end": 9,
                "object": {
                "type": "Identifier",
                "start": 0,
                "end": 7,
                "name": "context"
                },
                "property": {
                "type": "Identifier",
                "start": 8,
                "end": 9,
                "name": "a"
                },
                "computed": false,
                "optional": false
            },
            "operator": "+",
            "right": {
                "type": "MemberExpression",
                "start": 12,
                "end": 21,
                "object": {
                "type": "Identifier",
                "start": 12,
                "end": 19,
                "name": "context"
                },
                "property": {
                "type": "Identifier",
                "start": 20,
                "end": 21,
                "name": "b"
                },
                "computed": false,
                "optional": false
            }
            },
            "operator": "+",
            "right": {
            "type": "MemberExpression",
            "start": 24,
            "end": 33,
            "object": {
                "type": "Identifier",
                "start": 24,
                "end": 31,
                "name": "context"
            },
            "property": {
                "type": "Identifier",
                "start": 32,
                "end": 33,
                "name": "c"
            },
            "computed": false,
            "optional": false
            }
        }
        }
    ],
    "sourceType": "module"
    }
    ```

分析以上解析结果，发现我们所有变量(a, b, c)都被解析为 `type: "Identifier"`，其对比第一个和第二个，我们很容易发现，所谓 `context.a` 这种表达式都是嵌套在 `type: "MemberExpression"` 中，顾名思义，`MemberExpression` 应该表示的就是属性访问表达式，内部有两个比较关键的属性 `object`: 表示父级对象，`property` 表示子级属性。

**那就很简单明了，要将第一个语法树转换为第二个，我们只需要将所有被标识为 `type: "Identifier"` 转换为 `type: "MemberExpression"`，将原来的 `Identifier` 对象放在 `property` 属性中，然后在 `object` 属性上加入新的节点标记为 `type: "Identifier"` 并且设置 `name` 为 `context`**

为了实现以上过程，除了 `recast.parse`以外我们应该还需要用到几个方法：
1. 遍历内部指定节点 `recast.visit`
2. 新建 `MemberExpression` 和 `Identifier` 的方法： `recast.types.builders.memberExpression`、`recast.types.builders.identifier`
3. 用于判断节点类型的方法：`recast.types.namedTypes[typeName].check`
4. 将 `AST` 重新转换为 JS 语句的方法：`recast.print`

> 具体方法用法参见官方文档，这里只讲解原理，不做深究

### 代码实现

考虑到 `eval` 和 `new Function` 都能实现解析 JS 表达式，下面代码仅以 `new Function` 作为演示。

```javascript
// 引用 recast
const recast = require('recast');

// 获取相应方法
const {identifier, memberExpression} = recast.types.builders;
const TNT = recast.types.namedTypes;


/**
 * 解析表达式，该表达式可以直接获取到 context 对象内的属性
 * @param expression {string} 表达式字符串
 * @param contextName {string=} 指定 context 的 name
 */
function parseExpression(expression, contextName = 'context') {

    // 因为使用的是 new Function 所以加上 return 一起解析，也可以在最后 return
    const returnPattern = 'return ' + expression;

    // 解析获取到 AST 对象
    const ASTResult = recast.parse(returnPattern);

    const body = ASTResult.program.body[0]; // 默认表达式只有单个语句，只解析第一句的内容

    recast.visit(body, {
        // 遍历所有最外层的 MemberExpression 节点，将所有 MemberExpression 节点下的 object 属性更新为
        visitIdentifier(path) {
            const currentNode = path.node;
            // 获取指定节点的父节点，如果父节点是 MemberExpression 节点，并且当前节点是属于 property 属性则不做替换
            // 如果不判断，则会有将所有属性加上前缀的可能 'a.b.c' => 'context.a.context.b.context.c'
            let parentNode = path.parentPath.node;
            if (!TNT.MemberExpression.check(parentNode) || parentNode.property !== path.node) {

                // 获取到当前节点是属于父节点的哪个属性
                let key = Object.keys(parentNode).find(key => parentNode[key] === currentNode);

                if (key === undefined) {
                    // 如果未获取到 key 值，则可能是该节点所属的属性是父级节点的一个 list 节点
                    // 这种情况需要把父节点转换为 list 节点
                    parentNode = Object.values(parentNode).find(
                        (node) => {
                            if ((node instanceof Array) && node.includes(currentNode)) {
                                // 将 key 覆盖为数组下标
                                key = node.indexOf(currentNode);
                                return true;
                            }
                            return false;
                        }
                    );
                }

                // 替换节点
                // 第一个参数为 object 节点，第二个参数为 property 节点
                parentNode[key] = memberExpression(
                    identifier(contextName), // 默认将 object 节点命名为 context
                    currentNode
                );
            }

            // 继续遍历
            this.traverse(path);
        }
    });

    const resultExpress = recast.print(ASTResult).code;

    console.log(resultExpress);

    return new Function(contextName, resultExpress);
}

module.exports = parseExpression;
```
测试 `parseExpression` 函数
```javascript
const context = {
    a: 1,
    b: 2,
    c: {
        d: 3
    },
    handler(e) {
        return e;
    }
};

const func = parseExpression(
    'handler(c.d) + a + b'
);

console.log(func(context)); // > 6
```
按照表达式 `'handler(c.d) + a + b'` 生成的 `function` 应该是
```javascript
function _(context){
    return context.handler(context.c.context.d) + context.a + context.b
}
```
输出结果是 `6`，完全符合预期，Nice！
除此之外，用该方法去测试更多的表达式，都一一可行，`AST` 真是强大啊

## 总结
1. 很多时候，看似简单的东西，却蕴藏着很多复杂的内容，比如这个表达式的解析。
2. 编程基础知识越是掌握得牢靠，面对一些看似很麻烦的需求往往会有出其不意的解决方案，比如 `AST`。

> 原文转自 [模拟 Vue 中 JS 动态表达式在模版中被动态解析的实现 | 苍石居](https://palerock.cn/articles/001Pj4i8IfB) 未经允许禁止转载