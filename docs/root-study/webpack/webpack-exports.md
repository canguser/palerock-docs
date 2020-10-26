# [Webpack 踩坑] 使用 Webpack 打包 Web 端和 Node 服务端通用的依赖

## 引言

最近准备着手将大学时写的一个框架给规范化，想着将它部署成 NPM 上的一个 Package，但遇到了两个问题：
1. 这个框架完全是由 ES5 语法规范搭建的，也没有考虑模块依赖什么的，它本身依赖的其它库都是纯代码复制到项目文件内容的上方，所以我们应该需要使用模块化来引用其依赖的框架，如 ES5 的 `require`
2. 如果使用了 `require` 语法，那么意味着所有想使用该框架的项目都必须使用 NPM，该框架的单个文件并不能被 WEB 端直接引用。

考虑到以上两点，也许我应该像 JQuery 或其它框架一样将依赖一起打包在一个 JS 文件里，最好还能有个压缩后的 mini JS 文件，那么解决方案就呼之欲出了，对，使用 `Webpack`。

## 配置 Webpack 以及简单使用

由于项目只会使用到 Webpack 最基础最简单的打包功能，其配置也是相当的简单

- 安装: `npm i webpack -D` 和 `npm i webpack-cli -D`
- 在项目根目录新建 `webpack.config.js` 内容简单配置如下：
    ```javascript
    const path = require('path');
    
    module.exports = {
        mode: 'none', // 如果想生成 mini JS 就配置为 production
        entry: './src/xxxx.js', // 配置想要打包的 JS 文件
        output: {
            filename: 'xxxx.js', // 打包后的文件名
            path: path.resolve(__dirname, "build"), // 打包后文件存放的目录
        }
    }
    ```
- 然后在 npm package.json 中配置 script
    ```json
    {
        "scripts": {
            "build": "webpack"
          }
    }
    ```
- 需要打包时直接运行 `npm run build` 就会看到在项目根目录生成 `build` 文件夹，内部有着打包后的 JS 文件

> 注意
> 1 本文所有均基于 webpack@5.2.0 和 webpack-cli@4.1.0
> 2 若要打包 mini JS 可以通过 env 参数指定变量，然后再通过判断该变量的值判断是否设置 mode 为 'production' 实现

## 踩坑

你以为通过上述操作就搞定了？居然这么简单？一次跑通？身为踩坑体制的我发现事情果然没那么简单，在生成了打包文件后，我立刻想着去尝试一下引用  
- 浏览器：OK 没问题
- 通过 `require` 引用，咦，怎么是空对象

这让我不禁对自己框架内的代码产生了怀疑，难道是我 export 语法用错了，我再去检查一遍语法 `module.exports = xxx` 没毛病啊，怎么打包后就不能用了？难道是 webpack 的锅？

抱着这个想法，我去检查了 webpack 生成的代码，不出我所料，果然，webpack 在最外层没有任何的 exports 语句，而我框架里面的 exports 被 webpack 中的一个局部变量 `module` 给覆盖了，难怪没有输出。

好吧，这个肯定有配置的，我查询了 webpack 的文档，发现了 `output.libraryTarget` 这个参数，如果将这个参数指定为 `'commonjs'` 就可以使用 `require` 语句去引入了。

不过问题又来了，这样打包出来的文件如果放在 Web 端通过 `<script>` 标签去引用却不行了，直接就开始报错，OK，我发现这个参数还有个通用的配置值 `'umd'`，如果将 `output.libraryTarget` 设置为该值，就去判断当前的环境，官方给出的输出结果参考是以下代码：
```javascript
(function webpackUniversalModuleDefinition(root, factory) {
  if(typeof exports === 'object' && typeof module === 'object')
    module.exports = factory();
  else if(typeof define === 'function' && define.amd)
    define([], factory);
  else if(typeof exports === 'object')
    exports["MyLibrary"] = factory();
  else
    root["MyLibrary"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
  return _entry_return_; // 此模块返回值，是入口 chunk 返回的值
});
```

但是，但是但是！当我配置了这个值后，服务端还是无法使用，还有个莫名奇妙的保错： `self is not defined.`，瞬间我满头问号，什么情况？

在我打开它输出的文件发现，他的代码结构居然是类似这样的：
```javascript
(function webpackUniversalModuleDefinition(root, factory) {
  if(typeof exports === 'object' && typeof module === 'object')
    module.exports = factory();
  else if(typeof define === 'function' && define.amd)
    define([], factory);
  else if(typeof exports === 'object')
    exports["MyLibrary"] = factory();
  else
    root["MyLibrary"] = factory();
})(self, function() {
  return _entry_return_; // 此模块返回值，是入口 chunk 返回的值
});
```
细心的朋友应该发现了，特喵的官方给的是 `typeof self !== 'undefined' ? self : this` 而我按官方给的配置做下去却只有个 `self`。

WTF???

接下来我挨着挨着查看了他的配置参数，也没发现这个是可以配置，百度也没发现有人遇到和我一样的问题，顿时，我陷入了关于人生的思考。。

突然一道光闪过，我之前看的是中文版本的文档，我安装的是最新版本的 webpack，一般来说，中文文档是慢于英文文档的更新，那是不是文档不是最新的？于是我立刻去到 Webpack 的英文官网查阅相关配置，果然，很多地方和中文文档都有着差异，待我仔细阅读，发现了一个参数 `output.globalObject` 官方的描述很是简单，大概意思就是，默认值为 `self` 当 `output.libraryTarget` 为 `umd` 时如果想在 node 等环境运行时需要设置为 `this`，啊，终于找到解决方案了！！这该死的中文文档。。。

## 总结

在平时开发时，对文档的阅读最好选择官方第一手文档，如果为了方便去看其它文档也一定要注意其对应的版本信息。

> 原文转自 [[Webpack 踩坑] 使用 Webpack 打包 Web 端和 Node 服务端通用的依赖库 | 苍石居](https://palerock.cn/articles/001AuvboZk4) 未经允许禁止转载
