# 在 NodeJS 服务端项目中使用注解  
NodeJS 是使用 Javascript 语言的服务端开发的解决方案。  
当从 Java 通过 Spring 开发转到使用 NodeJS 开发时，总觉得代码不够优雅，虽然 NodeJS 提供了诸如 Express、koa 等非常方便的 web 服务端框架，但是由于 Javascript 没有类似与注解的语法，在开发的过程中虽然比使用 Java 开发轻便多了，但也会情不自禁得去想，要是 Javascript 也能使用注解就好了。  
抱着这个目的，我在网上发现了一个 Javascript 的语法提案 `proposal-decorators`, 在这个提案中，我们可以在 Javascript 中使用 Decorators(装饰器) --- 一个类似 Java 中的注解一类的语法。  
可是提案毕竟是提案，并没有实装，并不能直接使用，不过在后续的查询中，发现 babel 针对该提案提供了一个插件可以将注解语法编译为常规的 Javascript 代码，该插件链接如下 [babel-plugin-proposal-decorators](https://babeljs.io/docs/en/babel-plugin-proposal-decorators)  
在参考 babel 的文档下，我迅速做了一个 Demo，发现在 Javascript 中使用注解的方式也是相当灵活，所以决定基于该提案写一个基础框架，用于快速使用注解，其用法参考了 Java 中的注解实现方式，不过也有很大不同：
## [Annotate JS](https://palerock.cn/projects/006T5t9zyHi)  
该框架提供了许多自带的注解，如 `@Bean` `@Autowired` 可以像在 Java 中使用 Spring 框架一样依赖注入或者面向切面编程，比如：
```javascript
import {Bean, Boot, Autowired} from '@palerock/annotate-js'; 

/**
 * 声明一个组件名为 Demo
 */
@Bean
class Demo{
    sayHello(){
        console.log('hello annotate-js.');
    }
}

@Boot
class Init{

    @Autowired
    Demo; // 自动注入

    // 代码入口
    main(){
        this.Demo.sayHello(); // output `hello annotate-js.`
    }
}
```
除了自带注解，也可以通过该框架开发一些自定义的注解，详情可以查看其[文档](https://palerock.cn/projects/006T5t9zyHi#annotatejs)
## [Express Annotate JS](https://palerock.cn/projects/0061skWPll8) 
该框架是在以上框架的基础上对 Express 框架进行了一层封装，将一些简单逻辑封装到了注解当中，使用该注解就可以像使用 Spring 中的 Controller 一样定义 URL Mapping 以及获取参数注入，参考 Demo 如下：
```javascript
import {launcher, GetMapping, Register} from "@palerock/express-annotate-js";
import {Boot, Autowired, Bean} from "@palerock/annotate-js"; 

@Register // 将该 class 注册为 web 服务
class DemoController {

    @Autowired
    DemoService; // 自动注入 Service

    @GetMapping({url: '/'})
    getContent({content}) {
        // 通过参数注入获取请求参数
        return `Hello Express Annotate JS, ${this.DemoService.parseContent(content)}`;
    }

}

@Bean
class DemoService {
    parseContent(content) {
        return `Parsed content: ${content}`;
    }
}

@Boot
class Application {

    port = 3034;

    main() {
        // 启动服务
        launcher.start(this.port);
    }

}
```
## 说在最后
可以看出，注解的使用可以让我们的代码变得简洁而优雅，使用注解也可以让我们的工作从繁入简。  
不过，以上框架都处于开启阶段，使用的人很少，生态也不完善，需要时间的见证和更多人的使用让其变得越来越完善。

> 原文转自 [在 NodeJS 服务端项目中使用注解 | 苍石居](https://palerock.cn/articles/001r3Rn4LJH) 未经允许禁止转载