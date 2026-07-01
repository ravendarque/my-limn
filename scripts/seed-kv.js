// One-off migration: pulls logbook.json from the Gist and seeds it into KV.
// Usage:
//   1. wrangler kv:namespace create LOGBOOK_KV  (note the namespace ID)
//   2. node scripts/seed-kv.js <namespace-id>

const GIST_URL =
  "https://gist.githubusercontent.com/ravendarque/4faba593347556de3a362d980e4811b8/raw/logbook.json";
const KV_KEY = "logbook:entries";

const namespaceId = process.argv[2];
if (!namespaceId) {
  console.error("Usage: node scripts/seed-kv.js <namespace-id>");
  process.exit(1);
}

const res = await fetch(GIST_URL);
if (!res.ok) throw new Error(`Failed to fetch gist: ${res.status}`);
const { entries } = await res.json();

const payload = JSON.stringify({ entries });

const { execSync } = await import("node:child_process");
execSync(
  `wrangler kv:key put "${KV_KEY}" --namespace-id=${namespaceId}`,
  { input: payload, stdio: ["pipe", "inherit", "inherit"] }
);

console.log(`✅ Seeded ${entries.length} entries into KV (key: ${KV_KEY})`);
