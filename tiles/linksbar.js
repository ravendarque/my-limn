import { makeTile } from "./utils.js";
import { createIconEl } from "./icons.js";

const MAX_LABEL_LENGTH = 12;

function truncateLabel(label) {
  if (!label || label.length <= MAX_LABEL_LENGTH) return label;
  return label.slice(0, MAX_LABEL_LENGTH) + "…";
}

function createLink({ icon, url, label }, { showLabels, currentHash, firstPageId }) {
  const a = document.createElement("a");
  a.href = url;
  const isHash = url.startsWith("#");
  if (!isHash) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  if (label) {
    a.title = label;
    a.setAttribute("aria-label", label);
  }
  if (isHash) {
    const pageId = url.slice(1);
    const isActive = currentHash === pageId || (firstPageId && pageId === firstPageId && !currentHash);
    if (isActive) a.classList.add("tile-linksbar-link--active");
  }
  const i = createIconEl(icon);
  if (i) a.appendChild(i);
  if (showLabels && label) {
    const span = document.createElement("span");
    span.className = "tile-linksbar-label";
    span.textContent = truncateLabel(label);
    a.appendChild(span);
  }
  return a;
}

function buildModal(items, opts) {
  const overlay = document.createElement("div");
  overlay.className = "linksbar-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Navigation");

  const sheet = document.createElement("div");
  sheet.className = "linksbar-modal-sheet";

  items.forEach((item) => {
    const a = createLink(item, opts);
    a.className = (a.className ? a.className + " " : "") + "linksbar-modal-link";
    sheet.appendChild(a);
  });

  overlay.appendChild(sheet);
  return overlay;
}

export function render(tile) {
  const el = makeTile("linksbar");
  const showLabels = !!tile.showLabels;
  const currentHash = (location.hash || "#").slice(1);
  const firstItem = tile.items.find((item) => item.url?.startsWith("#"));
  const firstPageId = firstItem ? firstItem.url.slice(1) : null;
  const opts = { showLabels, currentHash, firstPageId };

  if (showLabels) el.classList.add("tile-linksbar--with-labels");

  const nav = document.createElement("nav");
  nav.className = "linksbar-links";
  tile.items.forEach((item) => {
    nav.appendChild(createLink(item, opts));
  });
  el.appendChild(nav);

  if (showLabels) {
    const activeItem = tile.items.find(
      ({ url }) => url.startsWith("#") && (url.slice(1) === currentHash || (!currentHash && url.slice(1) === firstPageId))
    ) || tile.items[0];

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "linksbar-trigger";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-label", "Open navigation");

    const pageIcon = createIconEl(activeItem?.icon || "link");
    if (pageIcon) trigger.appendChild(pageIcon);

    const triggerText = document.createElement("span");
    triggerText.className = "linksbar-trigger-label";
    triggerText.textContent = truncateLabel(activeItem?.label || "Menu");
    trigger.appendChild(triggerText);

    const chevron = createIconEl("chevron-down");
    if (chevron) {
      chevron.className += " linksbar-trigger-chevron";
      trigger.appendChild(chevron);
    }
    el.appendChild(trigger);

    trigger.addEventListener("click", () => {
      const overlay = buildModal(tile.items, opts);

      const close = () => {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
      };

      const onKey = (e) => {
        if (e.key === "Escape") close();
      };

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
      });
      overlay.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", close);
      });
      document.addEventListener("keydown", onKey);

      document.body.appendChild(overlay);
    });
  }

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
