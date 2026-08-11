# Rue Carousel

Rue Carousel renders an `items` array from JavaScript/JSON and resolves multilingual object fields. It can show arrows, dots, loop, autoplay and keyboard navigation.

[繁體中文](./README.zh-Hant.md) · [简体中文](./README.zh-Hans.md)

## Load the files

```html
<link rel="stylesheet" href="./rue-carousel.css">
<script src="./rue-carousel.js"></script>
```

## Data format

```json
{
  "items": [
    {
      "id": "alpha",
      "title": { "en": "Alpha", "zh-Hant": "Alpha 專案" },
      "summary": { "en": "Example", "zh-Hant": "範例" }
    }
  ]
}
```

## Initialise

```js
fetch('./examples/projects.json')
  .then(r => r.json())
  .then(data => {
    const carousel = new RueCarousel({
      container: '#projects',
      data,
      lang: 'en',
      showArrows: true,
      showDots: true,
      loop: true,
      autoplay: false,
      keyboard: true
    });
  });
```

`container` may be a CSS selector string or an element. `autoplay` is `false` or a millisecond interval such as `4000`.

## Main methods

- `resolveField(value)` — resolve a string or multilingual object with fallback.
- `resolveItem(item)` — resolve multilingual fields across an item.
- `goTo(index)`, `prev()`, `next()` — navigation.
- `setLanguage(lang, fallback?)` — change language and re-render.
- `setData(data)` — replace the data.
- `filter(predicate)` — temporarily render items matching a predicate and return the filtered set.
- `destroy()` — stop autoplay, remove keyboard listener and clear the container.

## Custom template

Pass `template(item)` if the default card HTML is not suitable. Do not depend on the variable receiving `new RueCarousel(...)` from inside the template during construction, because the constructor renders before assignment completes. Use the supplied `item` and independent helper functions, or design the template so it does not require the outer instance variable during its first render.
