# For Developers

Technical notes for extending Limn.

---

## Stack

- **Vanilla JS** (ES modules), no build step
- **YAML** parsed at runtime (js-yaml)
- **Themes** → CSS custom properties
- **CDN:** esm.sh (js-yaml, Lucide, ical.js)

---

## Tiles

Each tile is `tiles/name.js` + `tiles/name.css`. Registry in `tiles/index.js`.

**Add a new tile:**
1. Create `tiles/mynewtile.js` with `render(tile)` and `validate(tile, at)` exports
2. Create `tiles/mynewtile.css` for `.tile-mynewtile`
3. Register in `tiles/index.js`
4. Add `@import "mynewtile.css"` to `tiles/tiles.css`

`index.html` stays unchanged.

---

## Ethical tech

See `.cursor/rules/ethical-tech.mdc` for BDS boycott considerations. GitHub is an exception.

---

**Next:** [Home](Home)
