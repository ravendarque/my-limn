import { makeTile } from "./utils.js";
import { createIconEl } from "./icons.js";

export function render(tile) {
  const el = makeTile("link");
  const a = document.createElement("a");
  a.href = tile.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  if (tile.icon) {
    const i = createIconEl(tile.icon);
    if (i) a.appendChild(i);
  }
  const span = document.createElement("span");
  span.textContent = tile.label;
  a.appendChild(span);
  el.appendChild(a);
  return el;
}

export function validate(tile, at) {
  if (!tile.url) throw new Error(`${at} (link) missing required field: url`);
  if (!tile.label) throw new Error(`${at} (link) missing required field: label`);
}
