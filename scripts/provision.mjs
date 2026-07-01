/**
 * Provision my-limn logbook infrastructure.
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   cp .env.example .env   # fill in values
 *   node scripts/provision.mjs
 *
 * Required env vars (in .env or environment):
 *   CLOUDFLARE_API_TOKEN   — CF API token with Workers KV + Pages edit permissions
 *   CLOUDFLARE_ACCOUNT_ID  — your CF account ID
 *   CF_PAGES_PROJECT       — Cloudflare Pages project name (e.g. "my-limn")
 *   ADMIN_KEY              — secret used by the admin page to authenticate writes
 */

import { spawnSync }                       from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, dirname }                   from "node:path";
import { fileURLToPath }                   from "node:url";

const __dirname   = dirname(fileURLToPath(import.meta.url));
const ROOT        = join(__dirname, "..");
const ENV_PATH    = join(ROOT, ".env");
const GIST_URL    = "https://gist.githubusercontent.com/ravendarque/4faba593347556de3a362d980e4811b8/raw/logbook.json";
const KV_KEY      = "logbook:entries";
const KV_BINDING  = "LOGBOOK_KV";

// ── .env loader ───────────────────────────────────────────────────────────────

function loadEnv() {
  if (!existsSync(ENV_PATH)) return;
  for (const line of readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val   = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (key && val && !process.env[key]) process.env[key] = val;
  }
}

// ── Logging ───────────────────────────────────────────────────────────────────

function step(label) { console.log(`\n── ${label}`); }
function ok(msg)     { console.log(`   ✓ ${msg}`); }
function warn(msg)   { console.log(`   ⚠ ${msg}`); }
function die(msg)    { console.error(`\n✗ ${msg}`); process.exit(1); }

// ── Process helpers ───────────────────────────────────────────────────────────

function run(args, { input } = {}) {
  const [cmd, ...rest] = args;
  const r = spawnSync(cmd, rest, {
    encoding: "utf-8",
    stdio: input !== undefined ? ["pipe", "pipe", "pipe"] : ["inherit", "pipe", "pipe"],
    input,
    env: process.env,
  });
  if (r.status !== 0) die(`Command failed: ${args.join(" ")}\n${r.stderr || r.stdout}`);
  return (r.stdout ?? "").trim();
}

function runIdempotent(args, { input, alreadyHints = [] } = {}) {
  const [cmd, ...rest] = args;
  const r = spawnSync(cmd, rest, {
    encoding: "utf-8",
    stdio: input !== undefined ? ["pipe", "pipe", "pipe"] : ["inherit", "pipe", "pipe"],
    input,
    env: process.env,
  });
  if (r.status === 0) return true;
  const out = ((r.stdout ?? "") + (r.stderr ?? "")).toLowerCase();
  if (alreadyHints.some(h => out.includes(h.toLowerCase()))) return false; // already existed
  die(`Command failed: ${args.join(" ")}\n${r.stderr || r.stdout}`);
}

// ── Cloudflare API ────────────────────────────────────────────────────────────

const CF_BASE = "https://api.cloudflare.com/client/v4";

async function cfApi(method, path, body) {
  const res = await fetch(`${CF_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!data.success) {
    die(`CF API ${method} ${path} failed:\n${JSON.stringify(data.errors, null, 2)}`);
  }
  return data.result;
}

// PUT a raw value directly into KV (avoids CLI arg-length limits)
async function kvPut(accountId, namespaceId, key, value) {
  const res = await fetch(
    `${CF_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: value,
    }
  );
  const data = await res.json();
  if (!data.success) {
    die(`KV put failed:\n${JSON.stringify(data.errors, null, 2)}`);
  }
}

async function kvGet(accountId, namespaceId, key) {
  const res = await fetch(
    `${CF_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
    { headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` } }
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.text();
}

// ── Provision steps ───────────────────────────────────────────────────────────

async function ensureKvNamespace(accountId) {
  step("KV namespace");
  const namespaces = await cfApi("GET", `/accounts/${accountId}/storage/kv/namespaces?per_page=100`);
  const existing = namespaces.find(ns => ns.title === KV_BINDING);
  if (existing) {
    ok(`${KV_BINDING} already exists (${existing.id})`);
    return existing.id;
  }
  const ns = await cfApi("POST", `/accounts/${accountId}/storage/kv/namespaces`, { title: KV_BINDING });
  ok(`Created ${KV_BINDING} (${ns.id})`);
  return ns.id;
}

async function ensureKvBinding(accountId, projectName, namespaceId) {
  step("Pages KV binding");
  const project = await cfApi("GET", `/accounts/${accountId}/pages/projects/${projectName}`);
  const prodCfg = project.deployment_configs?.production ?? {};

  if (prodCfg.kv_namespaces?.[KV_BINDING]?.namespace_id === namespaceId) {
    ok(`${KV_BINDING} binding already set`);
    return;
  }

  await cfApi("PATCH", `/accounts/${accountId}/pages/projects/${projectName}`, {
    deployment_configs: {
      production: {
        ...prodCfg,
        kv_namespaces: {
          ...(prodCfg.kv_namespaces ?? {}),
          [KV_BINDING]: { namespace_id: namespaceId },
        },
      },
      preview: project.deployment_configs?.preview ?? {},
    },
  });
  ok(`${KV_BINDING} → ${namespaceId}`);
}

function ensureAdminSecret(projectName, adminKey) {
  step("ADMIN_KEY secret");
  runIdempotent(
    ["npx", "--yes", "wrangler", "pages", "secret", "put", "ADMIN_KEY", "--project-name", projectName],
    { input: `${adminKey}\n`, alreadyHints: ["already exists"] }
  );
  ok("ADMIN_KEY set");
}

async function seedKv(accountId, namespaceId) {
  step("Seed KV");
  const existing = await kvGet(accountId, namespaceId, KV_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (parsed?.entries?.length > 0) {
        ok(`Already seeded (${parsed.entries.length} entries) — skipping`);
        return;
      }
    } catch {}
  }

  const res = await fetch(GIST_URL);
  if (!res.ok) die(`Failed to fetch gist: ${res.status}`);
  const { entries } = await res.json();
  const payload = JSON.stringify({ entries });

  await kvPut(accountId, namespaceId, KV_KEY, payload);
  ok(`Seeded ${entries.length} entries`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Provisioning my-limn logbook…");

  loadEnv();

  const REQUIRED = ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CF_PAGES_PROJECT", "ADMIN_KEY"];
  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length) {
    die(`Missing required variables:\n  ${missing.join("\n  ")}\n\nCopy .env.example to .env and fill in the values.`);
  }

  const accountId   = process.env.CLOUDFLARE_ACCOUNT_ID;
  const projectName = process.env.CF_PAGES_PROJECT;
  const adminKey    = process.env.ADMIN_KEY;

  const namespaceId = await ensureKvNamespace(accountId);
  await ensureKvBinding(accountId, projectName, namespaceId);
  ensureAdminSecret(projectName, adminKey);
  await seedKv(accountId, namespaceId);

  console.log(`
──────────────────────────────────────────
✓ Done.

  /logbook        reads from KV via Pages Function
  /logbook/admin  add entries with your ADMIN_KEY

Re-run anytime — all steps are idempotent.
──────────────────────────────────────────`);
}

main().catch(err => { console.error(err); process.exit(1); });
