## Position

Options:
1. static (default)
2. relative
3. absolute
4. fixed
5. sticky (CSS3)
    The element is positioned according to the normal flow of the document, and then offset relative to its <em>nearest scrolling ancestor</em> and <a href="/en-US/docs/Web/CSS/Containing_Block">containing block</a> (nearest block-level ancestor), including table-related elements, based on the values of <code>top</code>, <code>right</code>, <code>bottom</code>, and <code>left</code>. The offset does not affect the position of any other elements.</dd>
    This value always creates a new <a href="/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context">stacking context</a>. Note that a sticky element "sticks" to its nearest ancestor that has a "scrolling mechanism" (created when <code>overflow</code> is <code>hidden</code>, <code>scroll</code>, <code>auto</code>, or <code>overlay</code>), even if that ancestor isn't the nearest actually scrolling ancestor. This effectively inhibits any "sticky" behavior (see the <a href="https://github.com/w3c/csswg-drafts/issues/865">GitHub issue on W3C CSSWG</a>).


Some attribute related to position
1. top, right, bottom, left
    Only working when position set relative, absolute, sticky or fixed
2. z-index

Samples:
1. Match Parent(Spinner、Model's background)
2. Why `position: fixed` isn't working in sometimes?
3. Why `z-index` isn't working in sometimes?

## Overflow

Options:
1. auto
2. scroll
3. hidden
4. visible (default)
5. overlay

Relative attribute
1. overflow-x
2. overflow-y

Question:
1. What if it set `overflow-x: hidden` and `overflow-y: visible`?
2. Can we use it to highlight columns when hover cells in a table?
3. Didn't `overflow: hidden` working?
4. Can we use it to scroll in the table except the header?



## Transition

|||
|-|-|
|Default|`all 0 ease 0`|
|JavaScript Usage|`object.style.transition="width 2s"`|

Grammar
`transition: property duration timing-function delay;`

|Property|Description|
|:-|:-|
|`transition-property`|Specifies the name of the CSS property that sets the transition effect.|
|`transition-duration`|Specifies how many seconds or milliseconds it takes to complete the transition effect.|
|`transition-timing-function`|Specifies the speed curve of the speed effect.|
|`transition-delay`|Define when the transition effect starts.|

Samples:
1. Expand / collapse elements with transition.
2. Transition when elements enter / leave.

## CSS Methods

### `var()`

### `calc()`


## Some Other New Features

### Color Value Support
- rgb(0 0 0) (CSS4)
- rgba(0 0 0 / 50%) (CSS4)
- hsl(0deg 0% 0%) (CSS4)
- hsla(0deg 0% 0% / 50%) (CSS4)