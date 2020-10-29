# JS 中实现 Deep Clone (深克隆) 的思路
## 什么是深克隆，为什么要深克隆
深克隆就是将某个对象完全复制一份与原对象无任何关联的相同对象，重新分配新的内存。  
为什么要使用深克隆呢，在 JS 中，对数据操作时，通常会如以下所示  
1. 基本数据类型的赋值  
    ```javascript
    let a = 10;
    let b = 20;
    
    b = a; // 将 a 的值赋值给 b
    
    a = 30;
    
    console.log(a,b); // 10 30 
    
    // 对象中的基本数据类型的赋值
    
    let data = {
        message:'clone'        
    };
    
    let data2 = {   
        message:'clone2'
    };
    
    data2.message = 'clone3';
    
    data.message = data2.message;
    
    console.log(data); // {message:'clone2'}
    console.log(data2); // {message:'clone3'}
    ```
    从上述代码不难看出，在对基本数据类型使用 `=` 赋值的时候会重新分配内存空间使得两个变量在赋值之后隔离开不会相互影响  
2. 非基本数据类型情况下的属性引用赋值  
    ```javascript
    let data = { meta: {message: 'clone'} };
    let data2 = {};
    data2.meta = data.meta;
    
    console.log(data2.meta.message); // clone
    
    data.meta.message = 'clone reassign';
    
    console.log(data2.meta.message); // clone reassign
    ``` 
    从上诉代码我们可以看出，在 `data2.meta = data.meta` 这块代码中我们将 meta 这个非基本类型的属性赋值给了 data2 这个变量，然而，当我们改变 data 变量中 meta 的值时，data2 中的 meta 对象中的值也发生的改变。  
    由此我们可以知道在 `data2.meta = data.meta` 中，实际上是将 data 对象中的 meta 对象的引用赋值给了 data2  

从上诉两点我们可以得出结论 —— 在 JS 中，对变量赋值时，如果该变量是 基本数据类型 （比如: string, number, boolean, undefined 等）会重新分配内存空间，若该变量是一个对象，则会将该对象的引用赋值给目标变量。 
所以，如果想要得到一个与原对象毫无关联的相同的新对象，简单地使用 `=` 是不能满足深克隆的需求的。  
## 深克隆和浅克隆的区别
那什么是浅克隆呢，浅克隆可以理解为深克隆的简单化，下面我们通过代码来看看浅克隆和简单使用 `=` 的区别
```javascript
// using '='

let a1 = a;

console.log(a1.number); // 1;

a.number++;

console.log(a1.number); // 2;

// other

let a2 = shallowClone(a); // shallowClone 是实现浅克隆的方法，暂不关心他是怎么实现的

console.log(a2.number); // 2;
console.log(a2.b.number); // 10;

a.number++;
a.b.number++;

console.log(a2.number); // 2;
console.log(a2.b.number); // 11;
```
从以上代码我们可以看到在使用 `=` 的时候仅仅是将 a 对象的引用给了 a1 对象，其内部属性的变化同样体现在了 a1 对象中，而在浅克隆时，将 a 对象重新分配了内存，并赋值给了 a2 ，然而 a 对象的子对象 b 并没有重新分配内存，换言之——**浅克隆只是克隆了最外面一层，而深克隆是对包含 b 对象在内的子对象都进行了 clone 并分配的新的内存空间**
## 实现深克隆的基本思路
基于以上内容，我们可以知道，在 Javascript 中，变量的赋值方式大体分为内存赋值和引用赋值，那么要实现深克隆，我们就需要避免引用赋值。  
由于引用赋值仅存在与两个对象间的 `=` 赋值中，所以，我们可以在每一次对对象做赋值时，新建一个对象，将源对象中的所有属性重新赋值给新对象，然后将新对象的引用赋值给目标变量。  
针对与对象内部的子对象，重复以上过程，便可以得到一个完全体的深克隆对象。
## 深克隆的实现方法
### 使用 JSON.parse 和 JSON.stringify 方法相结合
从最简单的方法来看，我们可以使用 `JSON.parse` 和 `JSON.stringify` 两个方法结合从而实现深克隆，其原理就是在 stringify 的过程中并没有保存源对象的引用，从而在之后的 parse 还原后生成的是全新的对象。
```javascript
function deepCloneByJSON(obj) {
    return JSON.parse(JSON.stringify(obj));
}
```
但是缺点也很明显，因为:
 1. JSON.stringify 会将日期转换为字符串，所以日期类型是无法克隆的
 2. JSON.stringify 会忽视 function 类型的属性，导致 function 无法被克隆
 3. JSON.stringify 遇到子对象相互引用的情况会报错，导致无法克隆
### 将浅克隆嵌套通过递归实现深克隆
由于浅克隆是只克隆对象的一层属性，并不会影响到子对象的引用，所以如果我们在浅克隆的基础上，对所有的子对象也进行一次浅克隆，那最后得到的结果对象也就是深克隆对象了。
```javascript
function shallowClone(obj) {
    return Object.assign({},obj); // 我们可以使用原生方法 Object.assign 来快速实现浅克隆
}

function deepClone(obj) {
    const result = shallowClone(obj);
    Object.entries(result).forEach(
        ([key,value])=>{
            if (typeof value === 'object'){
                result[key] = deepClone(value);            
            }   
        }    
    );
    return result;
}
```
#### 一些特殊的对象处理
在上述克隆代码中我们实现了最基本的深克隆，但是还有问题有待解决，从克隆的完整性来说，如果我们克隆的子对象中有数组或日期对象，那么通过以上代码克隆出的内容将会变得奇怪，所以我们在克隆子对象时，应该对一些特殊对象特殊处理。
```javascript
function deepClone(obj) {

    if (obj instanceof Date) {
        return new Date(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(o => typeof o === 'object' ? deepClone(o) : o);
    }

    const result = shallowClone(obj);
    Object.entries(result).forEach(
        ([key, value]) => {
            if (typeof value === 'object') {
                result[key] = deepClone(value);
            }
        }
    );
    return result;
}
```
#### 怎样避免无限循环
同使用 JSON 中的方法来实现深克隆一样，如果被克隆的对象中有几个子对象相互引用，那么在上述的克隆代码中会无限循环递归调用。  
为了避免无限循环，我们可以采取以下两种方式来避免：
1. 在参数中加入 deep 参数用以代表深度，表示最多的子对象克隆深度
2. 对所有子对象建立缓存栈，如发现子对象内部引用了父级对象，就停止该栈的克隆  

我们可以同时实现上诉内容以达到最佳的体验
```javascript
function deepClone(obj, deep = Infinity, objectStack = []) {

    if (deep <= 0 || objectStack.includes(obj)) {
        return null; // 停止克隆
    }

    if (obj instanceof Date) {
        return new Date(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(o => typeof o === 'object' ? deepClone(o, deep - 1, objectStack.concat([obj])) : o);
    }

    const result = shallowClone(obj);
    Object.entries(result).forEach(
        ([key, value]) => {
            if (typeof value === 'object') {
                result[key] = deepClone(value, deep - 1, objectStack.concat([obj]));
            }
        }
    );
    return result;
}
```
#### `Symbol` 属性的克隆
通过上一步完善的方法我们来测试一下如果对象的属性名是 Symbol 那么克隆能否正常地进行，代码如下：
```javascript
const symbolMap = {
    'a1': Symbol('a1'),
    'a2': Symbol('a2'),
    'b': Symbol('b'),
    'c': Symbol('c'),
};

const b = {
    [symbolMap['c']]: 100,
    c: 200
};

const origin = {
    [symbolMap['a1']]: 'a1',
    [symbolMap['a2']]: 2,
    [symbolMap['b']]: b,
};

const result = deepClone(origin);

b[symbolMap['c']] = 300;
origin[symbolMap['a2']] = 3;

console.log(result[symbolMap['a2']]); // 2
console.log(result[symbolMap['b']][symbolMap['c']]); // 300 (not 100)
```
从最后结果来看，浅克隆是成功了，但是针对子对象的深克隆失败了。
究其缘由，最后锁定在 `Object.entries` 这个方法上, 通过这个方法我们可以获取到所有属性的键值对，通过遍历实现为子对象克隆，但在属性键为 Symbol 类型时，该方法并不能获取到，所以深克隆失败了。
为了使得我们的方法可以成功执行，写一个新的方法获取包含 Symbol 在内的属性，代码如下：
```javascript
function getKeyValues(obj) {
    return [...Object.keys(obj), ...(Object.getOwnPropertySymbols(obj))].map(key => [key, obj[key]]);
}

function deepClone(obj, deep = Infinity, objectStack = []) {

    if (deep <= 0 || objectStack.includes(obj)) {
        return null; // 停止克隆
    }

    if (obj instanceof Date) {
        return new Date(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(o => typeof o === 'object' ? deepClone(o, deep - 1, objectStack.concat([obj])) : o);
    }

    const result = shallowClone(obj);
    // Object.entries => getKeyValues
    getKeyValues(result).forEach(
        ([key, value]) => {
            if (typeof value === 'object') {
                result[key] = deepClone(value, deep - 1, objectStack.concat([obj]));
            }
        }
    );
    return result;
}
```
#### 描述为不可遍历的属性的克隆
在上一部分我们发现了在正常情况下 Symbol 会被遗漏，那其它属性呢，我们通过 Object.entries 或 Object.keys 不仅会遗漏 Symbol 属性，还会遗漏不可遍历的属性，于是我们可以修改以上代码，让深克隆能够克隆一些不可遍历的属性：
```javascript
function getKeyValues(obj) {
    // Object.keys => Object.getOwnPropertyNames
    return [...Object.getOwnPropertyNames(obj), ...(Object.getOwnPropertySymbols(obj))].map(key => [key, obj[key]]);
}
```
同时，浅克隆的方法也应该有所变更
```javascript
function shallowClone(obj) {
    const result = {};
    getKeyValues(obj).forEach(
        ([key,value])=>{
            result[key] = value;
        }
    );
    return result;
}
```
## 关于深克隆的深入思考  
### 对象原型的克隆
### Proxy 代理对象的的克隆

> 原文转自 [JS 中实现 Deep Clone (深克隆) 的思路 | 苍石居](https://palerock.cn/articles/001JFiGTH9G) 未经允许禁止转载