# Tiles

Tiles are the building blocks of your page. They appear in the order you list them.

---

## Heading

Section label. No background.

```yaml
- type: heading
  text: Links
```

---

## Text

Body copy.

```yaml
- type: text
  content: Some text here.
```

Multi-line:
```yaml
- type: text
  content: >
    Line one.
    Line two.
```

---

## Image

```yaml
- type: image
  url: https://example.com/photo.jpg
  alt: Description
```

`url` can be a web address or local filename. `alt` is optional but recommended.

---

## Link

Single button.

```yaml
- type: link
  icon: github
  url: https://github.com/yourname
  label: GitHub
```

`icon` is optional — any [Lucide icon](https://lucide.dev/icons).

---

## Linksbar

Row of icon buttons. Good for social links.

```yaml
- type: linksbar
  surface: hide
  items:
    - icon: instagram
      url: https://instagram.com/you
      label: Instagram
    - icon: github
      url: https://github.com/you
      label: GitHub
```

`surface: hide` removes the card background. `label` = tooltip + screen readers.

---

## Embed

YouTube, Spotify, Vimeo, etc.

1. On the service: **Share** → **Embed**
2. Copy the `<iframe>...</iframe>` code
3. Paste:

```yaml
- type: embed
  title: My video
  html: '<iframe src="..." ...></iframe>'
```

---

## Calendar

See [Calendar](Calendar) for full setup.

```yaml
- type: calendar
  window: month
  src: https://gist.../events.ics
```

---

**Next:** [Calendar](Calendar) · [Examples](Examples)
