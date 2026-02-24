import { makeTile } from "./utils.js";

export function render(tile) {
  const el = makeTile("quote");
  const blockquote = document.createElement("blockquote");
  blockquote.textContent = tile.content;
  el.appendChild(blockquote);
  if (tile.attribution) {
    const cite = document.createElement("cite");
    cite.textContent = tile.attribution;
    el.appendChild(cite);
  }
  return el;
}

export function validate(tile, at) {
  if (!tile.content) throw new Error(`${at} (quote) missing required field: content`);
}
