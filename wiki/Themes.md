# Themes

Themes control colours and tile shape (rounded, pixel-art, etc.).

```yaml
theme: dark
```

Use any filename from `themes/` (without `.yaml`).

---

## Built-in themes

| Theme | Vibe |
|-------|------|
| `dark` | Dark, purple accent |
| `scarlet` | Dark, red accent |
| `light` | Light mode |
| `nord` | Cool blues |
| `dracula` | Purple |
| `catppuccin` | Soft pastels |
| `gruvbox` | Warm, retro |
| `solarized` | Easy on the eyes |
| `retro` | CMYK arcade, pixel corners |
| `monokai` | Code-editor style |
| `pink-pony-club` | Pink, playful |
| `mocha` | Warm browns |

**Preview:** Open `themes.html` in your browser. Add `?theme=scarlet` to the URL to jump to one.

---

## Custom theme

Create `themes/mytheme.yaml`:

```yaml
background: "#0f0f0f"
surface:    "#1a1a1a"
text:       "#f0f0f0"
textMuted:  "#a0a0a0"
accent:     "#7c6aff"
accentText: "#ffffff"
border:     "#2e2e2e"
corners:    rounded
```

**Corner styles:** `rounded` | `square` | `clipped` | `pixel`

Then in config: `theme: mytheme`

---

**Next:** [Tiles](Tiles) · [Profile](Profile)
