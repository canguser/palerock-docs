# 预置注解
## @VueComponent
该注解作用于 class，例子如 [Demo](#demo) 所示，其内部未加注解的成员属性含义如下：
- getter 方法: 同 @Computed get
- setter 方法: 同 @Computed set (使用 setter 必须指定该属性的 getter)
- 普通方法: 相当用未使用注解中的 methods
    ```javascript
    @VueComponent
    class A{
        func(){
            console.log('my func');
        }   
    }
    // 等同于
    ({ 
        name: 'A',
        methods: {
            func(){
                console.log('my func');
            }   
        }
    })
    ```
- 其它成员变量: 相当于未使用注解中的 data 返回值
    ```javascript
    @VueComponent
    class A{
        name = 'Join';
        age = 20
    }
    // 等同于
    ({ 
        name: 'A',
        data(){
            return {
                name: 'Join';
                age: 20
            }
        }
    })
    ```

参数(对象形式)：  
- `name`: `默认参数` component 的 name 值，默认为 class 名
    ```javascript
    // name = 'A'
    @VueComponent
    class A{}
  
    // name = 'A1'
    @VueComponent('A1')
    class B{}  
  
    // name = 'A2'
    @VueComponent({name: 'A2'})
    class C{}  
    ```

## @Props
必须作用于 `@VueComponent` 装饰的 class，表示该 component 暴露出的参数。
```javascript
@VueComponent
class A{
    @Props
    name = String;
    @Props
    age = Number;
}
```
等同于未使用注解时：
```javascript
({
    name: 'A',
    props: {
        name: String,
        age: Number
    }
})
```

## @Model
必须作用于 `@VueComponent` 装饰的 class，表示使用 Vue Model 属性  
被该注解装饰后的属性同样视为 `props`，并且写入 model 属性。  
参数：  
- `name`: `string`  `默认属性` 默认值：被装饰的属性名
	- 表示监听的 `prop` 名
	- 如果该属性与被装饰的属性名不一致，则将被装饰的属性名视为`计算属性`, 详情如下面第二个例子
- `changeEvent`: `string` 默认值：`change`

例1:
```javascript
@VueComponent
class A {

    @Model
    value = String;

}
```
等同于：
```javascript
({
    name: 'A',
    props: {
        value: String
    },
    model:{
        prop: 'value',
        event: 'change'
    }
});
```
例2:
```javascript
@VueComponent
class B {

    @Model('value') // name 属性为 value, 被装饰属性名为 content
    content = String;

}
```
等同于：
```javascript
({
    name: 'B',
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
});
```

## @Computed
必须作用于 `@VueComponent` 装饰的 class，表示计算属性。
```javascript
@VueComponent
class A{
    
    number = 1;
    
    @Computed
    numberPlus(){
        return this.number + 1;
    }
    
}
```
等同于未使用注解时：
```javascript
({
    name: 'A',
    data(){
        return {
            number: 1
        }   
    },
    computed: {
        numberPlus(){
            return this.number + 1;
        }
    }
})
```
## @Watch
必须作用于 `@VueComponent` 装饰的 class，用于监听属性的改变  
参数：  
- `property`： `默认参数` `string` 需要监听的属性名，若未设置该参数，会获取被装饰的属性名作为其值。
	- 注意：在未设置该参数的情况下**为了避免属性名冲突，可以在属性名前加上 `$$` 也可以被正常解析**
- `deep`：`boolean` 默认值：`false` 监听时是否遍历子对象
- `immediate`：`boolean` 默认值：`false` 是否在侦听开始之后被立即调用

```javascript
@VueComponent
class A {

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
({
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
});
```

## @NativeApi
必须作用于 `@VueComponent` 装饰的 class，表示使用 Vue 原生属性
```javascript
@VueComponent
class A{
    
    @NativeApi
    data(){
        // 声明变量
        return {
            name: 'Join'
        }
    }

    // 声明计算属性
    @NativeApi
    computed = {
        appendName(){
            return this.name + 'append';
        }
    };
    
    @NativeApi
    created(){
        // 使用生命周期
        console.log('created');
    }
    
}
```
以上不是 `@NativeApi` 的所有用法，该注解适用于兼容 Vue 的更多功能。