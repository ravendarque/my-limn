# Troubleshooting

---

## Page shows "Loading…" forever

- Open browser console (F12 → Console) for errors
- Check `config.yaml` is valid YAML (indentation, no stray characters)
- If local: use a server, not file://

---

## Image doesn't show

- Check filename or URL
- Local files must be in repo root (same folder as `index.html`)
- If load fails, Limn shows initials — that's expected

---

## Calendar is empty

- Check `src` URL is correct and public
- Gist: use the **Raw** URL, not the gist page
- ICS must have future events (within your `window`)

---

## Theme colours wrong

- Hex codes need quotes: `"#ff0000"`
- Theme file must exist in `themes/` (name is case-sensitive)

---

## "Config error" on page

The message says what's wrong (e.g. `tiles[2] missing required field: url`). Fix that field.

---

**Next:** [FAQ](FAQ) · [Config reference in README](https://github.com/ravendarque/ravendarque-limn#configyaml-reference)
