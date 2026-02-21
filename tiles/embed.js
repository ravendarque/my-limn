import { makeTile } from "./utils.js";

export function render(tile) {
  const el = makeTile("embed");
  if (tile.title) {
    const label = document.createElement("p");
    label.className = "embed-label";
    label.textContent = tile.title;
    el.appendChild(label);
  }
  const wrapper = document.createElement("div");
  wrapper.className = "embed-wrapper";
  wrapper.innerHTML = tile.html;
  el.appendChild(wrapper);
  return el;
}

export function validate(tile, at) {
  if (!tile.html) throw new Error(`${at} (embed) missing required field: html`);
}
