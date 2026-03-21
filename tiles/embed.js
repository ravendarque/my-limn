import { makeTile } from "./utils.js";
import { convertUrlToEmbedUrl } from "https://esm.sh/@social-embed/lib";

/** Check if input looks like a bare URL (no HTML tags) */
function isBareUrl(str) {
  if (str == null || typeof str !== "string") return false;
  const t = str.trim();
  return t.length > 0 && !/[\s<>]/.test(t) && /^https?:\/\//i.test(t);
}

/** Extract Instagram shortcode and type (p|reel) from URL or blockquote HTML */
function parseInstagramEmbed(html) {
  if (html == null || html === "") return null;
  const trimmed = String(html).trim();
  const permalinkMatch = trimmed.match(
    /data-instgrm-permalink="(https?:\/\/[^"]*instagram\.com\/(p|reels?)\/([^/"?#]+))/
  );
  if (permalinkMatch) {
    const type = permalinkMatch[2] === "reels" ? "reel" : permalinkMatch[2];
    return { type, shortcode: permalinkMatch[3] };
  }
  const urlMatch = trimmed.match(
    /https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reels?)\/([^/"?#\s]+)/
  );
  if (urlMatch) {
    const type = urlMatch[3] === "reels" ? "reel" : urlMatch[3];
    return { type, shortcode: urlMatch[4] };
  }
  if (/instagram\.com\/(p|reels?)\//i.test(trimmed)) {
    const fallback = trimmed.match(/\/(p|reels?)\/([A-Za-z0-9_-]+)/);
    if (fallback) {
      const type = fallback[1].toLowerCase() === "reels" ? "reel" : fallback[1].toLowerCase();
      return { type, shortcode: fallback[2] };
    }
  }
  return null;
}

/** Build iframe for Instagram (avoids blockquote+script that Firefox blocks) */
function buildInstagramIframe(type, shortcode) {
  const embedUrl = `https://www.instagram.com/${type}/${shortcode}/embed`;
  return `<iframe src="${embedUrl}" width="400" height="480" frameborder="0" scrolling="no" allowtransparency="true" loading="lazy" class="embed-iframe instagram-embed"></iframe>`;
}

/** Build iframe from embed URL (YouTube, Spotify, Vimeo, etc.) */
function buildEmbedIframe(embedUrl, originalUrl) {
  const escaped = embedUrl.replace(/"/g, "&quot;");
  return `<iframe src="${escaped}" width="560" height="315" frameborder="0" allowfullscreen loading="lazy" class="embed-iframe"></iframe><p class="embed-fallback"><a href="${(originalUrl || embedUrl).replace(/"/g, "&quot;")}" target="_blank" rel="noopener">View on original site</a></p>`;
}

/** Extract src from iframe HTML for fallback link */
function extractIframeSrc(html) {
  const m = String(html).match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
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

  const html = tile.html?.trim() || "";

  // 1. Instagram (URL or blockquote) — we handle; social-embed doesn't support it
  const instagram = parseInstagramEmbed(html);
  if (instagram) {
    const viewUrl = `https://www.instagram.com/${instagram.type}/${instagram.shortcode}/`;
    wrapper.innerHTML =
      buildInstagramIframe(instagram.type, instagram.shortcode) +
      `<p class="embed-fallback"><a href="${viewUrl}" target="_blank" rel="noopener">View on Instagram</a></p>`;
  }
  // 2. Bare URL — use social-embed for YouTube, Spotify, Vimeo, etc.
  else if (isBareUrl(html)) {
    const embedUrl = convertUrlToEmbedUrl(html);
    if (embedUrl) {
      wrapper.innerHTML = buildEmbedIframe(embedUrl, html);
    } else {
      wrapper.innerHTML = `<p class="embed-fallback"><a href="${html.replace(/"/g, "&quot;")}" target="_blank" rel="noopener">View content</a></p><p class="embed-fallback-note">Unsupported embed URL. Use a link tile instead.</p>`;
    }
  }
  // 3. Raw iframe HTML — use as-is (scripts in innerHTML don't run, but iframes work)
  else {
    const src = extractIframeSrc(html);
    if (src && !html.includes("loading=")) {
      wrapper.innerHTML = html.replace(/<iframe/i, '<iframe loading="lazy"');
    } else {
      wrapper.innerHTML = html;
    }
    if (src) {
      const fallback = document.createElement("p");
      fallback.className = "embed-fallback";
      fallback.innerHTML = `<a href="${src.replace(/"/g, "&quot;")}" target="_blank" rel="noopener">View on original site</a>`;
      wrapper.appendChild(fallback);
    }
  }

  el.appendChild(wrapper);
  return el;
}

export function validate(tile, at) {
  if (!tile.html) throw new Error(`${at} (embed) missing required field: html`);
}
