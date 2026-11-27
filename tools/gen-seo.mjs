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
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ORIGIN = "https://citalyapp.com";
const RESERVED = new Set(["app","admin","r","w","demo","www","api","citaly","ayuda","precios","login","privacidad","terminos","img","docs","eliminar-datos","webhook","404","tools","para","descargar","android"]);
const MANIFEST = path.join(ROOT, "tools", "seo-slugs.json");
const LASTMOD = path.join(ROOT, "tools", "seo-lastmod.json");
const NOINDEX = path.join(ROOT, "tools", "seo-noindex.json");
const FIRESTORE = "https://firestore.googleapis.com/v1/projects/citaly-cb101/databases/(default)/documents/pub";
// Para pedirle a Google que indexe la página de un negocio nuevo necesita: 3 servicios o más
// Y al menos una señal de que es un negocio real: 1 foto, logo propio, 30 palabras propias o zonas/dirección.
// Una página que ya estaba en el sitemap NO baja a noindex por estos criterios (solo por cierre, suspensión o lista manual).
const MIN = { servicios: 3, palabras: 30 };
// Frenos: si algo raro pasa con los datos, el generador se detiene en vez de borrar o des-indexar páginas.
const MAX_BAJA = 0.3, MIN_RESTO = 0.5;
// Textos de ejemplo que la app pone al crear una cuenta: no cuentan como texto propio del negocio.
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "cfg.js"), "utf8") + "\n;this.__C = CITALY;", ctx);
const CFG = ctx.__C;
const WHY = ["Reserva en 1 minuto", "Elige tu servicio y tu hora desde el celular, sin esperar respuestas.", "Precios claros", "Ves cuánto cuesta cada servicio antes de reservar.", "Confirmación por WhatsApp", "Te confirmamos y te recordamos tu cita para que no se te pase."];
function plantilla(type) {
  const t = (CFG.tpl || {})[type] || {};
  return new Set([t.tag, t.blurb, ...(t.faq || []).flat(), ...WHY].filter(Boolean).map(x => String(x).trim()));
}
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

async function infoFotos(slug) {
  // Si la consulta falla, se detiene todo: contar 0 fotos por un fallo pasajero mandaría páginas buenas a noindex.
  const r = await fetch(`${FIRESTORE}/${encodeURIComponent(slug)}/fotos?pageSize=20&mask.fieldPaths=i&mask.fieldPaths=ba`);
  if (!r.ok) throw new Error("Firestore fotos " + slug + " " + r.status);
  const j = await r.json();
  const docs = (j.documents || []).map(d => ({ id: d.name.split("/").pop(), t: d.updateTime || "", i: +(val((d.fields || {}).i) ?? 0) || 0, ba: !!val((d.fields || {}).ba) }));
  // Para la imagen de vista previa: la primera foto normal; si solo hay «antes y después», la primera de esas.
  docs.sort((a, b) => (a.ba - b.ba) || (a.i - b.i));
  return { n: docs.length, first: docs[0] || null };
}
// Imagen para la vista previa del link (WhatsApp, Facebook, TikTok): portada propia > primera foto > ninguna (tarjeta con logo o inicial).
// Devuelve { key, ba, get }: `key` identifica la imagen SIN bajarla (para saber si cambió) y `get()` la trae solo cuando hay que
// redibujar. Así no se gasta la cuota de Firestore bajando las fotos de todos los negocios en cada corrida.
// Si la foto no se puede leer no se detiene nada: get() devuelve fail y se conserva la imagen que ya había.
function fuenteOG(P) {
  const c = P.web && P.web.cover, esImg = x => typeof x === "string" && /^(data:image\/|https:\/\/)/.test(x);
  if (esImg(c)) return { key: c, ba: false, get: async () => ({ img: c }) };
  if (esImg(P._foto)) return { key: P._foto, ba: !!P._fotoBa, get: async () => ({ img: P._foto }) };
  const f = P._foto1;
  if (!f || process.env.SEO_FIXTURE) return { key: "", ba: false, get: async () => ({ img: "" }) };
  return { key: `foto:${f.id}:${f.t}`, ba: f.ba, get: async () => {
    try {
      const r = await fetch(`${FIRESTORE}/${encodeURIComponent(P.slug)}/fotos/${encodeURIComponent(f.id)}?mask.fieldPaths=img`, { signal: AbortSignal.timeout(20000) });
      if (r.status === 404) return { img: "" };
      if (!r.ok) return { img: "", fail: true };
      const img = val(((await r.json()).fields || {}).img);
      return esImg(img) ? { img } : { img: "" };
    } catch (e) { return { img: "", fail: true }; }
  } };
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
  for (const P of out) if (P._fotos == null) { const f = await infoFotos(P.slug); P._fotos = f.n; P._foto1 = f.first; }
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
  const W = P.web || {}, ej = plantilla(P.type);
  const t = [P.blurb, P.tagline, W.about, W.seo, W.homeNote, W.svcNote, W.why, W.steps, W.faqs, W.reviews].flatMap(x => textos(x)).filter(x => !ej.has(x.trim())).join(" ");
  return t.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}
const tieneLogo = P => typeof P.logo === "string" && /^(https:\/\/|data:image\/)/.test(P.logo);
const svcNames = P => (Array.isArray(P.services) ? P.services : []).map(s => s && s.n).filter(Boolean);
const zoneNames = P => (Array.isArray(P.zones) ? P.zones : []).map(z => z && z.n).filter(Boolean);

// ¿Se le pide a Google que indexe esta página? Devuelve { index, motivo }
function evaluar(P, manual, yaIndexada) {
  if (manual.has(P.slug)) return { index: false, motivo: "en seo-noindex.json", baja: yaIndexada };
  if (P.open === false) return { index: false, motivo: "negocio cerrado o sin plan activo", baja: yaIndexada };
  if (yaIndexada) return { index: true, motivo: "ya estaba en el sitemap" };
  const n = svcNames(P).length;
  if (n < MIN.servicios) return { index: false, motivo: `faltan servicios (${n}/${MIN.servicios})` };
  const w = palabras(P), senales = [];
  if ((P._fotos || 0) >= 1) senales.push("foto");
  if (tieneLogo(P)) senales.push("logo");
  if (w >= MIN.palabras) senales.push(`${w} palabras propias`);
  if (zoneNames(P).length || P.addr) senales.push("zonas o dirección");
  return senales.length ? { index: true, motivo: "ok: " + senales.join(", ") } : { index: false, motivo: `sin señales de negocio real (${w}/${MIN.palabras} palabras propias, sin foto, logo ni zonas)` };
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

function page(P, ev, og) {
  const slug = P.slug, name = clip(P.name || slug, 60);
  const desc = clip((P.web && P.web.seo) || P.blurb || P.tagline || `Reserva tu cita en ${name}`, 160);
  const title = clip(name + (P.tagline ? " · " + P.tagline : ""), 70);
  const url = `${ORIGIN}/${slug}/`;
  const logo = typeof P.logo === "string" && /^https:\/\//.test(P.logo) ? P.logo : `${ORIGIN}/img/og-citaly.png`;
  const zonas = zoneNames(P), servs = svcNames(P);
  const ld = { "@context": "https://schema.org", "@type": SCHEMA[P.type] || "LocalBusiness", name, description: desc, url };
  ld.image = logo !== `${ORIGIN}/img/og-citaly.png` ? logo : og;
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
    `<meta property="og:image" content="${esc(og)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(name)}">\n` +
    `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(og)}">\n` +
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

// citalyapp.com/<slug>/reservar: página chiquita que SÍ trae la vista previa (título, descripción e imagen) y manda de una vez
// a la página de reservas de siempre (/r/), conservando lo que venga en el link (?ref=, ?cita=, #...).
// GitHub Pages sirve <slug>/reservar.html en la dirección /<slug>/reservar. Si el archivo todavía no existe (negocio nuevo),
// 404.html sigue llevando al mismo lugar, solo que sin vista previa.
function reservar(P, og) {
  const slug = P.slug, name = clip(P.name || slug, 60);
  const title = clip("Agenda tu cita en " + name, 70);
  const desc = clip(`Reserva en 1 minuto con ${name}: elige el servicio, el día y la hora desde tu celular. Sin llamadas ni esperas.`, 160);
  const dest = "/r/?n=" + slug;
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex,follow">
<link rel="canonical" href="${ORIGIN}/${slug}/">
<meta property="og:type" content="website"><meta property="og:locale" content="es_CR">
<meta property="og:site_name" content="${esc(name)}"><meta property="og:url" content="${ORIGIN}/${slug}/reservar">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(og)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(name)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(og)}">
<script>location.replace(${JSON.stringify(dest)}+(location.search.length>1?"&"+location.search.slice(1):"")+location.hash)</script>
<noscript><meta http-equiv="refresh" content="0;url=${dest}"></noscript>
</head><body style="font-family:system-ui,sans-serif;text-align:center;padding:60px 20px"><p><a href="${dest}">${esc(title)}</a></p></body></html>
`;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const manual = new Set((fs.existsSync(NOINDEX) ? JSON.parse(fs.readFileSync(NOINDEX, "utf8")) : []).filter(x => SLUG_RE.test(x)));
const smPath = path.join(ROOT, "sitemap.xml");
const smOld = fs.readFileSync(smPath, "utf8");
// Páginas de negocios que hoy están en el sitemap (no se des-indexan por los criterios, solo por cierre o lista manual)
const yaIdx = new Set([...smOld.matchAll(/<loc>https:\/\/citalyapp\.com\/([a-z0-9-]+)\/<\/loc>/g)].map(m => m[1]).filter(x => SLUG_RE.test(x) && !RESERVED.has(x)));
const all = await loadPub();
const ok = all.filter(P => SLUG_RE.test(P.slug) && !RESERVED.has(P.slug) && P.name);
const prev = (fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : []).filter(x => SLUG_RE.test(x) && !RESERVED.has(x));
const lm = fs.existsSync(LASTMOD) ? JSON.parse(fs.readFileSync(LASTMOD, "utf8")) : {};
const now = ok.map(P => P.slug).sort();

// Freno 1: si Firestore devuelve muy pocos negocios (vacío o parcial), no se borra nada.
if (prev.length >= 4 && now.length < prev.length * MIN_RESTO) throw new Error(`Solo llegaron ${now.length} negocios y antes había ${prev.length}: se detiene para no borrar páginas. Revisar Firestore.`);
// Freno 2: si demasiadas páginas que estaban en el sitemap pasarían a noindex de una sola vez, se detiene.
const evs = new Map(ok.map(P => [P.slug, evaluar(P, manual, yaIdx.has(P.slug))]));
const bajas = [...yaIdx].filter(sl => evs.has(sl) && !evs.get(sl).index);
if (yaIdx.size >= 5 && bajas.length / yaIdx.size > MAX_BAJA) throw new Error(`${bajas.length} de ${yaIdx.size} páginas pasarían a noindex (${bajas.join(", ")}): se detiene. Revisar los datos o seo-noindex.json.`);
const indexables = [], ogJobs = [];
const OGV = 1; // subir este número para redibujar todas las imágenes de vista previa (cambio de diseño)
const OGHASH = path.join(ROOT, "tools", "og-hash.json");
const ogHechas = fs.existsSync(OGHASH) ? JSON.parse(fs.readFileSync(OGHASH, "utf8")) : {};

for (const P of ok) {
  const dir = path.join(ROOT, P.slug);
  if (fs.existsSync(dir) && !prev.includes(P.slug)) { console.log("omitido (carpeta existente):", P.slug); now.splice(now.indexOf(P.slug), 1); continue; }
  const ev = evs.get(P.slug);
  const src = fuenteOG(P);
  const job = { slug: P.slug, name: String(P.name || ""), tagline: String(P.tagline || ""), color: String(P.color || ""), logo: tieneLogo(P) ? P.logo : "", img: "", ba: src.ba };
  job.v = crypto.createHash("sha1").update(JSON.stringify([OGV, job, src.key])).digest("hex").slice(0, 10);
  if (ogHechas[P.slug] === job.v && fs.existsSync(path.join(dir, "og.jpg"))) job.logo = ""; // ya está dibujada: no hace falta mandar las imágenes
  else { const r = await src.get(); job.img = r.img; if (r.fail) job.fail = true; }
  ogJobs.push(job);
  const og = `${ORIGIN}/${P.slug}/og.jpg?v=${job.v}`;
  const html = page(P, ev, og);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  fs.writeFileSync(path.join(dir, "reservar.html"), reservar(P, og));
  const h = crypto.createHash("sha1").update(html).digest("hex");
  if (!lm[P.slug] || lm[P.slug].h !== h) lm[P.slug] = { h, d: today };
  console.log((ev.index ? "INDEXAR  " : "noindex  ") + P.slug + "  (" + ev.motivo + ")");
  if (ev.index) indexables.push(P.slug);
}
for (const sl of prev) if (!now.includes(sl)) { fs.rmSync(path.join(ROOT, sl), { recursive: true, force: true }); delete lm[sl]; }
// Lista para tools/gen-og.py, que dibuja <slug>/og.jpg (no se sube al repo: trae las fotos completas)
fs.writeFileSync(process.env.OG_JOBS || path.join(ROOT, "tools", ".og-jobs.json"), JSON.stringify(ogJobs));
fs.writeFileSync(MANIFEST, JSON.stringify(now, null, 1) + "\n");
fs.writeFileSync(LASTMOD, JSON.stringify(lm, null, 1) + "\n");

let sm = smOld.replace(/\s*<url><loc>https:\/\/citalyapp\.com\/[a-z0-9-]+\/<\/loc>(?:<lastmod>[^<]*<\/lastmod>)?<changefreq>monthly<\/changefreq><priority>0\.6<\/priority><\/url>/g, "");
sm = sm.replace("</urlset>", indexables.map(sl => `  <url><loc>${ORIGIN}/${sl}/</loc><lastmod>${lm[sl].d}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`).join("") + "</urlset>");
fs.writeFileSync(smPath, sm);
console.log("páginas:", now.length, "· en el sitemap:", indexables.length);
