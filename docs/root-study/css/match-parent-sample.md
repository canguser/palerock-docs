# [CSS] Position 用法进阶01：匹配父级容器空间

## 引入
在前端界面设计中，会有那么一些布局，需要占满整个父级容器，比如：
- 模态框（Modal）的背景  
  
  ![模态框示例](https://palerock.cn/api-provider/files/view?identity=L2FydGljbGUvaW1hZ2UvMjAyMTAxMDQxMzEyMjExMzhCQ1BQb0l6Ni5wbmc=&w=300)

- 加载器（Spinner）的背景
  
  ![加载器示例](https://palerock.cn/api-provider/files/view?identity=L2FydGljbGUvaW1hZ2UvMjAyMTAxMDQxMzA2MzQ4NDNNU01HSVZlVC5wbmc=&w=300)

以上两种组件中，都是将背景完全填充到父级容器，区别在于模态框通常是背景填满屏幕，通常使用 `position: fixed;` 用于定位，而加载器更多用于将其背景布满父级容器，通常使用 `position: absolute;` 定位。

## 通过 CSS `position` 属性实现填满父级容器

为了实现填充父级的需求，从正常的盒子模型的设计逻辑来讲，我们的思路大体上很简单：**将子容器的高度、宽度设置为和父级一致**

围绕这个核心思路，我们可以尝试设置 `CSS` 属性： `width: 100%; height: 100%;`, 但在 `CSS` 中，`%` 这个单位仅用于用于参考父级**已设置的宽度或高度**，换句话说，如果父级容器并没有设置宽度或高度，子容器设置的 `100%` 并不能产生相应的作用，而在实际的 UI 布局中，固定父级容器高度的情况是很少出现的，大部分都是由内容将父级容器给撑高，而这种情况下子级容器并不能通过设置 `height: 100%;` 来将高度设置为和父级一致。

> 如果使用 `position: fixed` 定位，`width: 100%; height: 100%;` 是可以设置高度和宽度布满屏幕的，不过需要通过 `left:0;top:0;` 调整位置刚好和屏幕大小一致。

既然大部分情况下我们不能使用 `height: 100%` 来将子容器的高度设置为和父级一致，那我们应该怎样来填充父级空间呢？

答案是通过 `left, top, right, bottom` 这四个属性。

关于这四个属性，我们都知道是配合 `position` 使用的，并且会随着 `position` 设置的值不同，有着不同的特性：
- `position: static`：无效
- `position: fixed`：参考整个屏幕进行定位
- `position: relative`：参考自己进行定位
- `position: absolute`: 参考设置了 `position` 非 `static` 的最近一个父级进行定位

通常我们都通过使用其中两个**非对立**的属性来进行定位，比如 `left:0; top: 0;` 在 `position: fixed` 中表示该容器对齐屏幕的左上角。我们可以通过类似的写法对齐右上角，右下角，或者是左下角。

那如果我们设置一组对立的定位呢，比如在 `position: fixed` 的情况下设置 `left: 0; right: 0;`，在对该容器设置了指定 `width` 和 `height` 的情况下，我们会发现，该容器对齐在屏幕的左侧，`right: 0` 似乎并没有任何作用，在设置上下对立的定位 `top: 0; bottom: 0;` 时，该容器会对齐在屏幕的上方，仿佛 `bottom` 也没有生效。

细心的同学肯定注意到了，这里有个前提条件：*对该容器设置了指定 `width` 和 `height`*，如果我们去掉容器的高度和宽度并设置 `left: 0; right: 0; top: 0; bottom: 0;`，那么神奇的事情发生了，该容器铺满了整个容器！那如果使用 `position: absolute` 呢，效果是显而易见的，铺满了整个父级元素（前提是父级元素设置了 `position: relative` 、 `position: fixed` 或 `position: absolute`）。

总结一下，如果要铺满父级容器，我们可以将父级容器设置为 `position: relative`，并且为子级容器设置以下 `CSS` 属性
```CSS
.sub{
    position: absolute;
    width: auto; height: auto;
    top: 0; right: 0; bottom: 0; left: 0;
}
```

## 关于 `position` 中设置对立属性的思考
既然我们可以通过设置对立属性为 `0`，让没有指定高度或宽度子级容器铺满父级容器，那么我们是不是也可以通过设置对立属性为其它值从而拉扯子级容器的高度或宽度呢？

答案是肯定的，**只要子级容器没有指定高度或宽度，我们都可以设置对立属性为任意值从而拉扯其容器高度或宽度**

例子: 
1. 设置子容器高度为父级容器高度减去 `100px` ，宽度和父级一致并且垂直居中显示
   ```CSS
    .sub{
        position: absolute;
        width: auto; height: auto;
        top: 50px; right: 0; bottom: 50px; left: 0;
    }
   ```
2. 设置子容器宽度比父容器宽 `120px`，左侧超出 `20px` 右侧超出 `100px`，高度与父容器一致
   ```CSS
    .sub{
        position: absolute;
        width: auto; height: auto;
        top: 0; right: -100px; bottom: 0; left: -20px;
    }
   ```

