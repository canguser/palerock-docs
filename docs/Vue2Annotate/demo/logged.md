# @TimeLogger 的实现
在日常开发中，如果涉及到性能优化，我们总是需要通过在方法前后添加 `console.time/console.timeEnd` 类似代码以实现分析其运行时间长短，而这样的代码一是看起来相当不美观，二是会使代码结构看起来十分混乱。那我们可不可以使用一个注解来完成以上工序而完全不需要修改方法内的内容呢？完全可以。  
## 使用 @Annotate 定义 TimeLogger 的 before 和 after 切面方法
首先，我们定义一个 class 命名为 `TimeLogger`，并且为其加上注解 `@Annotate({extends: Surround})`，如下所示：
```javascript
export default
@Annotate({extends: Surround})
class TimeLogger {
	// 在此定义参数
}
```
紧接着，我们定义 Surround 注解中的参数 `before` 和 `after`，让其能够分别运行 `console.time` 和 `console.timeEnd`，如下所示：
```javascript
export default
@Annotate({extends: Surround})
class TimeLogger {
    
    before() {
        console.time();
    }

    after({lastValue}) {
        console.timeEnd();
		// 需要将实际返回值返回出去，避免改变原方法返回值
        return lastValue;
    }
}
```
## 设置 logApi 
除此之外我们应该给每个方法中的每对 `time/timeEnd` 设定一个 label 使其能改匹配，不妨新增一个参数 logApi，并设置其为默认参数，这样我们就可以在使用注解时直接传参让其赋值：
```javascript
export default
@Annotate({extends: Surround})
class TimeLogger {

    @DefaultParam
    logApi;

    before({annotate}) {
        // 通过 annotate 获取该注解上的其它参数值
        const {logApi} = annotate.params;
        console.time(logApi);
    }

    after({lastValue, annotate}) {
        const {logApi} = annotate.params;
        console.timeEnd(logApi);
        // 需要将实际返回值返回出去，避免改变原方法返回值
        return lastValue;
    }
}
```
设置好后我们回到一个 `Vue Component` 中，为指定方法加上该注解：
```javascript
export default
@VueComponent
class CustomAnnotateTest {

    @TimeLogger('testing')
    testing(){
        console.log('do testing');
    }

}
```
运行后结果如下：
```
do testing
testing: 2.06591796875ms
```
## 让 logApi 随属性名动态改变
效果是达到了，但每次使用注解都要输入一个 logApi 感觉也不怎么优雅，要是能够自动获取方法名作为 logApi 就好了，要实现这个需求，我们需要引入 `@DynamicParam` 注解，通过该注解就可以在未设置参数的情况下动态的生成参数值，于是我们修改代码如下：
```javascript
export default
@Annotate({extends: Surround})
class TimeLogger {

    @DynamicParam
    @DefaultParam
    logApi({propertyEntity}){
        // 设置其默认属性为属性名
        return propertyEntity.name;
    }

    before({annotate}) {
        // 通过 annotate 获取该注解上的其它参数值
        const {logApi} = annotate.params;
        console.time(logApi);
    }

    after({lastValue, annotate}) {
        const {logApi} = annotate.params;
        console.timeEnd(logApi);
        // 需要将实际返回值返回出去，避免改变原方法返回值
        return lastValue;
    }
}
```
然后回到 Component 中，修改代码如下：
```javascript
export default @VueComponent
class CustomAnnotateTest {

    @TimeLogger
    testing() {
        console.log('do testing');
    }

}
```
现在针对不同方法就回自动获取其 name 作为 logApi，测试结果如下：
```
do testing
testing: 1.61181640625ms
```
## 在 getter/setter 方法上生效
那如果我们需要对 getter 方法或者 setter 方法测试其运行时间呢，我们修改代码如下：
```javascript
export default @VueComponent
class CustomAnnotateTest {

    messages = ['hello', 'world'];

    @TimeLogger
    testing() {
        console.log('do testing');
    }

    @TimeLogger
    get secondMessage() {
        return this.messages[1];
    }

    // 注意，此处不用加注解，同一 name 如果 getter 和 setter 都加了注解，那么会生效两次
    set secondMessage(message) {
        const messages = [...this.messages];
        messages[1] = message;
        this.messages = messages; // 强制更新数组
    }

    @NativeApi
    created() {
        console.log(this.secondMessage);
        this.secondMessage = 'emmmm';
        console.log(this.secondMessage);
    }
}
```
运行测试，其输出结果如下：
```
secondMessage: 0.10595703125ms
world
secondMessage: 0.162353515625ms
secondMessage: 0.1630859375ms
emmmm
```
我们发现以上结果一眼看去完全看不出个所以然，全都是一样的 label，无法区分 getter 和 setter，为了更好的区分 getter 和 setter，我们可以使用参数 `isGetter` 和 `isSetter` 来判断 getter/setter，为了避免在不同的切面方法里面重复地判断，我们可以使用参数 `trans` 来保存判断结果，我们修改注解内容如下： 
```javascript
export default 
@Annotate({extends: Surround})
class TimeLogger {

    @DynamicParam
    @DefaultParam
    logApi({propertyEntity}) {
        // 设置其默认属性为属性名
        return propertyEntity.name;
    }

    before({annotate, isGetter, isSetter, trans}) {

        // 通过参数 isGetter, isSetter 添加后缀
        let suffix = '';
        if (isSetter) {
            suffix = '(Setter)';
        }
        if (isGetter) {
            suffix = '(Getter)';
        }

        // 放到 trans 里面供后续方法使用
        trans.suffix = suffix;

        // 通过 annotate 获取该注解上的其它参数值
        const {logApi} = annotate.params;
        console.time(logApi + suffix);
    }

    after({lastValue, annotate, trans}) {
        const {suffix} = trans;
        const {logApi} = annotate.params;
        console.timeEnd(logApi + suffix);
        // 需要将实际返回值返回出去，避免改变原方法返回值
        return lastValue;
    }
}
```
修改完成后回到页面，可以看到输出如下：
```
secondMessage(Getter): 0.52587890625ms
world
secondMessage(Setter): 0.74365234375ms
secondMessage(Getter): 0.093994140625ms
emmmm
```
## 发生异常提前结束计时  
但是一旦在方法中报了错，就无法输出运行时间，为了解决这个问题，我们可以重写 `onError` 参数，和 `before` 类似：
```javascript
export default @Annotate({extends: Surround})
class TimeLogger {

    @DynamicParam
    @DefaultParam
    logApi({propertyEntity}) {
        // 设置其默认属性为属性名
        return propertyEntity.name;
    }

    before({annotate, isGetter, isSetter, trans}) {

        // 通过参数 isGetter, isSetter 添加后缀
        let suffix = '';
        if (isSetter) {
            suffix = '(Setter)';
        }
        if (isGetter) {
            suffix = '(Getter)';
        }

        // 放到 trans 里面供后续方法使用
        trans.suffix = suffix;

        // 通过 annotate 获取该注解上的其它参数值
        const {logApi} = annotate.params;
        console.time(logApi + suffix);
    }

    after({lastValue, annotate, trans}) {
        const {suffix} = trans;
        const {logApi} = annotate.params;
        console.timeEnd(logApi + suffix);
        // 需要将实际返回值返回出去，避免改变原方法返回值
        return lastValue;
    }

    onError({annotate, trans}) {
        const {suffix} = trans;
        const {logApi} = annotate.params;
        // 捕捉到错误时，停止计时
        console.timeEnd(logApi + suffix);
    }
}
```