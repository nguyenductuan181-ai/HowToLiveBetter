// Turns the EPUB into plain static HTML pages under how-to-live-better/doc/.
// One page per spine item, real text in the main document (no iframe, no JS needed),
// so browser reader modes, printing, page translation and search engines all work.
import JSZip from "jszip";

const SITE = "https://sach.thantamtue.vn";
const BASE = "/how-to-live-better/doc/";
let DOC_V = "1";
export function setDocVersion(v) { DOC_V = v; }

const pageName = (href) => href.replace(/\.xhtml$/, ".html");
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c]);
const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/\s+/g, " ").trim();

function rewriteLinks(html) {
  // internal .xhtml links → .html pages; external links open in a new tab
  return html
    .replace(/href="([A-Za-z0-9_-]+)\.xhtml(#[^"]*)?"/g, (_, f, h) => `href="${BASE}${f}.html${h || ""}"`)
    .replace(/<a ([^>]*href="https?:\/\/[^"]+"[^>]*)>/g, (m, attrs) => (/\btarget=/.test(attrs) ? m : `<a ${attrs} target="_blank" rel="noopener">`));
}

const THEME_BOOT = `<script>(function(){try{var t=localStorage.getItem("htlb-vi.theme")||"auto";if(t==="auto")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()</script>`;

const ICON_THEME = `<svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>`;

const PAGE_JS = `<script>(function(){
var r=document.documentElement,b=document.getElementById("doc-theme");
function set(t){r.setAttribute("data-theme",t);try{localStorage.setItem("htlb-vi.theme",t)}catch(e){}}
if(b)b.onclick=function(){set(r.getAttribute("data-theme")==="dark"?"light":"dark")};
document.addEventListener("keydown",function(e){
if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;var t=e.target&&e.target.tagName;if(t==="INPUT"||t==="TEXTAREA")return;
var a=null;if(e.key==="ArrowLeft")a=document.querySelector('link[rel=prev]');if(e.key==="ArrowRight")a=document.querySelector('link[rel=next]');
if(a){e.preventDefault();location.href=a.href}});
})()</script>`;

function page({ title, description, bodyClass, body, file, prev, next, readerHash }) {
  const canonical = SITE + BASE + file;
  const navLink = (p, rel, arrow) => p
    ? `<a class="doc-${rel}" rel="${rel}" href="${BASE}${p.file}"><small>${rel === "prev" ? "Trước" : "Sau"}</small><span>${arrow === "l" ? "← " : ""}${esc(p.title)}${arrow === "r" ? " →" : ""}</span></a>`
    : `<span></span>`;
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Cẩm nang sống đáng giá</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${prev ? `<link rel="prev" href="${BASE}${prev.file}">` : ""}
${next ? `<link rel="next" href="${BASE}${next.file}">` : ""}
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)} · Cẩm nang sống đáng giá">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}/how-to-live-better/assets/og.jpg">
<meta property="og:url" content="${canonical}">
<link rel="icon" href="/how-to-live-better/assets/icon.png">
${THEME_BOOT}
<link rel="stylesheet" href="${BASE}style.css">
<link rel="stylesheet" href="${BASE}doc.css?v=${DOC_V}">
</head>
<body class="${esc(bodyClass)}">
<header class="doc-bar">
<a class="doc-home" href="${BASE}">Cẩm nang sống đáng giá</a>
<nav class="doc-tools" aria-label="Công cụ">
<a href="${BASE}">Mục lục</a>
<a href="/how-to-live-better#${encodeURIComponent(readerHash)}">Trình đọc</a>
<a href="/HowToLiveBetter-vi.epub" download>EPUB</a>
<button id="doc-theme" type="button" aria-label="Đổi nền sáng hoặc tối">${ICON_THEME}</button>
</nav>
</header>
<main>
<article>
${body}
</article>
</main>
<nav class="doc-nav" aria-label="Chuyển trang">${navLink(prev, "prev", "l")}${navLink(next, "next", "r")}</nav>
<footer class="doc-foot"><p>Bản dịch tiếng Việt của 《高性价比人生指南》 (eternity4719). Giấy phép CC BY 4.0. Mã nguồn: <a href="https://github.com/thuongtin/HowToLiveBetter">github.com/thuongtin/HowToLiveBetter</a>.</p></footer>
${PAGE_JS}
</body>
</html>
`;
}

export async function buildDocs(epubBuffer) {
  const zip = await JSZip.loadAsync(epubBuffer);
  const read = (p) => zip.file(p).async("string");
  const opfPath = (await read("META-INF/container.xml")).match(/full-path="([^"]+)"/)[1];
  const dir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const opf = await read(opfPath);
  const manifest = {};
  for (const m of opf.matchAll(/<item\b[^>]*>/g)) {
    const id = /\bid="([^"]+)"/.exec(m[0])[1], href = /\bhref="([^"]+)"/.exec(m[0])[1];
    manifest[id] = href;
  }
  const spine = [...opf.matchAll(/<itemref\b[^>]*idref="([^"]+)"[^>]*>/g)]
    .filter((m) => !/linear="no"/.test(m[0]))
    .map((m) => manifest[m[1]]);

  const items = [];
  for (const href of spine) {
    const x = await read(dir + href);
    const title = text((/<title>([\s\S]*?)<\/title>/.exec(x) || [, href])[1]);
    const bodyM = /<body([^>]*)>([\s\S]*)<\/body>/.exec(x);
    const bodyClass = (/class="([^"]*)"/.exec(bodyM[1]) || [, ""])[1];
    const body = rewriteLinks(bodyM[2].trim());
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(body);
    const firstP = /<p[^>]*>([\s\S]*?)<\/p>/.exec(body.replace(/<p class="chapter-kicker"[\s\S]*?<\/p>/, ""));
    let description = firstP ? text(firstP[1]) : "";
    if (description.length > 158) description = description.slice(0, 155).replace(/\s+\S*$/, "") + "…";
    items.push({ href, file: pageName(href), title: h1 && !/cover-page/.test(bodyClass) ? text(h1[1]) : title, bodyClass, body, description });
  }

  const out = {};
  items.forEach((it, i) => {
    out[it.file] = page({
      ...it,
      description: it.description || "Cẩm nang sống đáng giá — bản tiếng Việt đọc online.",
      prev: items[i - 1], next: items[i + 1], readerHash: it.href
    });
  });
  // index: the book's own table of contents page
  const tocItem = items.find((it) => it.href === "toc.xhtml") || items.find((it) => it.href === "nav.xhtml");
  out["index.html"] = page({
    ...tocItem, file: "", title: "Mục lục",
    description: "Mục lục bản HTML của Cẩm nang sống đáng giá: 34 chương, 772 mục lời khuyên, mỗi mục ghi chi phí, lợi ích, mức chứng cứ và nguồn.",
    prev: null, next: items[0], readerHash: tocItem.href
  });

  const assets = { "style.css": await zip.file(dir + "style.css").async("nodebuffer") };
  for (const name of Object.keys(zip.files)) {
    if (name.startsWith(dir + "fonts/") && !zip.files[name].dir) assets[name.slice(dir.length)] = await zip.file(name).async("nodebuffer");
    if (/\.(png|jpe?g|gif|svg|webp)$/i.test(name) && name.startsWith(dir) && !name.slice(dir.length).includes("/")) assets[name.slice(dir.length)] = await zip.file(name).async("nodebuffer");
  }
  return { pages: out, assets };
}
