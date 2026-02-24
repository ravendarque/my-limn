import { makeTile } from "./utils.js";

export function render(tile) {
  const el = makeTile("codeblock");
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = tile.content;
  if (tile.language) code.setAttribute("data-language", tile.language);
  pre.appendChild(code);
  el.appendChild(pre);
  return el;
}

export function validate(tile, at) {
  if (!tile.content) throw new Error(`${at} (codeblock) missing required field: content`);
}
