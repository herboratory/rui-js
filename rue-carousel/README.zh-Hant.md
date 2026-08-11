# Rue Carousel

Rue Carousel 從 JavaScript / JSON 的 `items` array 渲染內容，並可自動解析多語言 object 欄位。支援 arrows、dots、loop、autoplay 和 keyboard navigation。

```html
<link rel="stylesheet" href="./rue-carousel.css">
<script src="./rue-carousel.js"></script>
<div id="projects"></div>
```

```js
fetch('./examples/projects.json')
  .then(r => r.json())
  .then(data => {
    const carousel = new RueCarousel({
      container: '#projects',
      data,
      lang: 'zh-Hant',
      showArrows: true,
      showDots: true,
      loop: true
    });
  });
```

主要方法：`resolveField()`、`resolveItem()`、`goTo()`、`prev()`、`next()`、`setLanguage()`、`setData()`、`filter()`、`destroy()`。

### 自訂 template 的重要注意

`new RueCarousel(...)` constructor 會立即 render，所以不要在第一次 `template(item)` 執行時依賴外層那個「正在接收 new RueCarousel 的變數」。否則它當時仍可能是 `null`。請使用傳入的 `item` 和獨立 helper function。
