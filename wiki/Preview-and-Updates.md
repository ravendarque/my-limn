# Preview & Updates

---

## Local preview

You can't double-click `index.html` — the page loads `config.yaml` via JavaScript, which needs a web server.

**VS Code Live Server**
1. Install "Live Server" extension
2. Right-click `index.html` → **Open with Live Server**

**Command line**
```bash
npx serve .
```
Then open `http://localhost:3000`

---

## Updating your page

1. Edit `config.yaml` (or add/replace images)
2. Commit and push
3. Page updates within a minute

---

## Updating the Limn engine

Pull improvements (themes, fixes) from the original repo.

**One-time:**
```bash
git remote add limn https://github.com/ravendarque/ravendarque-limn.git
```

**When you want updates:**
```bash
git fetch limn
git merge limn/main
```

**Conflicts?** Keep your `config.yaml`. Accept changes to `index.html`, `tiles/`, `themes/`.

---

**Next:** [Troubleshooting](Troubleshooting) · [FAQ](FAQ)
