import * as heading from "./heading.js";
import * as text from "./text.js";
import * as image from "./image.js";
import * as link from "./link.js";
import * as embed from "./embed.js";
import * as linksbar from "./linksbar.js";
import * as calendar from "./calendar.js";

const tileRenderers = {
  heading,
  text,
  image,
  link,
  embed,
  linksbar,
  calendar,
};

export function validateTiles(config) {
  if (!Array.isArray(config.tiles)) throw new Error("tiles must be a list");
  config.tiles.forEach((tile, i) => {
    const at = `tiles[${i}]`;
    if (!tile.type) throw new Error(`${at} missing required field: type`);
    const renderer = tileRenderers[tile.type];
    if (!renderer) throw new Error(`${at}.type "${tile.type}" is not a known tile type`);
    if (renderer.validate) renderer.validate(tile, at);
  });
}

export function renderTile(tile) {
  const renderer = tileRenderers[tile.type];
  if (!renderer) throw new Error(`Unknown tile type: "${tile.type}"`);
  const el = renderer.render(tile);
  if (tile.type !== "calendar") {
    const surface = tile.surface ?? (tile.type === "heading" ? "hide" : "show");
    if (surface === "transparent") el.classList.add("tile--surface-transparent");
    else if (surface === "hide") el.classList.add("tile--surface-hide");
  }
  document.getElementById("tiles").appendChild(el);
}
