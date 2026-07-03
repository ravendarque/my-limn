// docs/ holds internal research notes, not site content — block public access.
// Functions take precedence over static assets in Pages routing, so this
// reliably 404s the raw files regardless of any static-asset exclusion rules.
export async function onRequest() {
  return new Response("Not found", { status: 404 });
}
