import { makeTile } from "./utils.js";

export function render(tile) {
  const el = makeTile("heading");
  const h2 = document.createElement("h2");
  h2.textContent = tile.text;
  el.appendChild(h2);
  return el;
}

export function validate(tile, at) {
  if (!tile.text) throw new Error(`${at} (heading) missing required field: text`);
}
