/**
 * Shared engine functions — used by index.html and themes.html
 */

import { load } from "https://esm.sh/js-yaml@4";

export async function loadTheme(themeValue, basePrefix = "") {
  if (typeof themeValue === "string") {
    const path = `${basePrefix}themes/${themeValue}.yaml`;
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Could not load theme "${themeValue}" (${path} returned HTTP ${res.status})`);
    return load(await res.text());
  }
  return themeValue;
}

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

export function getInitials(name) {
  const n = (name || "").trim();
  if (!n) return "?";
  return n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function makeInitials(name) {
  const div = document.createElement("div");
  div.className = "profile-initials";
  div.setAttribute("aria-hidden", "true");
  div.textContent = getInitials(name);
  return div;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function hintForError(err) {
  const msg = (err?.message || "").toLowerCase();
  if (msg.includes("config.yaml") && (msg.includes("404") || msg.includes("could not load")))
    return "Make sure config.yaml exists in the same folder as index.html. If you used the configurator, extract the full zip before deploying.";
  if (msg.includes("theme") && (msg.includes("load") || msg.includes("404")))
    return "The themes/ folder may be missing or the theme file wasn't included. Re-download from the configurator and deploy the full zip contents.";
  if (msg.includes("failed to fetch") || msg.includes("import"))
    return "A script or module failed to load. Check that all engine files (limn-engine.js, tiles/*.js) are present, and that esm.sh is not blocked.";
  if (msg.includes("tiles[") || msg.includes("missing required"))
    return "Check your config.yaml syntax. Each tile needs the required fields — see the examples/ folder.";
  return null;
}

export function showError(err, title = "Something went wrong", hint = null) {
  const box = document.createElement("div");
  box.className = "error-box";
  const h = hint ?? hintForError(err);
  box.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <p class="error-message">${escapeHtml(err?.message || String(err))}</p>
    ${h ? `<p class="error-hint"><strong>What to try:</strong> ${escapeHtml(h)}</p>` : ""}
  `;
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.appendChild(box);
}
