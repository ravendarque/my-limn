import { makeTile } from "./utils.js";

export function render(tile) {
  const el = makeTile("linksbar");
  tile.items.forEach(({ icon, url, label }) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (label) {
      a.title = label;
      a.setAttribute("aria-label", label);
    }
    const i = document.createElement("i");
    i.setAttribute("data-lucide", icon);
    a.appendChild(i);
    el.appendChild(a);
  });
  return el;
}

export function validate(tile, at) {
  if (!Array.isArray(tile.items) || tile.items.length === 0)
    throw new Error(`${at} (linksbar) requires at least one item in "items"`);
  tile.items.forEach((item, j) => {
    if (!item.icon) throw new Error(`${at}.items[${j}] (linksbar) missing required field: icon`);
    if (!item.url) throw new Error(`${at}.items[${j}] (linksbar) missing required field: url`);
  });
}
