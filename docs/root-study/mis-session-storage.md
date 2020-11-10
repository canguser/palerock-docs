# SessionStorage 的误区

#### 引入
之前一直以为 `sessionStorage` 只要浏览器没有关闭就一直有效，如同一个大容量、不会过期的 cookie，所以在我之前的认知里以为不同 tab 里面的同一网页可以共享 sessionStorage

![缓存图片](https://palerock.cn/api-provider/files/view?identity=L2FydGljbGUvaW1hZ2UvMjAyMDA0MjcyMDUwMDI3NzZRSndOaU5pTy5qcGVn&w=150)

事实上，`sessionStorage` 和我之前想的完全不一样，如下表所示：
||描述|
|-|-|
|作用域|只限于当前 tab|
|有效时期|tab 存在 （tab 关闭会清除该 tab 上的 `sessionStorage` ）|

> 总结：有的很简单的知识点由于其过于简单往往会导致被忽略或者通过字面意思去理解，在学习一个知识点时不管它简不简单，都需要去认真的学习和理解并加以实际操作。