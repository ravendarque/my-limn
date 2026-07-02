import { createSessionCookie, clearSessionCookie } from "../_lib/auth.js";

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.key || body.key !== env.ADMIN_KEY) {
    return json({ error: "Invalid key" }, 401);
  }

  const cookie = await createSessionCookie(env.ADMIN_KEY);
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}

export async function onRequestDelete() {
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
}
