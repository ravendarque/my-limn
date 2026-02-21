/**
 * Shared engine functions — used by index.html and themes.html
 */

export function applyTheme(theme) {
  const s = document.documentElement.style;
  s.setProperty("--color-bg",          theme.background);
  s.setProperty("--color-surface",     theme.surface);
  s.setProperty("--color-text",        theme.text);
  s.setProperty("--color-text-muted",   theme.textMuted  ?? "#888");
  s.setProperty("--color-accent",      theme.accent);
  s.setProperty("--color-accent-text",  theme.accentText ?? "#fff");
  s.setProperty("--color-border",      theme.border     ?? "transparent");
  document.body.dataset.corners = theme.corners ?? "rounded";
}

export function renderProfile({ name, bio, image }) {
  const el = document.createElement("div");
  el.className = "profile";

  if (image) {
    const img = document.createElement("img");
    img.src = image;
    img.alt = name;
    img.className = "profile-avatar";
    img.onerror = () => img.replaceWith(makeInitials(name));
    el.appendChild(img);
  } else {
    el.appendChild(makeInitials(name));
  }

  const nameEl = document.createElement("div");
  nameEl.className = "profile-name";
  nameEl.textContent = name;
  el.appendChild(nameEl);

  if (bio) {
    const bioEl = document.createElement("p");
    bioEl.className = "profile-bio";
    bioEl.textContent = bio;
    el.appendChild(bioEl);
  }

  return el;
}

export function makeInitials(name) {
  const div = document.createElement("div");
  div.className = "profile-initials";
  div.setAttribute("aria-hidden", "true");
  div.textContent = name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return div;
}

export function showError(err, title = "Config error") {
  const box = document.createElement("div");
  box.className = "error-box";
  box.innerHTML = `<strong>${title}</strong>${err.message}`;
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.appendChild(box);
}
