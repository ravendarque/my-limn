/**
 * Provision my-limn logbook infrastructure.
 * Idempotent — safe to re-run. Interactive — prompts for anything not
 * already in the environment, and never writes secrets to disk.
 *
 * Usage:
 *   node scripts/provision.mjs
 *
 * Prompts (leave blank to skip the step that depends on it):
 *   CLOUDFLARE_API_TOKEN   — CF API token with Workers KV + Pages edit permissions
 *   CLOUDFLARE_ACCOUNT_ID  — your CF account ID
 *   CF_PAGES_PROJECT       — Cloudflare Pages project name (e.g. "my-limn")
 *   ADMIN_KEY              — secret used by the admin page to authenticate writes
 *
 * Any of these can also be pre-set as real environment variables (e.g. in CI)
 * to skip the matching prompt.
 */

import { createInterface } from "node:readline";

const GIST_URL   = "https://gist.githubusercontent.com/ravendarque/4faba593347556de3a362d980e4811b8/raw/logbook.json";
const KV_KEY     = "logbook:entries";
const KV_BINDING = "LOGBOOK_KV";

// ── Logging ───────────────────────────────────────────────────────────────────

function step(label) { console.log(`\n── ${label}`); }
function ok(msg)     { console.log(`   ✓ ${msg}`); }
function skip(msg)   { console.log(`   – ${msg} (skipped)`); }
function warn(msg)   { console.log(`   ⚠ ${msg}`); }
function die(msg)    { console.error(`\n✗ ${msg}`); process.exit(1); }

// ── Interactive prompts (never echo secrets, never write to disk) ────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

// Masked prompt for secrets — echoes "*" per keystroke instead of the value.
function askSecret(question) {
  return new Promise(resolve => {
    const stdin = process.stdin;
    process.stdout.write(question);
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = char => {
      if (char === "\n" || char === "\r" || char === "") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(value.trim());
        return;
      }
      if (char === "") { process.stdout.write("\n"); process.exit(130); } // Ctrl-C
      if (char === "") { value = value.slice(0, -1); return; } // backspace
      value += char;
      process.stdout.write("*");
    };

    stdin.on("data", onData);
  });
}

async function resolveVar(name, { secret = false, prompt } = {}) {
  if (process.env[name]) return process.env[name]; // pre-set (e.g. CI) wins, no prompt
  const value = secret ? await askSecret(`${prompt}: `) : await ask(`${prompt}: `);
  return value || null;
}

// ── Cloudflare API ────────────────────────────────────────────────────────────

const CF_BASE = "https://api.cloudflare.com/client/v4";

async function cfApi(apiToken, method, path, body) {
  const res = await fetch(`${CF_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
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

async function kvPut(apiToken, accountId, namespaceId, key, value) {
  const res = await fetch(
    `${CF_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
      body: value,
    }
  );
  const data = await res.json();
  if (!data.success) die(`KV put failed:\n${JSON.stringify(data.errors, null, 2)}`);
}

async function kvGet(apiToken, accountId, namespaceId, key) {
  const res = await fetch(
    `${CF_BASE}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
    { headers: { Authorization: `Bearer ${apiToken}` } }
  );
  if (!res.ok) return null;
  return res.text();
}

// ── Provision steps ───────────────────────────────────────────────────────────

async function ensureKvNamespace(apiToken, accountId) {
  step("KV namespace");
  const namespaces = await cfApi(apiToken, "GET", `/accounts/${accountId}/storage/kv/namespaces?per_page=100`);
  const existing = namespaces.find(ns => ns.title === KV_BINDING);
  if (existing) {
    ok(`${KV_BINDING} already exists (${existing.id})`);
    return existing.id;
  }
  const ns = await cfApi(apiToken, "POST", `/accounts/${accountId}/storage/kv/namespaces`, { title: KV_BINDING });
  ok(`Created ${KV_BINDING} (${ns.id})`);
  return ns.id;
}

async function ensureKvBinding(apiToken, accountId, projectName, namespaceId) {
  step("Pages KV binding");
  if (!projectName) { skip("CF_PAGES_PROJECT not provided"); return; }

  const project = await cfApi(apiToken, "GET", `/accounts/${accountId}/pages/projects/${projectName}`);
  const prodCfg = project.deployment_configs?.production ?? {};

  if (prodCfg.kv_namespaces?.[KV_BINDING]?.namespace_id === namespaceId) {
    ok(`${KV_BINDING} binding already set`);
    return;
  }

  await cfApi(apiToken, "PATCH", `/accounts/${accountId}/pages/projects/${projectName}`, {
    deployment_configs: {
      production: {
        ...prodCfg,
        kv_namespaces: { ...(prodCfg.kv_namespaces ?? {}), [KV_BINDING]: { namespace_id: namespaceId } },
      },
      preview: project.deployment_configs?.preview ?? {},
    },
  });
  ok(`${KV_BINDING} → ${namespaceId}`);
}

async function ensureAdminSecret(apiToken, accountId, projectName, adminKey) {
  step("ADMIN_KEY secret");
  if (!projectName) { skip("CF_PAGES_PROJECT not provided"); return; }
  if (!adminKey)     { skip("ADMIN_KEY not provided — leaving existing value untouched"); return; }

  const project = await cfApi(apiToken, "GET", `/accounts/${accountId}/pages/projects/${projectName}`);
  const prodCfg = project.deployment_configs?.production ?? {};

  await cfApi(apiToken, "PATCH", `/accounts/${accountId}/pages/projects/${projectName}`, {
    deployment_configs: {
      production: {
        ...prodCfg,
        env_vars: { ...(prodCfg.env_vars ?? {}), ADMIN_KEY: { value: adminKey, type: "secret_text" } },
      },
      preview: project.deployment_configs?.preview ?? {},
    },
  });
  ok("ADMIN_KEY set");
}

async function seedKv(apiToken, accountId, namespaceId) {
  step("Seed KV");
  const existing = await kvGet(apiToken, accountId, namespaceId, KV_KEY);
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
  await kvPut(apiToken, accountId, namespaceId, KV_KEY, JSON.stringify({ entries }));
  ok(`Seeded ${entries.length} entries`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Provisioning my-limn logbook…\n");
  console.log("Leave any prompt blank to skip the step(s) that need it.");

  const apiToken   = await resolveVar("CLOUDFLARE_API_TOKEN", { secret: true, prompt: "Cloudflare API token" });
  const accountId  = await resolveVar("CLOUDFLARE_ACCOUNT_ID", { prompt: "Cloudflare account ID" });

  if (!apiToken || !accountId) {
    rl.close();
    die("Cloudflare API token and account ID are both required — nothing to provision without them.");
  }

  const projectName = await resolveVar("CF_PAGES_PROJECT", { prompt: "Cloudflare Pages project name" });
  const adminKey     = await resolveVar("ADMIN_KEY", { secret: true, prompt: "Admin key (blank = leave unchanged)" });

  rl.close();

  const namespaceId = await ensureKvNamespace(apiToken, accountId);
  await ensureKvBinding(apiToken, accountId, projectName, namespaceId);
  await ensureAdminSecret(apiToken, accountId, projectName, adminKey);
  await seedKv(apiToken, accountId, namespaceId);

  console.log(`
──────────────────────────────────────────
✓ Done.

  /logbook  browse + log in with your ADMIN_KEY to add/edit entries

Re-run anytime — all steps are idempotent, and nothing is written to disk.
──────────────────────────────────────────`);
}

main().catch(err => { console.error(err); process.exit(1); });
