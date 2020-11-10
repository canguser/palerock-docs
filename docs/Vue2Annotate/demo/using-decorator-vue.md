# 在 Vue 中使用注解（装饰器）
## Javascript 中的注解（装饰器）
谈及注解/装饰器，使用过 Java 或 Python 的同学一定会想到一种语法：`@Annotate` 或 `@Decorator`，虽然叫法不同，但本质上都是实现同样的功能，面向切面编程，使你所写的代码变得干净清爽，将一些复杂的逻辑隐藏在注解（装饰器）中。  
但是，在 Javascript 的标准语法中，并没有类似的写法，如果想要实现类似的语法，那该怎么办呢？  
由于 Javascript 也是一直在进步中，语法越来越丰富，不断有新的语法提案被提出，其中也就包括了 [proposal-decorators](https://github.com/wycats/javascript-decorators/blob/master/README.md) 这个提案，其主要提供了一系列在 Javascript 中使用装饰器的语法及定义。  
那么要怎样才能使用这个语法呢？由于其本身只是一个提案，其语法并不能直接使用，不过 Babel 提供了其语法支持：[`@babel/plugin-proposal-decorators`](https://babeljs.io/docs/en/babel-plugin-proposal-decorators)
## 与 Vue 一起使用
既然能够在 Javascript 中使用注解，那么能不能在 Vue 项目中使用该语法呢，[`Vue2 Annotate`](https://palerock.cn/projects/006XvyfPS9e) 便解决了该问题，通过引用该框架，便可以将 Vue 项目重构为使用注解（装饰器）的项目。
> 为了简单演示，所以演示代码基于 `vue-cli v4.5.0` 构建的初始化项目
### 第一步：配置环境
首先使用 `npm` 安装 `Vue2 Annotate`
```shell script
npm install @palerock/vue2-annotate -s
```
或使用 `yarn` 添加依赖
```shell script
yarn add @palerock/vue2-annotate
```
因为要使用注解语法，我们需要在 Babel 环境中引入相关语法依赖：  
npm:
```shell script
npm install @babel/plugin-proposal-decorators
npm install @babel/plugin-proposal-class-properties
```
yarn:
```shell script
yarn add @babel/plugin-proposal-decorators
yarn add @babel/plugin-proposal-class-properties
```
> `@babel/plugin-proposal-decorators` 是支持注解语法的插件，`@babel/plugin-proposal-class-properties` 是支持将 class 语法转化为 es5 的语法插件，因为 Vue CLI 项目本身就有 Babel 7 的依赖，所以只需要引入这两个关键插件

安装依赖完成后，配置根目录下 `babel.config.js` 文件内容如下:  
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
### 第二步：使用注解（装饰器）
首先，我们需要知道 [`Vue2 Annotate`](https://palerock.cn/projects/006XvyfPS9e) 为我们提供了哪些注解，通过[文档](https://palerock.cn/projects/006XvyfPS9e#%E9%A2%84%E7%BD%AE%E6%B3%A8%E8%A7%A3)，我们可以知道其核心注解为 `@VueComponent`，正常情况下，在一个 Vue 项目中，一般通过以下代码声明一个组件：
```javascript
export default {
    name: 'HelloWorld'
}
```
如果我们使用 `Vue2 Annotate`， 那么将变为：
```javascript
export default
@VueComponent
class HelloWorld {}
```
可以看出，原来是申明为一个对象，在使用注解后，声明的内容是一个 `class`  
那么如果要定义一些属性或方法呢，在使用 `Vue2 Annotate` 的情况下我们可以通过直接声明成员变量来定义：
```javascript
export default
@VueComponent
class HelloWorld {
    
    message = 'hello annotate';
    
    alertMessage(){
        alert(this.message);
    }

}
```
至此，感受到不一样了么，在没有使用注解的情况下，应该是如下所示：
```javascript
export default {
    name: 'HelloWorld',
    data(){
        return {
            message: 'hello annotate'
        }
    },
    methods: {
        alertMessage(){
            alert(this.message);
        }
    }
}
```
由于注解是基于 `class`，你甚至可以在内部直接定义 getter 或 setter：
```javascript
export default
@VueComponent
class HelloWorld {
    
    message = 'hello annotate';
    
    // 获取 message 内容以空格分割的最后一部分
    get lastPartOfMessage(){
        const parts = this.message.split(' ');
        return parts[parts.length - 1];
    } 
    
    // 将 message 中以空格分割的最后一部分改为指定内容
    set lastPartOfMessage(value){
        const parts = this.message.split(' ');
        parts[parts.length - 1] = value;
        this.message = parts.join(' ');
    }

    // 通过该方法改变 message 的值
    displayAndChangeMessage(){
        console.log(this.lastPartOfMessage); // 'annotate'
        this.lastPartOfMessage = 'vue2-annotate'; // 改变最后一部分的内容
        console.log(this.lastPartOfMessage); // 'vue2-annotate'
        console.log(this.message); // 'hello vue2-annotate'
    }

}
```
是不是相当简单直观，其效果和在不使用注解时使用 computed 完全一致，但如果不想使用 getter / setter 方法呢，我们可以通过引入 @Computed 注解实现和 Vue 中配置 computed 完全一致的效果，比如将以上代码转化为使用 @Computed 
```javascript
export default
@VueComponent
class HelloWorld {
    
    message = 'hello annotate';
    
    @Computed
    lastPartOfMessage = {
        // 获取 message 内容以空格分割的最后一部分
        get(){
            const parts = this.message.split(' ');
            return parts[parts.length - 1];
        }, 
        // 将 message 中以空格分割的最后一部分改为指定内容
        set(value){
            const parts = this.message.split(' ');
            parts[parts.length - 1] = value;
            this.message = parts.join(' ');
        }
    };

    // 通过该方法改变 message 的值
    displayAndChangeMessage(){
        console.log(this.lastPartOfMessage); // 'annotate'
        this.lastPartOfMessage = 'vue2-annotate'; // 改变最后一部分的内容
        console.log(this.lastPartOfMessage); // 'vue2-annotate'
        console.log(this.message); // 'hello vue2-annotate'
    }

}
```
其效果和以下配置效果完全一致：
```javascript
export default {
    name: 'HelloWorld',
    data(){
        return {
            message: 'hello annotate'
        }
    },
    computed: {
        // 获取 message 内容以空格分割的最后一部分
        get(){
            const parts = this.message.split(' ');
            return parts[parts.length - 1];
        }, 
        // 将 message 中以空格分割的最后一部分改为指定内容
        set(value){
            const parts = this.message.split(' ');
            parts[parts.length - 1] = value;
            this.message = parts.join(' ');
        }
    },
    methods: {
        // 通过该方法改变 message 的值
        displayAndChangeMessage(){
            console.log(this.lastPartOfMessage); // 'annotate'
            this.lastPartOfMessage = 'vue2-annotate'; // 改变最后一部分的内容
            console.log(this.lastPartOfMessage); // 'vue2-annotate'
            console.log(this.message); // 'hello vue2-annotate'
        }
    }
}
```
那么定义需要暴露出去的参数 —— `props` 呢，在使用注解的情况下，我们除了 @VueComponent 还需要引入一个注解 `@Props`
```javascript
export default
@VueComponent
class HelloWorld {
    @Props
    msg = String;
}
```
十分简单，其效果和以下代码一致：
```javascript
export default {
    name: 'HelloWorld',
    props: {
        msg: String
    }
}
```
类似的注解还有 `@Watch` 用于监听属性改变：
```javascript
export default
@VueComponent
class A {

    // $$ 表示前缀，用于避免与监听属性冲突    

    @Watch
    $$gender(val, oldVal) {
    }
    
    @Watch({deep: true, immediate: true})
    $$age(val, oldVal) {
    }

    @Watch('name')
    handleNameChanged = 'handleAgeChanged';

    @Watch({property: 'name', deep: true})
    handleNameChanged2(val, oldVal) {
    }
    
}
```
相当于：
```javascript
export default {
   name: 'A',
   watch: {
       age: {
           handler(val, oldVal) {
           },
           deep: true, immediate: true
       },
       gender(val, oldVal) {
       },
       name: [
           'handleAgeChanged',
           {
               handler(val, oldVal) {
               }
           }
       ]
   }
}
```
通过使用注解，可以简化很多烦杂的操作，比如 `@Model` 注解，顾名思义，这个注解适用于支持 Vue 中的 v-model 指令，例子如下：
```javascript
export default
@VueComponent
class CustomInput {
    @Model('value') // prop 属性为 value, 被装饰属性名为 content
    content = String;
}
```
以上代码申明了一个类型为 String，名为 value 的参数，并将其设为 model，与通常 Vue 项目中以下代码效果完全一致：
```javascript
export default {
   name: 'CustomInput',
   props: {
       value: String
   },
   model: {
       prop: 'value',
       event: 'change'
   },
   computed: {
       content: {
           get() {
               return this.value;
           },
           set(value) {
               this.$emit('change', value);
           }
       }
   }
}
```
除了以上注解，作者表示还有更多的注解正在开发中，如 `@Provide`, `@Inject` 等，但如果现在就想要使用这些功能呢，该插件提供了一个将 Vue 原配置转化为可以在 class 中使用的注解：`@NativeApi`，示例如下：
```javascript
@VueComponent
class HelloWorld{

    @NativeApi
    components = {};

    @NativeApi
    provide(){
        return {
            message: 'message'
        };
    }

    @NativeApi
    inject = ['parentProvide'];

    @NativeApi
    data(){
        return {
            message: 'hello annotate'
        }
    }

    @NativeApi
    computed = {
        test(){
            return '';
        }
    };

    @NativeApi
    created(){
        // 生命周期函数
    }

    // ...等等
}
```
等同于：
```javascript
export default{
    name: 'HelloWorld',
    components : {},
    provide(){
        return {
            message: 'message'
        };
    },
    inject: ['parentProvide'],
    data(){
        return {
            message: 'hello annotate'
        }
    },
    computed: {
        test(){
            return '';
        }
    },
    created(){
        // 生命周期函数
    }
}
```
## 总结
注解（装饰器）语法可以使项目变得简单明了，在 Java 的开发中，相信有不少小伙伴对注解的魅力有着不浅的认识吧，而在 Javascript 的 Vue 项目中，使用注解（装饰器）语法也是相当简洁优雅的，其缺点也是明显，由于语法处于提案状态，使用它需要 Babel 进行额外的编译工作，配置额外的环境，不过现在就算是 TypeScript 也需要编译才能运行，无伤大雅。

> 原文转自 [在 Vue 中使用注解（装饰器） | 苍石居](https://palerock.cn/articles/001JPDEjZ87) 未经允许禁止转载