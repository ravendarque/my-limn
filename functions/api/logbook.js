import { isAuthed } from "../_lib/auth.js";

const KV_KEY = "logbook:entries";

const VALID_TYPES    = ["boulder", "lead"];
const VALID_STATUSES = ["send", "project", "abandoned", "wishlist"];

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function generateId(place, name) {
  return `${slugify(place)}-${slugify(name)}`;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function validateFields(entry) {
  for (const field of ["place", "name", "grade", "type", "status"]) {
    if (!entry[field]) return `Missing required field: ${field}`;
  }
  if (!VALID_TYPES.includes(entry.type)) {
    return `type must be one of: ${VALID_TYPES.join(", ")}`;
  }
  if (!VALID_STATUSES.includes(entry.status)) {
    return `status must be one of: ${VALID_STATUSES.join(", ")}`;
  }
  return null;
}

function buildEntry(entry, id) {
  return {
    id,
    name:   entry.name,
    grade:  entry.grade,
    place:  entry.place,
    area:   entry.area   ?? "",
    type:   entry.type,
    status: entry.status,
    flash:  entry.status === "send" ? Boolean(entry.flash) : false,
    date:   entry.date   || null,
    video:  entry.video  || null,
    notes:  entry.notes  || null,
  };
}

export async function onRequestGet({ env }) {
  const raw = await env.LOGBOOK_KV.get(KV_KEY);
  const body = raw ?? JSON.stringify({ entries: [] });
  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
}

export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) {
    return json({ error: "Unauthorized" }, 401);
  }

  let entry;
  try {
    entry = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const err = validateFields(entry);
  if (err) return json({ error: err }, 400);

  const raw = await env.LOGBOOK_KV.get(KV_KEY);
  const { entries = [] } = raw ? JSON.parse(raw) : {};

  let id = generateId(entry.place, entry.name);
  // Avoid ID collision (same place+name entered twice)
  if (entries.some(e => e.id === id)) {
    id = `${id}-${Date.now()}`;
  }

  entries.push(buildEntry(entry, id));
  const updated = JSON.stringify({ entries });
  await env.LOGBOOK_KV.put(KV_KEY, updated);

  return new Response(updated, {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPut({ request, env }) {
  if (!(await isAuthed(request, env))) {
    return json({ error: "Unauthorized" }, 401);
  }

  let entry;
  try {
    entry = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!entry.id) return json({ error: "Missing required field: id" }, 400);
  const err = validateFields(entry);
  if (err) return json({ error: err }, 400);

  const raw = await env.LOGBOOK_KV.get(KV_KEY);
  const { entries = [] } = raw ? JSON.parse(raw) : {};

  const index = entries.findIndex(e => e.id === entry.id);
  if (index === -1) return json({ error: "Entry not found" }, 404);

  entries[index] = buildEntry(entry, entry.id);
  const updated = JSON.stringify({ entries });
  await env.LOGBOOK_KV.put(KV_KEY, updated);

  return new Response(updated, {
    headers: { "Content-Type": "application/json" },
  });
}
