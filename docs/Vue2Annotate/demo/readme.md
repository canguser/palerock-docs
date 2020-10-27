# 通过 Annotate JS 生成自定义注解(面向切面编程)
为了快速生成自定义注解，我们需要用到 [Annotate JS 框架](https://palerock.cn/projects/006T5t9zyHi) 提供的几个注解:
- `@Surround` 用于自定义面向切面的动作
- `@Annoate` 用于继承其它注解并且自定义参数
- `@DefaultParam` 配合 `@Annoate` 用于指定默认参数
- `@DynamicParam` 配合 `@Annoate` 用于指定动态参数

关于以上注解的基本用法可以参考其 [API文档](https://palerock.cn/projects/006T5t9zyHi#surround)。  
> 由于本框架完全依赖于 `Annotate JS 框架`，为了方便开发，以上注解在 `^1.0.18` 版本以后可以直接由该框架引入：  
`import {Annotate, Surround, DefaultParam, DynamicParam} from "@palerock/vue2-annotate";`

了解了以上注解的基本用法后，我们以几个简单的例子来实现自定义注解