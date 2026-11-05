/* Web reader for the Vietnamese EPUB. Renders /HowToLiveBetter-vi.epub with epub.js. */
(function () {
  "use strict";

  var EPUB_URL = "/HowToLiveBetter-vi.epub";
  var KEY = "htlb-vi.";
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var app = $("app");

  function load(k, d) { try { var v = localStorage.getItem(KEY + k); return v === null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(KEY + k, v); } catch (e) { /* private mode */ } }

  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var state = {
    font: Math.min(180, Math.max(70, parseInt(load("font", "100"), 10) || 100)),
    theme: load("theme", prefersDark ? "dark" : "light"),
    face: load("face", "serif"),
    flow: load("flow", "scrolled"),
    cfi: load("cfi", "")
  };
  if (["light", "sepia", "dark"].indexOf(state.theme) < 0) state.theme = "light";
  if (["scrolled", "paginated"].indexOf(state.flow) < 0) state.flow = "scrolled";

  var book = null, rendition = null, spine = [], tocByHref = {}, tocLinks = [];
  var current = { index: 0, href: "", cfi: "" };
  var searchHl = null;

  /* ---------- helpers ---------- */

  function fold(s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var c = s[i], f = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (c === "đ" || c === "Đ") f = "d";
      out += f.length === 1 ? f.toLowerCase() : c.toLowerCase();
    }
    return out;
  }
  function baseHref(h) { return (h || "").split("#")[0].replace(/^\.?\//, ""); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  var toastTimer;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- panels ---------- */

  var openPanel = null;
  function show(id) {
    hideAll();
    var el = $(id); el.hidden = false; openPanel = el;
    if (id !== "download-panel") $("scrim").hidden = false;
    if (id === "toc-panel") {
      var cur = $("toc-list").querySelector("a.current");
      if (cur) cur.scrollIntoView({ block: "center" });
    }
    if (id === "search-panel" && window.matchMedia("(pointer: fine)").matches) $("search-input").focus();
  }
  function hideAll() {
    ["toc-panel", "search-panel", "settings-panel", "download-panel"].forEach(function (id) { $(id).hidden = true; });
    $("scrim").hidden = true; openPanel = null;
  }
  function toggle(id) { if (openPanel && openPanel.id === id) hideAll(); else show(id); }
  $("btn-toc").onclick = function () { toggle("toc-panel"); };
  $("btn-search").onclick = function () { toggle("search-panel"); };
  $("btn-settings").onclick = function () { toggle("settings-panel"); };
  $("btn-download").onclick = function () { toggle("download-panel"); };
  $("scrim").onclick = hideAll;
  $("download-panel").addEventListener("click", function (e) { if (e.target === this) hideAll(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-close]"), function (b) { b.onclick = hideAll; });
  if (/FBAN|FBAV|FB_IAB|FBIOS|Instagram|Zalo|Messenger|Line\//i.test(navigator.userAgent)) $("inapp-note").hidden = false;

  /* ---------- content styling ---------- */

  var THEMES = {
    light: { bg: "#ffffff", fg: null, link: null },
    sepia: { bg: "#f6eedb", fg: "#3b2f22", link: "#7a3d12", line: "#c9b994", th: "#e8dcc2" },
    dark: { bg: "#1d2025", fg: "#e3e4e6", link: "#8fbef0", line: "#3a3f47", th: "#2a2e35" }
  };
  function contentCss() {
    var t = THEMES[state.theme], css = "";
    css += "html{font-size:" + state.font + "% !important;}";
    css += "html,body{background:" + t.bg + " !important;}";
    if (t.fg) {
      css += "body{color:" + t.fg + " !important;}";
      css += "body *{color:inherit !important;background-color:transparent !important;border-color:" + t.line + " !important;}";
      css += "a,a *{color:" + t.link + " !important;}";
      css += "th{background-color:" + t.th + " !important;}";
      if (state.theme === "dark") css += "img{opacity:.9;}";
    }
    if (state.face === "sans") {
      css += "body,p,li,td,th,blockquote,.entry-title,h1,h2,h3,h4{font-family:\"Be Vietnam Pro\",\"HTLB Symbols\",Arial,sans-serif !important;}";
    }
    if (state.flow === "scrolled") {
      css += "body{max-width:40em !important;margin:0 auto !important;padding:28px 22px 72px !important;box-sizing:border-box;}";
      css += "body.cover-page{padding:0 !important;max-width:34em !important;}";
    }
    if ($("stage").clientWidth < 600) css += "p,li,.chapter-intro{text-align:left !important;-webkit-hyphens:none;hyphens:none;}";
    css += "::selection{background:rgba(31,92,138,.28);}";
    return css;
  }
  function styleContents(contents) {
    var doc = contents.document;
    if (!doc) return;
    var el = doc.getElementById("htlb-reader-style");
    if (!el) {
      el = doc.createElement("style"); el.id = "htlb-reader-style";
      (doc.head || doc.documentElement).appendChild(el);
    }
    el.textContent = contentCss();
  }
  function restyle() {
    root.setAttribute("data-theme", state.theme);
    root.setAttribute("data-flow", state.flow);
    var meta = document.querySelectorAll('meta[name="theme-color"]');
    Array.prototype.forEach.call(meta, function (m) { m.setAttribute("content", getComputedStyle(root).getPropertyValue("--bg").trim() || "#f7f5f0"); });
    if (rendition) {
      rendition.getContents().forEach(styleContents);
      try { rendition.resize($("stage").clientWidth, $("stage").clientHeight); } catch (e) { /* not displayed yet */ }
    }
    $("font-val").textContent = state.font + "%";
    markSeg("theme-seg", "theme", state.theme);
    markSeg("face-seg", "face", state.face);
    markSeg("flow-seg", "flow", state.flow);
    updateNavLabels();
  }
  function markSeg(id, attr, val) {
    Array.prototype.forEach.call($(id).querySelectorAll("button"), function (b) {
      b.classList.toggle("on", b.getAttribute("data-" + attr) === val);
    });
  }
  function setFont(v) {
    state.font = Math.min(180, Math.max(70, v)); save("font", state.font); restyle();
  }
  $("font-dec").onclick = function () { setFont(state.font - 10); };
  $("font-inc").onclick = function () { setFont(state.font + 10); };
  $("theme-seg").onclick = function (e) { var v = e.target.getAttribute("data-theme"); if (v) { state.theme = v; save("theme", v); restyle(); } };
  $("face-seg").onclick = function (e) { var v = e.target.getAttribute("data-face"); if (v) { state.face = v; save("face", v); restyle(); } };
  $("flow-seg").onclick = function (e) {
    var v = e.target.getAttribute("data-flow");
    if (v && v !== state.flow) { state.flow = v; save("flow", v); restyle(); startRendition(current.cfi || undefined); }
  };

  /* ---------- loading ---------- */

  function setLoad(frac, text) {
    if (text) $("loader-text").textContent = text;
    if (frac !== null) $("loader-fill").style.width = Math.round(frac * 100) + "%";
  }
  function fetchBook() {
    return fetch(EPUB_URL, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      var total = parseInt(res.headers.get("content-length"), 10) || 2600000;
      if (!res.body || !res.body.getReader) return res.arrayBuffer();
      var reader = res.body.getReader(), chunks = [], got = 0;
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) {
            var buf = new Uint8Array(got), off = 0;
            chunks.forEach(function (c) { buf.set(c, off); off += c.length; });
            return buf.buffer;
          }
          chunks.push(r.value); got += r.value.length;
          setLoad(Math.min(0.95, got / total * 0.95), "Đang tải sách… " + (got / 1048576).toFixed(1).replace(".", ",") + " / " + (total / 1048576).toFixed(1).replace(".", ",") + " MB");
          return pump();
        });
      }
      return pump();
    });
  }

  function open() {
    $("loader-actions").hidden = true;
    app.classList.add("loading");
    setLoad(0.02, "Đang tải sách…");
    fetchBook().then(function (buf) {
      setLoad(0.96, "Đang mở sách…");
      book = ePub(buf);
      return book.ready;
    }).then(function () {
      spine = [];
      book.spine.each(function (item) { spine.push(item); });
      return book.loaded.navigation;
    }).then(function (nav) {
      buildToc(nav.toc);
      var start = startTarget();
      return startRendition(start);
    }).then(function () {
      setLoad(1, "");
      app.classList.remove("loading");
    }).catch(function (err) {
      console.error(err);
      setLoad(0, "Không tải được sách (" + (err && err.message ? err.message : err) + "). Kiểm tra mạng rồi thử lại, hoặc tải file EPUB về máy.");
      $("loader-actions").hidden = false;
    });
  }
  $("btn-retry").onclick = open;

  function startTarget() {
    var h = decodeURIComponent((location.hash || "").slice(1));
    if (h && book.spine.get(baseHref(h))) return h;
    if (state.cfi) return state.cfi;
    return undefined;
  }

  function startRendition(target) {
    if (rendition) { try { rendition.destroy(); } catch (e) { /* ignore */ } $("viewer").innerHTML = ""; }
    var st = $("stage");
    var opts = {
      width: st.clientWidth, height: st.clientHeight,
      allowScriptedContent: true, allowPopups: true,
      flow: state.flow === "scrolled" ? "scrolled-doc" : "paginated",
      spread: state.flow === "scrolled" ? "none" : "auto",
      minSpreadWidth: 1100
    };
    rendition = book.renderTo("viewer", opts);
    rendition.hooks.content.register(function (contents) {
      styleContents(contents);
      var doc = contents.document;
      Array.prototype.forEach.call(doc.querySelectorAll("a[href]"), function (a) {
        var href = a.getAttribute("href");
        if (/^[a-z]+:\/\//i.test(href) || /^mailto:/i.test(href)) {
          a.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); window.open(href, "_blank", "noopener"); });
        }
      });
    });
    rendition.on("relocated", onRelocated);
    rendition.on("keyup", onKey);
    rendition.on("touchstart", onTouchStart);
    rendition.on("touchend", onTouchEnd);
    rendition.on("click", function () { if (openPanel) hideAll(); });
    var p = target ? rendition.display(target) : rendition.display();
    return p.catch(function () { return rendition.display(); });
  }

  var scrollTimer;
  $("viewer").addEventListener("scroll", function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      if (!rendition || state.flow !== "scrolled") return;
      try {
        var loc = rendition.currentLocation();
        if (loc && typeof loc.then === "function") loc.then(onRelocated); else onRelocated(loc);
      } catch (e) { /* not ready */ }
    }, 250);
  }, true);

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!rendition) return;
      var st = $("stage");
      try { rendition.resize(st.clientWidth, st.clientHeight); } catch (e) { /* ignore */ }
    }, 150);
  });

  /* ---------- position ---------- */

  function onRelocated(loc) {
    if (!loc || !loc.start) return;
    current.cfi = loc.start.cfi;
    current.href = baseHref(loc.start.href);
    current.index = loc.start.index;
    save("cfi", current.cfi);

    var n = spine.length || 1, within = 0;
    var d = loc.start.displayed;
    if (state.flow === "paginated" && d && d.total > 1) within = (d.page - 1) / d.total;
    if (state.flow === "scrolled") {
      var c = document.querySelector("#viewer .epub-container");
      if (c && c.scrollHeight > c.clientHeight) within = c.scrollTop / (c.scrollHeight - c.clientHeight);
    }
    var pct = Math.min(100, Math.max(0, Math.round((current.index + within) / n * 100)));
    $("progress-fill").style.width = pct + "%";

    var label = tocByHref[current.href] || "";
    $("chapter-title").textContent = label;
    var chap = /^Chương\s+(\d+)/.exec(label);
    $("progress-text").textContent = (chap ? "Chương " + chap[1] + "/34 · " : "") + pct + "%";
    document.title = (label ? label + " · " : "") + "Cẩm nang sống đáng giá";

    var h = decodeURIComponent((location.hash || "").slice(1));
    if (baseHref(h) !== current.href) {
      try { history.replaceState(null, "", "#" + encodeURIComponent(current.href)); } catch (e) { /* file:// */ }
    }
    tocLinks.forEach(function (a) { a.classList.toggle("current", a.getAttribute("data-base") === current.href && a.getAttribute("data-top") === "1"); });
    $("btn-prev").disabled = current.index <= 0 && (state.flow === "scrolled" || loc.atStart);
    $("btn-next").disabled = current.index >= n - 1 && (state.flow === "scrolled" || loc.atEnd);
  }

  function goSection(delta) {
    var i = current.index + delta;
    if (i < 0 || i >= spine.length) return;
    rendition.display(spine[i].href).then(function () {
      var c = document.querySelector("#viewer .epub-container");
      if (c) c.scrollTop = 0;
    });
  }
  function prev() { if (!rendition) return; if (state.flow === "scrolled") goSection(-1); else rendition.prev(); }
  function next() { if (!rendition) return; if (state.flow === "scrolled") goSection(1); else rendition.next(); }
  function updateNavLabels() {
    var s = state.flow === "scrolled";
    $("btn-prev").querySelector("span").textContent = s ? "Phần trước" : "Trước";
    $("btn-next").querySelector("span").textContent = s ? "Phần sau" : "Sau";
    $("btn-prev").title = s ? "Phần trước" : "Trang trước";
    $("btn-next").title = s ? "Phần sau" : "Trang sau";
  }
  $("btn-prev").onclick = prev;
  $("btn-next").onclick = next;
  $("edge-prev").onclick = prev;
  $("edge-next").onclick = next;

  function onKey(e) {
    var t = e.target && e.target.tagName;
    if (t === "INPUT" || t === "TEXTAREA") return;
    if (e.key === "Escape") { hideAll(); return; }
    if (state.flow !== "paginated") return;
    if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") next();
  }
  document.addEventListener("keyup", onKey);

  var touch = null;
  function onTouchStart(e) { var t = e.changedTouches && e.changedTouches[0]; if (t) touch = { x: t.screenX, y: t.screenY, t: Date.now() }; }
  function onTouchEnd(e) {
    var t = e.changedTouches && e.changedTouches[0];
    if (!t || !touch || state.flow !== "paginated") return;
    var dx = t.screenX - touch.x, dy = t.screenY - touch.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - touch.t < 800) { if (dx < 0) next(); else prev(); }
    touch = null;
  }

  window.addEventListener("hashchange", function () {
    if (!rendition) return;
    var h = decodeURIComponent(location.hash.slice(1));
    if (h && baseHref(h) !== current.href) rendition.display(h);
  });

  /* ---------- table of contents ---------- */

  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  function buildToc(toc) {
    var list = $("toc-list"); list.innerHTML = ""; tocLinks = [];
    function walk(items, lvl, parentLi) {
      var ol = document.createElement("ol");
      items.forEach(function (it) {
        var li = document.createElement("li"); li.className = "lvl" + lvl;
        var label = (it.label || "").trim();
        li.setAttribute("data-fold", fold(label));
        var row = document.createElement("div"); row.className = "row";
        var a = document.createElement("a");
        var href = baseHref(it.href) + (it.href.indexOf("#") > -1 ? "#" + it.href.split("#")[1] : "");
        a.href = "#" + encodeURIComponent(href);
        a.textContent = label;
        a.setAttribute("data-base", baseHref(it.href));
        a.setAttribute("data-top", it.href.indexOf("#") > -1 ? "0" : "1");
        a.setAttribute("data-label", label);
        a.onclick = function (e) {
          e.preventDefault(); hideAll();
          rendition.display(href);
          try { history.replaceState(null, "", "#" + encodeURIComponent(href)); } catch (err) { /* ignore */ }
        };
        if (lvl === 0 && !tocByHref[baseHref(it.href)]) tocByHref[baseHref(it.href)] = label;
        tocLinks.push(a);
        row.appendChild(a);
        if (it.subitems && it.subitems.length) {
          var tg = document.createElement("button");
          tg.className = "toggle"; tg.innerHTML = CHEV; tg.setAttribute("aria-label", "Mở các mục của " + label);
          tg.onclick = function () { li.classList.toggle("open"); };
          row.insertBefore(tg, a);
          li.appendChild(row);
          walk(it.subitems, lvl + 1, li);
        } else {
          var sp = document.createElement("span"); sp.className = "toggle";
          if (lvl === 0) row.insertBefore(sp, a);
          li.appendChild(row);
        }
        ol.appendChild(li);
      });
      (parentLi || list).appendChild(ol);
    }
    walk(toc, 0, null);
  }

  $("toc-filter").addEventListener("input", function () {
    var q = fold(this.value.trim());
    var items = $("toc-list").querySelectorAll("li");
    Array.prototype.forEach.call(items, function (li) {
      li.hidden = false; li.classList.remove("open");
      var a = li.querySelector(":scope > .row > a");
      a.textContent = a.getAttribute("data-label");
    });
    if (!q) return;
    var tops = $("toc-list").querySelectorAll(":scope > ol > li");
    Array.prototype.forEach.call(tops, function (top) {
      var selfHit = top.getAttribute("data-fold").indexOf(q) > -1, anyChild = false;
      Array.prototype.forEach.call(top.querySelectorAll("li"), function (li) {
        var hit = li.getAttribute("data-fold").indexOf(q) > -1;
        li.hidden = !hit && !selfHit;
        if (hit) { anyChild = true; highlightLabel(li.querySelector(":scope > .row > a"), q); }
      });
      top.hidden = !selfHit && !anyChild;
      if (anyChild) top.classList.add("open");
      if (selfHit) highlightLabel(top.querySelector(":scope > .row > a"), q);
    });
  });
  function highlightLabel(a, q) {
    var label = a.getAttribute("data-label"), f = fold(label), i = f.indexOf(q);
    if (i < 0) return;
    a.innerHTML = esc(label.slice(0, i)) + "<mark>" + esc(label.slice(i, i + q.length)) + "</mark>" + esc(label.slice(i + q.length));
  }

  /* ---------- full-text search ---------- */

  var searchToken = 0;
  $("search-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = $("search-input").value.trim();
    if (q.length < 2) { $("search-results").innerHTML = '<p class="status">Gõ ít nhất 2 ký tự.</p>'; return; }
    runSearch(q);
    if (window.matchMedia("(pointer: coarse)").matches) $("search-input").blur();
  });

  function runSearch(q) {
    var token = ++searchToken, fq = fold(q), max = 300, count = 0;
    var box = $("search-results");
    box.innerHTML = '<p class="status" id="search-status">Đang tìm…</p>';
    var status = $("search-status");
    var i = 0;
    function step() {
      if (token !== searchToken) return Promise.resolve();
      if (i >= spine.length || count >= max) {
        status.textContent = count === 0 ? "Không thấy kết quả nào cho «" + q + "»."
          : (count >= max ? "Hiện " + max + " kết quả đầu tiên. Gõ cụ thể hơn để thu hẹp." : "Tìm thấy " + count + " kết quả.");
        return Promise.resolve();
      }
      var item = spine[i++];
      status.textContent = "Đang tìm… " + Math.round(i / spine.length * 100) + "%";
      return item.load(book.load.bind(book)).then(function () {
        if (token !== searchToken) return;
        var hits = item.document ? findIn(item, item.document, fq, max - count) : [];
        item.unload();
        if (!hits.length) return;
        var g = document.createElement("div"); g.className = "group";
        g.textContent = tocByHref[baseHref(item.href)] || item.href;
        box.appendChild(g);
        hits.forEach(function (h) {
          var b = document.createElement("button"); b.className = "hit"; b.type = "button";
          b.innerHTML = h.html;
          b.onclick = function () { goHit(h.cfi); };
          box.appendChild(b);
        });
        count += hits.length;
      }).catch(function (err) { console.warn("search", item.href, err); }).then(function () {
        return new Promise(function (r) { setTimeout(r, 0); });
      }).then(step);
    }
    step();
  }

  function findIn(item, doc, fq, limit) {
    var out = [], body = doc.body || doc.documentElement;
    var walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode()) && out.length < limit) {
      var text = node.nodeValue;
      if (text.length < fq.length) continue;
      var f = fold(text), from = 0, at;
      while ((at = f.indexOf(fq, from)) > -1 && out.length < limit) {
        from = at + fq.length;
        try {
          var range = doc.createRange();
          range.setStart(node, at); range.setEnd(node, at + fq.length);
          var cfi = item.cfiFromRange(range);
          var s = Math.max(0, at - 50), e = Math.min(text.length, at + fq.length + 70);
          var html = (s > 0 ? "…" : "") + esc(text.slice(s, at)) + "<mark>" + esc(text.slice(at, at + fq.length)) + "</mark>" + esc(text.slice(at + fq.length, e)) + (e < text.length ? "…" : "");
          out.push({ cfi: cfi, html: html });
        } catch (err) { /* skip odd node */ }
      }
    }
    return out;
  }

  function goHit(cfi) {
    if (window.matchMedia("(max-width: 900px)").matches) hideAll();
    rendition.display(cfi).then(function () {
      if (searchHl) { try { rendition.annotations.remove(searchHl, "highlight"); } catch (e) { /* ignore */ } }
      searchHl = cfi;
      try { rendition.annotations.highlight(cfi, {}, null, "htlb-hl", { fill: "#f2c94c", "fill-opacity": "0.45" }); } catch (e) { /* ignore */ }
      if (state.flow === "scrolled") scrollToCfi(cfi);
    });
  }
  function scrollToCfi(cfi) {
    var c = document.querySelector("#viewer .epub-container");
    var contents = rendition.getContents()[0];
    if (!c || !contents) return;
    try {
      var range = contents.range(cfi);
      var rect = range.getBoundingClientRect();
      c.scrollTop = Math.max(0, rect.top - c.clientHeight / 3);
    } catch (e) { /* ignore */ }
  }

  /* ---------- start ---------- */

  window.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "f" && rendition) { e.preventDefault(); show("search-panel"); $("search-input").focus(); }
  });
  restyle();
  if (typeof ePub !== "function" || typeof JSZip !== "function") {
    setLoad(0, "Trình duyệt không chạy được trang đọc. Bạn có thể tải file EPUB về máy.");
    $("loader-actions").hidden = false;
  } else {
    open();
  }
})();
