# 在 `Javascript` 中安全地执行动态脚本

动态脚本，在每种编程语言都有涉及，比如微软的 `Office` 里面的 `VBA` 脚本，比如浏览器插件的 `Tampermonky`，比如很多在线工具类网站的脚本在线执行，甚至在国外很火的 `SaaS` 以及其衍生平台中的开发者功能都是可以通过动态脚本来实现的。

而动态脚本也大体分为两种，一是在用户客户端里执行的代码，比如 `Tampermonkey` ，它可以让用户使用各种自定义的代码来完成特定的功能，而这些动态脚本都有一个局部性就是只在指定客户端生效。

而第二种就是运行在服务端的动态脚本。由于客户端的脚本功能有限，很多强大的功能，比如操作文件，访问数据库都是没法访问的，为了解决这种问题，很多 `SaaS` 或其它平台为用户提供了自定义开发的功能，而实现自定义开发，最快捷的就是运行用户自己的动态脚本，让用户可以操作文件，甚至部署一个服务端的服务。

但是，动态脚本虽然好，如果执行了一些恶意脚本，无论是对客户端还是服务端来说都是一场噩梦，轻则数据泄露，重则整个应用服务都会被影响导致崩溃。

## 那么，在 `Javascript` 中，怎样才能去动态并且安全地执行脚本呢？

### `eval` 和 `new Function`

这二者在 `Javascript` 中是无论客户端还是服务端都可以使用的函数，可以用他们去动态解析并执行动态脚本，但是由于用他们执行的代码拥有着和应用中其它正常代码一样的的权限，能访问「执行上下文」中的局部变量，也能访问所有「全局变量」，在服务端的环境下，使用它们其实是非常危险的。

以 `eval` 为例，在服务器环境下执行以下代码
```javascript
eval('process.exit()')
```
对于服务器环境而言，`process` 是一个全局变量，上诉代码会让整个应用直接退出，简单点说，一旦运行了以上脚本，我们的 NodeJS 服务就挂了。

当然，如果将 `eval` 和 `ES6` 中的 `Proxy` 结合使用，可以限制一些上下文或者全局变量的访问，比如以下代码
```javascript
function evalute(code,sandbox) {
  sandbox = sandbox || Object.create(null);
  const fn = new Function('sandbox', `with(sandbox){return (${code})}`);
  const proxy = new Proxy(sandbox, {
    has(target, key) {
      // 让动态执行的代码认为属性已存在
      return true; 
    }
  });
  return fn(proxy);
}
evalute('1+2') // 3
evalute('console.log(1)') // Cannot read property 'log' of undefined
```
这段代码会通过 `Proxy` 去阻止脚本获取上下文的变量，从而让动态脚本变得更安全了一些，不过由于使用到了 `with` 关键字，其性能也相对较差。

### `NodeJS` 中的其它选择？

如果只讨论服务端也就是 `NodeJS`，其自带的模块中有一个名为 `VM` 的模块，`VM` 模块提供了一系列 API 用于在 V8 虚拟机环境中编译和运行代码。`Javascript` 代码可以被编译并立即运行，或编译、保存然后再运行。以下是官方提供的例子：
```javascript
const vm = require('vm');

const x = 1;

const context = { x: 2 };
vm.createContext(context); // Contextify the object.

const code = 'x += 40; var y = 17;';
// `x` and `y` are global variables in the context.
// Initially, x has the value 2 because that is the value of context.x.
vm.runInContext(code, context);

console.log(context.x); // 42
console.log(context.y); // 17

console.log(x); // 1; y is not defined.
```
从上述代码中可以看到，`VM` 模块可以很方便地执行一块动态脚本，并且还可以为其指定上下文并获取到执行后上下文变量的变化。

除此之外，`VM` 还可以指定一个参数 `timeout`, 如果执行超时会抛出一个异常，如下：
```javascript
try {
  const script = new vm.Script('while(true){}',{ timeout: 50 });
  script.runInContext({});
  // ....
} catch (err){
  //打印超时的 log
  console.log(err.message);
}
```
`while(true){}` 将在 50ms 之后报错并捕获到异常，打印出来。但需要注意的是这里的 `timeout` 只会对于同步的代码生效，如果使用异步代码如下：
```javascript
const script = new vm.Script('setTimeout(()=>{},2000)',{ timeout: 50 });
```
那么 50ms 的限制将如同摆设。

另外，`VM` 模块中的 `runInContext` 看起来可隔离上下文，实际上很容易通过一些特殊的写法获取到上下文的变量，比如：
```javascript
const vm = require('vm');
vm.runInNewContext('this.constructor.constructor("return process")().exit()');
console.log('Never gets executed.');
```
通过运行以上代码，我们会发现，我们 log 的内容并没有出现，脚本片段中的 `this.constructor.constructor("return process")().exit()` 获取到了 `process` 对象，像我之前说的那样，直接将整个应用结束了。

就像 `NodeJS` 官网文档中说的那样：`The vm module is not a security mechanism. Do not use it to run untrusted code.`
由于 `Javascript` 本身过于动态，官方并不推荐我们通过 `VM` 模块去运行不受信任的代码。

### 那我们就没办法在 `Javascript` 中运行不受信任的代码了？
实际上并不是，在开源社区中我们可以看到，有很多开源的模块都可以用于运行不受信任的代码，比如 `vm2`, `sandbox`, `jailed` 等。

而其中安全性较高并且功能更多的要数 `vm2`

`vm2` 的官方文档上有提到，其基于 `VM` 模块，并且通过 `Proxy` 以及其它方法从多角度来防止对上下文变量的访问，同样用 `vm2` 来运行以下代码：

```javascript
const {VM} = require('vm2');
new VM().run('this.constructor.constructor("return process")().exit()');
// Throws ReferenceError: process is not defined
```

可以看到会抛出错误： `process is not defined`

在功能性上，`vm2` 还内置一个 `NodeVM` 的模块，通过这个模块我们甚至可以在脚本中引入外部的依赖，并且可以限制哪些依赖是可以引入的，哪些是不可以引入的，如以下例子：
```javascript
const {NodeVM} = require('vm2');
const vm = new NodeVM({
    require: {
        external: true
    }
});

vm.run(`
    var request = require('request');
    request('http://www.google.com', function (error, response, body) {
        console.error(error);
        if (!error && response.statusCode == 200) {
            console.log(body) // Show the HTML for the Google homepage.
        }
    })
`, 'vm.js');
```
但是，我们还是可以在 `vm2` 中写一些恶意代码
1. 由于 `vm2` 中的 `NodeVM` 不支持 `timeout` 属性，`while(true){}` 会阻塞整个应用
2. 即便在 `vm2` 中的 `VM` 模块可以指定 `timeout`，和 `NodeJS` 原生 `VM` 一样，由于 `timeout` 不能对异步代码生效，一旦运行异步代码，`timeout` 便失效了

*那怎么解决这个问题呢？*

很多人看到这应该都能想到，可以通过线程去运行代码，然后如果超时便结束线程。是的，有了思路，发现 github 上有一个库叫做 `safeify` 正是通过这种思路来对 `vm2` 加了一层封装，其核心思路大致如下：

1. 通过沙箱在自线程中运行脚本
2. 通过进程池统一调度管理沙箱进程
3. 处理的数据和结果返回给主线程
4. 针对沙箱进程进行 CPU 、内存以及超时的限制

> 其中限制 CPU 和内存是通过 `Linux` 上的 `CGoups` 实现的

然而通过使用这个库，我又发现了很多问题

1. 其封装的是 `vm2` 中的 `VM` 模块而不是 `NodeVM` 模块，像在脚本中引入其它依赖是没法实现了
2. 由于线程通信的限制，该模块将指定 `context` 中的方法的运行还是放在主线程中运行，没有完全的异步交给子线程
   ```javascript
   const safeVm = new Safeify({
    timeout: 50,          //超时时间，默认 50ms
    asyncTimeout: 1000,    //包含异步操作的超时时间，默认 500ms
    quantity: 2,          //沙箱进程数量，默认同 CPU 核数
    memoryQuota: 100,     //沙箱最大能使用的内存（单位 m），默认 500m
    cpuQuota: 0.1,        //沙箱的 cpu 资源配额（百分比），默认 50%
    });

    const context = {
        a: 1,
        b: 1,
        add(a, b) {
            while (true){
                // console.log(b)
            }

            return a + b;
        }
    };

    (async function f() {

        setTimeout(()=>{
            console.log('????')
        }, 2000)

        const rs = await Promise.all(
            [
                safeVm.run(`return add(a,1)`, context),
            ]
        )
        console.log('result', rs);

        // 释放资源
        safeVm.destroy();

    })();
   ```
   像这样的逻辑会一直卡住主线程，`timeout` 也会失效
3. 会在初始化时就实例化出配置的子线程，如果是4，就会实例化4条，对资源占用很不友好，并且需要手动调用 `safeify.destory()` 方法去销毁子线程，由于执行脚本是异步的，对销毁时机需要很好的把握，一不小心就把还没执行完的子线程销毁掉了

研究了一下其代码以及其逻辑，感觉并不复杂，于是绝对重写一个库，以解决以上问题

### VM Guard for NodeJS

> `vm-guard` 是一个可以解决我文中所诉的所有痛点的库，其基于 `vm2` 中的 `NodeVM`，是一个用于 NodeJS 的沙箱运行环境
> 
> 开源地址/文档：[https://github.com/canguser/vm-guard]

#### 相对与 `vm2` 中的 `NodeVM` 解决的问题
1. 多线程增加运行沙箱代码的运行速率
2. 新增 `timeout` (超时)可遏制在 `NodeJS` 环境下 `VM2` 所不能解决的恶意代码，如：
    ```javascript
    while (true) {}
    ```

#### 相对与 `safeify` 解决的问题：
1. 使用 `NodeVM` 模块，可以支持更丰富的脚本自定义功能，并且和 `vm2` 中的 `NodeVM` 模块的配置属性完全兼容
2. 在 `vm-guard` 中，我们不需要在传给脚本的 `context` 里声明方法（也不能，也没必要），通过 `NodeVM` 模块我们可以指定依赖，并且依赖也是会运行在子线程中的
3. 动态的线程管理，在 `vm-guard` 中，会动态的管理子线程，在没运行脚本时，不会开启任何子线程，如果需要运行脚本，会开启不大于设置数量的子线程来分别运行脚本，同时运行多个脚本时，未运行的脚本会在队列中等待空闲线程，一旦所有脚本运行完毕，便会自动清理线程


## 参考项目
- [`VM`: https://nodejs.org/api/vm.html](https://nodejs.org/api/vm.html)
- [`vm2`: https://github.com/patriksimek/vm2](https://github.com/patriksimek/vm2)
- [`safeify`: https://github.com/Houfeng/safeify](https://github.com/Houfeng/safeify)

## 参考文章
- [`Safeify`: https://github.com/Houfeng/safeify/blob/master/DOC.md](https://github.com/Houfeng/safeify/blob/master/DOC.md)

> 原文转自 [在 `Javascript` 中安全地执行动态脚本 | 苍石居](https://palerock.cn/articles/001NqKR09L3) 未经允许禁止转载