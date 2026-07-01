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
  const key = request.headers.get("X-Admin-Key");
  if (!key || key !== env.ADMIN_KEY) {
    return json({ error: "Unauthorized" }, 401);
  }

  let entry;
  try {
    entry = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  for (const field of ["place", "name", "grade", "type", "status"]) {
    if (!entry[field]) return json({ error: `Missing required field: ${field}` }, 400);
  }
  if (!VALID_TYPES.includes(entry.type)) {
    return json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` }, 400);
  }
  if (!VALID_STATUSES.includes(entry.status)) {
    return json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, 400);
  }

  const newEntry = {
    id:     generateId(entry.place, entry.name),
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

  const raw = await env.LOGBOOK_KV.get(KV_KEY);
  const { entries = [] } = raw ? JSON.parse(raw) : {};

  // Avoid ID collision (same place+name entered twice)
  if (entries.some(e => e.id === newEntry.id)) {
    newEntry.id = `${newEntry.id}-${Date.now()}`;
  }

  entries.push(newEntry);
  const updated = JSON.stringify({ entries });
  await env.LOGBOOK_KV.put(KV_KEY, updated);

  return new Response(updated, {
    headers: { "Content-Type": "application/json" },
  });
}
