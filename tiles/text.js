import { makeTile } from "./utils.js";

export function render(tile) {
  const el = makeTile("text");
  const p = document.createElement("p");
  p.textContent = tile.content;
  el.appendChild(p);
  return el;
}

export function validate(tile, at) {
  if (!tile.content) throw new Error(`${at} (text) missing required field: content`);
}
