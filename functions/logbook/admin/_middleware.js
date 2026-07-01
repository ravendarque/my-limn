export async function onRequest({ request, env, next }) {
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded  = atob(auth.slice(6));
    const password = decoded.slice(decoded.indexOf(":") + 1);
    if (password === env.ADMIN_KEY) return next();
  }
  return new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Logbook Admin"' },
  });
}
