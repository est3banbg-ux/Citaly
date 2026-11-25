// Genera una página real (con título, descripción y vista previa propios) para cada negocio
// en citalyapp.com/<slug>/ y actualiza sitemap.xml. Lo corre .github/workflows/seo.yml.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ORIGIN = "https://citalyapp.com";
const RESERVED = new Set(["app","admin","r","w","demo","www","api","citaly","ayuda","precios","login","privacidad","terminos","img","docs","eliminar-datos","webhook","404","tools"]);
const MANIFEST = path.join(ROOT, "tools", "seo-slugs.json");
const FIRESTORE = "https://firestore.googleapis.com/v1/projects/citaly-cb101/databases/(default)/documents/pub";

const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const clip = (s, n) => { s = String(s ?? "").replace(/\s+/g," ").trim(); return s.length > n ? s.slice(0, n-1).trimEnd() + "…" : s; };

function val(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return +v.integerValue;
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, val(x)]));
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(val);
  return null;
}

async function loadPub() {
  if (process.env.SEO_FIXTURE) return JSON.parse(fs.readFileSync(process.env.SEO_FIXTURE, "utf8"));
  const out = []; let token = "";
  do {
    const r = await fetch(`${FIRESTORE}?pageSize=300${token ? "&pageToken=" + encodeURIComponent(token) : ""}`);
    if (!r.ok) throw new Error("Firestore " + r.status);
    const j = await r.json();
    for (const d of j.documents || []) out.push({ slug: d.name.split("/").pop(), ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, val(v)])) });
    token = j.nextPageToken || "";
  } while (token);
  return out;
}

const tpl = fs.readFileSync(path.join(ROOT, "w", "index.html"), "utf8");
const SLUG_LINE = 'var slug=(new URLSearchParams(location.search).get("n")||"")';
if (!tpl.includes(SLUG_LINE) || !tpl.includes("<title>Cargando…</title>") || !tpl.includes('<meta name="description" content="">')) throw new Error("w/index.html cambió: revisar gen-seo.mjs");

function page(P) {
  const slug = P.slug, name = clip(P.name || slug, 60);
  const desc = clip((P.web && P.web.seo) || P.blurb || P.tagline || `Reserva tu cita en ${name}`, 160);
  const title = clip(name + (P.tagline ? " · " + P.tagline : ""), 70);
  const url = `${ORIGIN}/${slug}/`;
  const logo = typeof P.logo === "string" && /^https:\/\//.test(P.logo) ? P.logo : `${ORIGIN}/img/og-citaly.png`;
  const ld = { "@context": "https://schema.org", "@type": "LocalBusiness", name, description: desc, url };
  if (P.wa) ld.telephone = "+" + String(P.wa).replace(/\D/g, "");
  if (P.addr) ld.address = String(P.addr);
  const head =
    `<link rel="canonical" href="${url}">\n` +
    `<meta property="og:type" content="website"><meta property="og:locale" content="es_CR">\n` +
    `<meta property="og:site_name" content="${esc(name)}"><meta property="og:url" content="${url}">\n` +
    `<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">\n` +
    `<meta property="og:image" content="${esc(logo)}">\n` +
    `<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">\n` +
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
  return tpl
    .replace("<title>Cargando…</title>", () => `<title>${esc(title)}</title>`)
    .replace('<meta name="description" content="">', () => `<meta name="description" content="${esc(desc)}">\n${head}`)
    .replace(SLUG_LINE, () => `var slug=(new URLSearchParams(location.search).get("n")||${JSON.stringify(slug)})`);
}

const all = await loadPub();
const ok = all.filter(P => /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(P.slug) && !RESERVED.has(P.slug) && P.name);
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const prev = (fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : []).filter(x => SLUG_RE.test(x) && !RESERVED.has(x));
const now = ok.map(P => P.slug).sort();

for (const P of ok) {
  const dir = path.join(ROOT, P.slug);
  if (fs.existsSync(dir) && !prev.includes(P.slug)) { console.log("omitido (carpeta existente):", P.slug); now.splice(now.indexOf(P.slug), 1); continue; }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page(P));
}
for (const s of prev) if (!now.includes(s)) fs.rmSync(path.join(ROOT, s), { recursive: true, force: true });
fs.writeFileSync(MANIFEST, JSON.stringify(now, null, 1) + "\n");

const smPath = path.join(ROOT, "sitemap.xml");
let sm = fs.readFileSync(smPath, "utf8").replace(/\s*<url><loc>https:\/\/citalyapp\.com\/[a-z0-9-]+\/<\/loc><changefreq>monthly<\/changefreq><priority>0\.6<\/priority><\/url>/g, "");
sm = sm.replace("</urlset>", now.map(s => `  <url><loc>${ORIGIN}/${s}/</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`).join("") + "</urlset>");
fs.writeFileSync(smPath, sm);
console.log("páginas:", now.length);
