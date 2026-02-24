import * as linksbar from "./linksbar.js";

export function render(tile, config) {
  const pages = config?.pages || [];
  const items = pages
    .filter((p) => !p["hide-from-navbar"])
    .map((p) => ({
      icon: p.icon || "link",
      url: `#${p.id}`,
      label: p.title || p.id,
    }));
  return linksbar.render({ ...tile, items });
}

export function validate(tile, at) {
  // No required fields — items are derived from pages
}
