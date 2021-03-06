# Vue2 Annotate [![gitee.png](https://palerock.cn/api-provider/files/view?identity=L2FydGljbGUvaW1hZ2UvMjAyMDA2MjkxNTQyMTMwNzVXcWZyU2dTbC5wbmc=&w=15)](https://gitee.com/HGJing/vue2-annotate) [![github.png](https://palerock.cn/api-provider/files/view?identity=L2FydGljbGUvaW1hZ2UvMjAyMDA2MjkxNjU3NDkzMDkybWNLRXhHMi5wbmc=&w=15)](https://github.com/canguser/vue2-annotate)
`Vue2 Annotate` 是一个基于注解提案 `proposal-decorators` 的注解框架，核心为了能在 `Vue` 项目中使用注解从而简化、美观化 `Vue` 项目结构，基于注解框架 [`Annotate JS`](https://github.com/canguser/annotate-js)。

-----

## 特性
1. 使得 Vue 能够支持 Class 语法开发
2. 通过预置注解快速实现相应配置
3. 更加接近原生的开发方式
4. 简单明了的代码结构

## 快速开始
> 为了简单演示，所以演示代码基于 `vue-cli v4.5.0`
### 环境配置
首先安装 `Vue2 Annotate`
```shell script
npm install @palerock/vue2-annotate -s
```
或
```shell script
yarn add @palerock/vue2-annotate
```

因为要使用注解语法，我们需要在 Babel 环境中引入相关依赖：
```shell script
npm install @babel/plugin-proposal-decorators
npm install @babel/plugin-proposal-class-properties
```
或
```shell script
yarn add @babel/plugin-proposal-decorators
yarn add @babel/plugin-proposal-class-properties
```

安装完成后，配置根目录下 `babel.config.js` 文件内容如下:
```javascript
module.exports = {
    presets: [
        '@vue/cli-plugin-babel/preset'
    ],
    "plugins": [
        [
            "@babel/plugin-proposal-decorators",
            {
                "legacy": true
            }
        ],
        [
            "@babel/plugin-proposal-class-properties",
            {
                "loose": true
            }
        ]
    ]
};
```

至此，环境配置完成。
### Demo
我们修改 vue-cli 自带的 HelloWord 组件，将其转化为一个使用 vue2-annotate 构建的组件。  
首先我们修改 `<script>` 标签中的内容如下：
```javascript
// 引入注解
import {VueComponent, Props, Computed, NativeApi} from "@palerock/vue2-annotate";

export default 
// 使用 @VueComponent 使用一个名为 HelloWorld 的组件
@VueComponent
class HelloWorld {

    // 申明属性 suffix 
    suffix = 'For Vue2 Annotate';

    // 声明参数 msg
    @Props
    msg = String;

    // 声明计算属性 message
    @Computed
    appendMessage() {
        return this.msg + ' ' + this.suffix
    }

    // 计算属性的第二种写法
    get message() {
        return this.msg;
    }

    // 声明方法
    handleClick(e) {
        console.log(e);
        alert(this.appendMessage);
    }

    // 使用 @NativeApi 声明钩子函数
    @NativeApi
    created() {
        console.log('created');
    }
}
```
紧接着修改 `<template>` 标签内容如下：
```html
<div class="hello">
    <h1>{{ appendMessage }}</h1>
    <h2 @click="handleClick">{{ message }}</h2>
</div>
```
运行项目：
```shell script
yarn run serve
```
进入页面，输出内容如下图：  
![image.png](https://palerock.cn/api-provider/files/view?identity=L2FydGljbGUvaW1hZ2UvMjAyMDA5MjUxMTUyMjY4NjM0Y1FUZFNUTy5wbmc=)  
点击副标题，弹出内容如下图：  
![image.png](https://palerock.cn/api-provider/files/view?identity=L2FydGljbGUvaW1hZ2UvMjAyMDA5MjUxMTUzMjk2MzFlUkRQRzNIVi5wbmc=)  
### 类比
在 Demo 中我们在 Vue 中使用 class 语法并且使用注解完成了一个简单的 HelloWorld 组件，若是不使用注解其等同代码结构应该如下：
```javascript
export default {
    name: 'HelloWorld',
    props: {
        msg: String
    },
    data(){
        return {
            suffix: 'For Vue2 Annotate'
        };
    },
    methods: {
        handleClick(e) {
            console.log(e);
            alert(this.appendMessage);
        }
    },
    computed: {
        appendMessage() {
                return this.msg + ' ' + this.suffix
        },
        message() {
                return this.msg;
        }
    },
    created(){
        console.log('created');
    }
}
```
相比而言，使用注解的代码结构更加清晰明了，更加简单，并且在后续的开发中，还会有各种新的注解简化开发流程。
## 相关地址
- Github: [https://github.com/canguser/vue2-annotate](https://github.com/canguser/vue2-annotate)
- Gitee: [https://gitee.com/HGJing/vue2-annotate](https://gitee.com/HGJing/vue2-annotate)
- 项目主页: [https://palerock.cn/projects/006XvyfPS9e](https://palerock.cn/projects/006XvyfPS9e)
- 演示项目: [https://github.com/canguser/vue2-annotate-demo](https://github.com/canguser/vue2-annotate-demo)

## 最后疑问或建议请评论或留言