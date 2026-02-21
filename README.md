# limn

A self-hosted, no-build bio and links page. Edit one YAML file — that's it.

**[→ Documentation (Wiki)](https://github.com/ravendarque/ravendarque-limn/wiki)** — individual pages with sidebar. Start with [Getting Started](https://github.com/ravendarque/ravendarque-limn/wiki/Getting-Started).

## Setup

1. **Use this template** — click "Use this template" above, or fork/clone
2. Edit `config.yaml` with your profile, theme, and tiles
3. Copy examples from `examples/` — each file shows one tile type (heading, text, image, link, linksbar, embed, calendar)
4. Replace `avatar.jpg` with your photo or remove `image:` to use initials
5. Replace `example.ics` if you use the calendar tile — or point `src` to your own ICS URL
6. Enable GitHub Pages: **Settings → Pages → Source: Deploy from branch → `main` / `/ (root)`**
7. Push to `main` — your page is live

No Node, no build step, no CI pipeline required.

**Included:** `avatar.jpg` (placeholder), `example.ics` (sample calendar — tongue-in-cheek ethical celebrity schedule). Replace or remove as needed.

---

## Theme preview

Open `themes.html` to preview all themes with a dropdown. Shows sample tiles. Add `?theme=scarlet` to the URL to jump to a theme.

---

## Local preview

Because `index.html` fetches `config.yaml` via `fetch()`, you need a local file server (opening the file directly won't work):

- **VS Code Live Server** — right-click `index.html` → Open with Live Server
- **npx**: `npx serve .` then open `http://localhost:3000`

---

## config.yaml reference

### Profile

```yaml
profile:
  name: Avery Storm           # required
  bio: Developer & designer   # optional
  image: https://...          # optional — falls back to initials if omitted or broken
```

`image` can be a URL or a local filename committed to the repo (e.g. `avatar.jpg`).

---

### Theme

Set `theme` to the name of any file in the `themes/` directory:

```yaml
theme: dark
```

Available themes: `dark`, `scarlet`, `light`, `nord`, `dracula`, `catppuccin`, `gruvbox`, `solarized`, `retro`, `monokai`, `pink-pony-club`, `mocha`

Each theme file sets these fields:

```yaml
background: "#0f0f0f"   # page background          — required
surface:    "#1a1a1a"   # tile card background      — required
text:       "#f0f0f0"   # primary text              — required
accent:     "#7c6aff"   # link buttons, highlights  — required
textMuted:  "#a0a0a0"   # secondary text            — optional (default: #888)
accentText: "#ffffff"   # text on accent surfaces   — optional (default: #fff)
border:     "#2e2e2e"   # tile borders              — optional (default: transparent)
corners:    rounded     # corner style — see below
```

**Corner styles** (set per theme):

| Value | Effect |
|---|---|
| `rounded` | Soft rounded corners (default) |
| `square` | No rounding — hard 90° corners |
| `clipped` | Diagonal cut on top-right and bottom-left |
| `pixel` | 3-step staircase corners — 8-bit game aesthetic |

You can also inline a theme directly in `config.yaml` instead of referencing a file:

```yaml
theme:
  background: "#0f0f0f"
  surface:    "#1a1a1a"
  text:       "#f0f0f0"
  accent:     "#7c6aff"
  corners:    square
```

---

### Tiles

Tiles are rendered in the order they appear in the list.

#### heading

Section label — no background or border, just uppercase text.

```yaml
- type: heading
  text: Links
```

#### text

```yaml
- type: text
  content: Some body copy here.
```

#### image

```yaml
- type: image
  url: https://example.com/photo.jpg
  alt: Description of image   # optional but recommended
```

#### link

```yaml
- type: link
  url: https://github.com/yourname
  label: GitHub
  icon: github   # optional — any Lucide icon name (https://lucide.dev/icons)
```

#### linksbar

A row of linked icon buttons — for social links or anything else.

```yaml
- type: linksbar
  items:
    - icon: github
      url: https://github.com/yourname
      label: GitHub           # optional — shown as tooltip and used for screen readers
    - icon: instagram
      url: https://instagram.com/yourname
      label: Instagram
    - icon: rss
      url: https://yourblog.com/feed
      label: RSS Feed
```

`icon` can be any [Lucide icon name](https://lucide.dev/icons). `label` is optional but recommended.

#### embed

Paste the full `<iframe>` snippet from a service's "Share → Embed" dialog.

```yaml
- type: embed
  html: '<iframe src="https://www.youtube.com/embed/..." ...></iframe>'
  title: Optional label shown above the embed   # optional
```

Works with YouTube, Spotify, Vimeo, SoundCloud, and any service that provides a standard iframe embed.

#### calendar

Displays upcoming events filtered to a time window.

```yaml
- type: calendar
  window: week   # today | week | month | year
```

| Window | Shows events… |
|---|---|
| `today` | Starting today |
| `week` | Starting within the next 7 days |
| `month` | Starting within the next 30 days |
| `year` | Starting within the next 365 days |

Events outside the window are hidden. Events are sorted by start time.

**Option 1 — ICS file** (recommended for real calendars):

```yaml
- type: calendar
  window: year
  src: https://gist.githubusercontent.com/yourname/abc123/raw/events.ics
```

`src` can be:
- A relative path to an `.ics` file committed alongside `index.html` (e.g. `events.ics`)
- A public URL — a GitHub Gist raw URL works well (CORS-friendly, editable without touching the repo)

To use a Gist:
1. Go to [gist.github.com](https://gist.github.com), create a **public** gist named `events.ics`
2. Paste your ICS content and save
3. Click **Raw** and copy the URL (`gist.githubusercontent.com/...`)
4. Paste that URL as `src`
5. Edit the gist to update events — no git commit needed

**Option 2 — Static list:**

```yaml
- type: calendar
  window: week
  items:
    - title: Team Standup
      start: "2026-02-19T09:00:00"
      end:   "2026-02-19T09:30:00"
      description: Daily sync   # optional
      location: Zoom            # optional
```

---

## Adding a custom tile

Tiles are modular: each lives in `tiles/` as a `.js` + `.css` pair. To add a new tile type:

1. Create `tiles/mynewtile.js` with `render(tile)` and `validate(tile, at)` exports
2. Create `tiles/mynewtile.css` with styles for `.tile-mynewtile`
3. In `tiles/index.js`: add `import * as mynewtile from "./mynewtile.js"` and register in `tileRenderers`
4. In `tiles/tiles.css`: add `@import "mynewtile.css";`

`index.html` stays unchanged. See existing tiles in `tiles/` for the pattern.

---

## Adding a custom theme

Create a new file in `themes/` — e.g. `themes/mytheme.yaml`:

```yaml
background: "#1a1a2e"
surface:    "#16213e"
text:       "#eaeaea"
textMuted:  "#888"
accent:     "#e94560"
accentText: "#ffffff"
border:     "#0f3460"
corners:    rounded
```

Then reference it in `config.yaml`:

```yaml
theme: mytheme
```

---

## Making this repo a template

To let others create new repos from this one: **Settings → General → check "Template repository"**. They'll see "Use this template" instead of "Fork".

**Releases:** The `release` workflow creates GitHub Releases on push to `main`. Version is computed from commit messages since the last tag:
- `+semver:major` or `+semver:breaking` → major bump
- `+semver:minor` or `+semver:feature` → minor bump
- Otherwise → patch bump

**GitHub Wiki:** The `wiki/` folder syncs to the repo's GitHub Wiki via the `wiki-sync` workflow. To enable:
1. **Settings** → **Features** → check **Wiki**
2. Create one page (e.g. Home) to initialize the wiki
3. Push changes to `wiki/` — the workflow syncs automatically

Edit `wiki/` in the repo; the workflow syncs to the wiki on push.

---

## Updating the engine

If you forked or used the template and want to pull engine updates:

```bash
git remote add limn https://github.com/ravendarque/ravendarque-limn.git   # or the canonical Limn repo
git fetch limn
git merge limn/main
```

Resolve conflicts in `config.yaml` (keep yours) and accept changes to `index.html`, `tiles/`, `themes/`.
