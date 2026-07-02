import { isAuthed } from "../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const loggedIn = await isAuthed(request, env);
  return new Response(JSON.stringify({ loggedIn }), {
    headers: { "Content-Type": "application/json" },
  });
}
