import { makeTile } from "./utils.js";

export function render(tile) {
  const el = makeTile("image");
  const img = document.createElement("img");
  img.src = tile.url;
  img.alt = tile.alt ?? "";
  img.loading = "lazy";
  el.appendChild(img);
  return el;
}

export function validate(tile, at) {
  if (!tile.url) throw new Error(`${at} (image) missing required field: url`);
}
