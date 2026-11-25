// Genera una página real (con título, descripción, contenido y vista previa propios) para cada negocio
// en citalyapp.com/<slug>/ y actualiza sitemap.xml. Lo corre .github/workflows/seo.yml.
//
// Qué hace distinto a una página "buena" de una "vacía":
//  - El HTML ya trae el nombre, la descripción, los servicios y las zonas (no solo se pinta con JavaScript).
//  - Solo se pide indexar a Google las páginas con contenido real (ver MIN). Las demás llevan noindex y no van al sitemap.
//  - Las demos y pruebas que no deben salir en Google se listan en tools/seo-noindex.json.
//  - El sitemap lleva la fecha real del último cambio (lastmod).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ORIGIN = "https://citalyapp.com";
const RESERVED = new Set(["app","admin","r","w","demo","www","api","citaly","ayuda","precios","login","privacidad","terminos","img","docs","eliminar-datos","webhook","404","tools","para"]);
const MANIFEST = path.join(ROOT, "tools", "seo-slugs.json");
const LASTMOD = path.join(ROOT, "tools", "seo-lastmod.json");
const NOINDEX = path.join(ROOT, "tools", "seo-noindex.json");
const FIRESTORE = "https://firestore.googleapis.com/v1/projects/citaly-cb101/databases/(default)/documents/pub";
// Mínimos para pedirle a Google que indexe la página de un negocio (si no, queda con noindex).
const MIN = { fotos: 4, servicios: 3, palabras: 80 };
// Tipo de negocio -> tipo de schema.org (si no está aquí, LocalBusiness)
const SCHEMA = { lavacar: "AutoWash", taller: "AutoRepair", detailing: "AutomotiveBusiness", pulido: "AutomotiveBusiness", polarizado: "AutomotiveBusiness", autos: "AutomotiveBusiness" };
const TYPE_NAME = { lavacar: "Lavacar", detailing: "Detailing", pulido: "Pulido de focos y vidrios", polarizado: "Polarizado", taller: "Taller", autos: "Cuidado de autos" };

const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const clip = (s, n) => { s = String(s ?? "").replace(/\s+/g," ").trim(); return s.length > n ? s.slice(0, n-1).trimEnd() + "…" : s; };
const today = new Date().toISOString().slice(0, 10);

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

async function countFotos(slug) {
  try {
    const r = await fetch(`${FIRESTORE}/${encodeURIComponent(slug)}/fotos?pageSize=20&mask.fieldPaths=i`);
    if (!r.ok) return 0;
    const j = await r.json();
    return (j.documents || []).length;
  } catch { return 0; }
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
  for (const P of out) if (P._fotos == null) P._fotos = await countFotos(P.slug);
  return out;
}

// Junta todos los textos propios del negocio (para medir si la página tiene contenido real)
function textos(v, acc = []) {
  if (typeof v === "string") acc.push(v);
  else if (Array.isArray(v)) v.forEach(x => textos(x, acc));
  else if (v && typeof v === "object") Object.values(v).forEach(x => textos(x, acc));
  return acc;
}
function palabras(P) {
  const W = P.web || {};
  const t = [P.blurb, P.tagline, W.about, W.seo, W.homeNote, W.svcNote, W.why, W.steps, W.faqs, W.reviews].flatMap(x => textos(x)).join(" ");
  return t.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}
const svcNames = P => (Array.isArray(P.services) ? P.services : []).map(s => s && s.n).filter(Boolean);
const zoneNames = P => (Array.isArray(P.zones) ? P.zones : []).map(z => z && z.n).filter(Boolean);

// ¿Se le pide a Google que indexe esta página? Devuelve { index, motivo }
function evaluar(P, manual) {
  if (manual.has(P.slug)) return { index: false, motivo: "en seo-noindex.json" };
  if (P.open === false) return { index: false, motivo: "negocio cerrado o sin plan activo" };
  const falta = [];
  if (!(typeof P.logo === "string" && /^https:\/\//.test(P.logo))) falta.push("logo propio");
  if ((P._fotos || 0) < MIN.fotos) falta.push(`fotos (${P._fotos || 0}/${MIN.fotos})`);
  if (svcNames(P).length < MIN.servicios) falta.push(`servicios (${svcNames(P).length}/${MIN.servicios})`);
  const w = palabras(P);
  if (w < MIN.palabras) falta.push(`texto propio (${w}/${MIN.palabras} palabras)`);
  return falta.length ? { index: false, motivo: "falta: " + falta.join(", ") } : { index: true, motivo: "ok" };
}

function tel(wa) {
  const d = String(wa || "").replace(/\D/g, "");
  if (d.length === 8) return "+506" + d;
  if (d.length === 11 && d.startsWith("506")) return "+" + d;
  return d.length >= 10 ? "+" + d : "";
}

const tpl = fs.readFileSync(path.join(ROOT, "w", "index.html"), "utf8");
const SLUG_LINE = 'var slug=(new URLSearchParams(location.search).get("n")||"")';
const LOAD = '<div id="load" style="padding:120px 0"><div class="spin"></div></div>';
if (!tpl.includes(SLUG_LINE) || !tpl.includes("<title>Cargando…</title>") || !tpl.includes('<meta name="description" content="">') || !tpl.includes(LOAD)) throw new Error("w/index.html cambió: revisar gen-seo.mjs");

function page(P, ev) {
  const slug = P.slug, name = clip(P.name || slug, 60);
  const desc = clip((P.web && P.web.seo) || P.blurb || P.tagline || `Reserva tu cita en ${name}`, 160);
  const title = clip(name + (P.tagline ? " · " + P.tagline : ""), 70);
  const url = `${ORIGIN}/${slug}/`;
  const logo = typeof P.logo === "string" && /^https:\/\//.test(P.logo) ? P.logo : `${ORIGIN}/img/og-citaly.png`;
  const zonas = zoneNames(P), servs = svcNames(P);
  const ld = { "@context": "https://schema.org", "@type": SCHEMA[P.type] || "LocalBusiness", name, description: desc, url };
  if (logo !== `${ORIGIN}/img/og-citaly.png`) ld.image = logo;
  const t = tel(P.wa); if (t) ld.telephone = t;
  if (P.addr) ld.address = { "@type": "PostalAddress", streetAddress: String(P.addr), addressCountry: "CR" };
  if (zonas.length) ld.areaServed = zonas.slice(0, 12);
  if (servs.length) ld.knowsAbout = servs.slice(0, 12);
  const robots = ev.index ? "index,follow,max-image-preview:large" : "noindex,follow";
  const head =
    `<meta name="robots" content="${robots}">\n` +
    `<link rel="canonical" href="${url}">\n` +
    `<meta property="og:type" content="website"><meta property="og:locale" content="es_CR">\n` +
    `<meta property="og:site_name" content="${esc(name)}"><meta property="og:url" content="${url}">\n` +
    `<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">\n` +
    `<meta property="og:image" content="${esc(logo)}">\n` +
    `<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">\n` +
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
  // Contenido que ya viene en el HTML (se ve mientras carga y lo lee Google sin ejecutar JavaScript).
  // Cuando la app termina de cargar, este bloque se oculta solo (#load se esconde).
  const kind = TYPE_NAME[P.type] ? `<p>${esc(TYPE_NAME[P.type])}${P.addr ? " · " + esc(clip(P.addr, 90)) : ""}</p>` : (P.addr ? `<p>${esc(clip(P.addr, 90))}</p>` : "");
  const pre =
    `<div id="load" style="padding:120px 0"><div class="spin"></div>` +
    `<div style="max-width:620px;margin:28px auto 0;padding:0 18px;text-align:center">` +
    `<h1 style="font-size:22px;margin:0 0 8px">${esc(name)}</h1>${kind}` +
    `<p>${esc(desc)}</p>` +
    (servs.length ? `<p><b>Servicios:</b> ${esc(servs.slice(0, 10).join(", "))}</p>` : "") +
    (zonas.length ? `<p><b>Zonas:</b> ${esc(zonas.slice(0, 10).join(", "))}</p>` : "") +
    `</div></div>`;
  return tpl
    .replace("<title>Cargando…</title>", () => `<title>${esc(title)}</title>`)
    .replace('<meta name="description" content="">', () => `<meta name="description" content="${esc(desc)}">\n${head}`)
    .replace(LOAD, () => pre)
    .replace(SLUG_LINE, () => `var slug=(new URLSearchParams(location.search).get("n")||${JSON.stringify(slug)})`);
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const manual = new Set((fs.existsSync(NOINDEX) ? JSON.parse(fs.readFileSync(NOINDEX, "utf8")) : []).filter(x => SLUG_RE.test(x)));
const all = await loadPub();
const ok = all.filter(P => SLUG_RE.test(P.slug) && !RESERVED.has(P.slug) && P.name);
const prev = (fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : []).filter(x => SLUG_RE.test(x) && !RESERVED.has(x));
const lm = fs.existsSync(LASTMOD) ? JSON.parse(fs.readFileSync(LASTMOD, "utf8")) : {};
const now = ok.map(P => P.slug).sort();
const indexables = [];

for (const P of ok) {
  const dir = path.join(ROOT, P.slug);
  if (fs.existsSync(dir) && !prev.includes(P.slug)) { console.log("omitido (carpeta existente):", P.slug); now.splice(now.indexOf(P.slug), 1); continue; }
  const ev = evaluar(P, manual);
  const html = page(P, ev);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  const h = crypto.createHash("sha1").update(html).digest("hex");
  if (!lm[P.slug] || lm[P.slug].h !== h) lm[P.slug] = { h, d: today };
  console.log((ev.index ? "INDEXAR  " : "noindex  ") + P.slug + "  (" + ev.motivo + ")");
  if (ev.index) indexables.push(P.slug);
}
for (const s of prev) if (!now.includes(s)) { fs.rmSync(path.join(ROOT, s), { recursive: true, force: true }); delete lm[s]; }
fs.writeFileSync(MANIFEST, JSON.stringify(now, null, 1) + "\n");
fs.writeFileSync(LASTMOD, JSON.stringify(lm, null, 1) + "\n");

const smPath = path.join(ROOT, "sitemap.xml");
let sm = fs.readFileSync(smPath, "utf8").replace(/\s*<url><loc>https:\/\/citalyapp\.com\/[a-z0-9-]+\/<\/loc>(?:<lastmod>[^<]*<\/lastmod>)?<changefreq>monthly<\/changefreq><priority>0\.6<\/priority><\/url>/g, "");
sm = sm.replace("</urlset>", indexables.map(s => `  <url><loc>${ORIGIN}/${s}/</loc><lastmod>${lm[s].d}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`).join("") + "</urlset>");
fs.writeFileSync(smPath, sm);
console.log("páginas:", now.length, "· en el sitemap:", indexables.length);
