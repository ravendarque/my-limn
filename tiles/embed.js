import { makeTile } from "./utils.js";

/** Extract Instagram shortcode and type (p|reel) from URL or blockquote HTML */
function parseInstagramEmbed(html) {
  if (html == null || html === "") return null;
  const trimmed = String(html).trim();
  // From data-instgrm-permalink="https://www.instagram.com/p/ABC123/" or reel/reels
  const permalinkMatch = trimmed.match(
    /data-instgrm-permalink="(https?:\/\/[^"]*instagram\.com\/(p|reels?)\/([^/"?#]+))/
  );
  if (permalinkMatch) {
    const type = permalinkMatch[2] === "reels" ? "reel" : permalinkMatch[2];
    return { type, shortcode: permalinkMatch[3] };
  }
  // Bare URL: instagram.com/p/ABC123/ or /reel/XYZ/ or /reels/XYZ/
  const urlMatch = trimmed.match(
    /https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reels?)\/([^/"?#\s]+)/
  );
  if (urlMatch) {
    const type = urlMatch[3] === "reels" ? "reel" : urlMatch[3];
    return { type, shortcode: urlMatch[4] };
  }
  // Fallback: any string containing instagram.com/reel/ or /p/ (handles encoding, extra whitespace)
  if (/instagram\.com\/(p|reels?)\//i.test(trimmed)) {
    const fallback = trimmed.match(/\/(p|reels?)\/([A-Za-z0-9_-]+)/);
    if (fallback) {
      const type = fallback[1].toLowerCase() === "reels" ? "reel" : fallback[1].toLowerCase();
      return { type, shortcode: fallback[2] };
    }
  }
  return null;
}

/** Build iframe HTML for Instagram post/reel (avoids blockquote+script that Firefox blocks) */
function buildInstagramIframe(type, shortcode) {
  const embedUrl = `https://www.instagram.com/${type}/${shortcode}/embed`;
  return `<iframe src="${embedUrl}" width="400" height="480" frameborder="0" scrolling="no" allowtransparency="true" class="instagram-embed"></iframe>`;
}

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

  const instagram = parseInstagramEmbed(tile.html);
  if (instagram) {
    const embedUrl = `https://www.instagram.com/${instagram.type}/${instagram.shortcode}/`;
    wrapper.innerHTML =
      buildInstagramIframe(instagram.type, instagram.shortcode) +
      `<p class="embed-fallback"><a href="${embedUrl}" target="_blank" rel="noopener">View on Instagram</a></p>`;
  } else {
    wrapper.innerHTML = tile.html;
  }

  el.appendChild(wrapper);
  return el;
}

export function validate(tile, at) {
  if (!tile.html) throw new Error(`${at} (embed) missing required field: html`);
}
