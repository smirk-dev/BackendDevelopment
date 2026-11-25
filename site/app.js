(function () {
  'use strict';

  var S = window.SITE;
  var RAW = 'https://raw.githubusercontent.com/';
  var GH = 'https://github.com/';
  var IMG_RE = /\.(png|jpe?g|gif|svg|webp)$/i;
  var mdCache = {};

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var el = function (tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var groupOf = function (id) { return S.groups.find(function (g) { return g.id === id; }); };
  var entryById = function (id) { return S.entries.find(function (e) { return e.id === id; }); };

  // ---------- paths ----------

  function normalize(path) {
    var out = [];
    path.split('/').forEach(function (p, i, all) {
      if (p === '..') out.pop();
      else if (p !== '.' && (p !== '' || i === all.length - 1)) out.push(p);
    });
    return out.join('/');
  }

  function dirOf(path) { var i = path.lastIndexOf('/'); return i < 0 ? '' : path.slice(0, i + 1); }

  // A document is either a folder README (entry) or any other markdown file in the repo.
  function docFor(entry, file) {
    var repo = entry && entry.remote ? entry.remote : S.repo;
    var src = file || (entry && entry.remote ? 'README.md' : entry.id + '/README.md');
    return { entry: entry, repo: repo, remote: !!(entry && entry.remote), src: src };
  }

  function rawUrl(doc, path) { return RAW + doc.repo + '/' + S.branch + '/' + encodeURI(path); }
  function blobUrl(doc, path) { return GH + doc.repo + '/blob/' + S.branch + '/' + encodeURI(path); }
  function treeUrl(doc, path) { return GH + doc.repo + '/tree/' + S.branch + '/' + encodeURI(path.replace(/\/$/, '')); }

  function sourceUrl(doc) {
    if (doc.entry && !doc.remote && !doc.src.endsWith('/README.md')) return blobUrl(doc, doc.src);
    if (doc.remote) return GH + doc.repo;
    return treeUrl(doc, doc.entry ? doc.entry.id : dirOf(doc.src));
  }

  // Turn a relative link inside a README into something that works on this site.
  function resolveLink(href, doc, isImg) {
    if (!href || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) return null;
    var clean = href.split('#')[0].split('?')[0];
    var hash = href.indexOf('#') >= 0 ? href.slice(href.indexOf('#')) : '';
    var path;
    try { path = normalize(dirOf(doc.src) + decodeURIComponent(clean)); } catch (e) { path = normalize(dirOf(doc.src) + clean); }
    if (clean === '') return null;
    var isDir = /\/$/.test(clean) || path === '';

    if (doc.remote) {
      if (isImg || IMG_RE.test(path)) return rawUrl(doc, path);
      return isDir ? treeUrl(doc, path) : blobUrl(doc, path) + hash;
    }
    if (isImg || IMG_RE.test(path)) return encodeURI(path);
    if (/\.md$/i.test(path)) {
      var owner = S.entries.find(function (e) { return !e.remote && e.id + '/README.md' === path; });
      return owner ? '#/' + owner.id : '#/doc/' + encodeURI(path);
    }
    if (isDir) {
      var folder = path.replace(/\/$/, '');
      var ent = S.entries.find(function (e) { return e.id === folder; });
      return ent ? '#/' + ent.id : treeUrl(doc, folder);
    }
    if (/\.(html?|pdf)$/i.test(path)) return encodeURI(path) + hash;
    return blobUrl(doc, path) + hash;
  }

  // ---------- fetching and rendering ----------

  function fetchMd(doc) {
    var key = doc.repo + ':' + doc.src;
    if (mdCache[key]) return mdCache[key];
    var tryRaw = function () {
      return fetch(rawUrl(doc, doc.src)).then(function (r) {
        if (!r.ok) throw new Error('Could not load ' + doc.src + ' (' + r.status + ')');
        return r.text();
      });
    };
    var p = doc.remote ? tryRaw() : fetch(encodeURI(doc.src)).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).catch(tryRaw);
    mdCache[key] = p.catch(function (e) { delete mdCache[key]; throw e; });
    return mdCache[key];
  }

  function slugify(text, used) {
    var base = text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-') || 'section';
    var s = base, i = 1;
    while (used[s]) s = base + '-' + i++;
    used[s] = true;
    return s;
  }

  function renderMarkdown(md, doc, opts) {
    opts = opts || {};
    var html = DOMPurify.sanitize(marked.parse(md, { gfm: true }), { ADD_ATTR: ['target'] });
    var art = el('article', { class: 'md' }, html);

    // Drop the README's own H1 when the page header already shows the title.
    if (opts.dropH1) { var h1 = art.querySelector('h1'); if (h1 && h1 === art.firstElementChild) h1.remove(); }

    var used = {}, prefix = opts.idPrefix || '';
    art.querySelectorAll('h1,h2,h3,h4').forEach(function (h) { h.id = prefix + slugify(h.textContent, used); });

    art.querySelectorAll('img[src]').forEach(function (img) {
      var r = resolveLink(img.getAttribute('src'), doc, true);
      if (r) img.setAttribute('src', r);
      img.setAttribute('loading', 'lazy');
    });

    art.querySelectorAll('a[href]').forEach(function (a) {
      var raw = a.getAttribute('href');
      if (/^#[^/]/.test(raw)) { a.setAttribute('data-anchor', prefix + raw.slice(1)); return; }
      var r = resolveLink(raw, doc, false);
      if (r) a.setAttribute('href', r);
      var href = a.getAttribute('href');
      if (/^https?:/i.test(href)) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
      // Screenshots are linked in the READMEs; show them inline as figures too.
      if (IMG_RE.test(href.split('#')[0]) && !a.querySelector('img')) {
        var fig = el('figure', { class: 'shot' });
        var img = el('img', { src: href, alt: a.textContent.replace(/`/g, ''), loading: 'lazy' });
        var cap = el('figcaption');
        cap.textContent = a.textContent.replace(/`/g, '');
        var link = el('a', { href: href, target: '_blank', rel: 'noopener' });
        link.appendChild(img);
        fig.appendChild(link); fig.appendChild(cap);
        var block = a.closest('li, p, td') || a;
        if (block.tagName === 'TD' || block.tagName === 'LI') block.appendChild(fig);
        else block.insertAdjacentElement('afterend', fig);
      }
    });

    art.querySelectorAll('table').forEach(function (t) {
      var wrap = el('div', { class: 'table-wrap' });
      t.parentNode.insertBefore(wrap, t); wrap.appendChild(t);
    });

    art.querySelectorAll('pre code').forEach(function (c) {
      var lang = (c.className.match(/language-(\S+)/) || [])[1];
      if (lang && lang !== 'text' && window.hljs && hljs.getLanguage(lang)) hljs.highlightElement(c);
      else c.classList.add('hljs');
      var pre = c.parentNode;
      if (lang && lang !== 'text') pre.setAttribute('data-lang', lang);
    });

    return art;
  }

  // ---------- downloads ----------

  function downloadText(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/markdown;charset=utf-8' });
    var a = el('a', { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function fileBase(entry) {
    var name = entry ? (entry.remote ? entry.remote.split('/')[1] : entry.id.split('/').pop()) : 'Report';
    return S.sapId + '_' + S.student.replace(/\s+/g, '_') + '_' + name;
  }

  function waitForImages(root, ms) {
    var imgs = Array.prototype.slice.call(root.querySelectorAll('img'));
    imgs.forEach(function (i) { i.loading = 'eager'; });
    return Promise.race([
      Promise.all(imgs.map(function (i) {
        return i.complete ? 0 : new Promise(function (res) { i.onload = i.onerror = res; });
      })),
      new Promise(function (res) { setTimeout(res, ms); }),
    ]);
  }

  function coverHtml(title, subtitle) {
    return '<header class="p-cover">' +
      '<p class="p-kicker">' + esc(S.course) + ' (' + esc(S.code) + ') &middot; ' + esc(S.programme) + '</p>' +
      '<h1>' + esc(title) + '</h1>' +
      (subtitle ? '<p class="p-sub">' + esc(subtitle) + '</p>' : '') +
      '<dl><dt>Student</dt><dd>' + esc(S.student) + '</dd>' +
      '<dt>SAP ID</dt><dd>' + esc(S.sapId) + '</dd>' +
      '<dt>Instructor</dt><dd>' + esc(S.instructor) + '</dd>' +
      '<dt>Source</dt><dd>github.com/' + esc(S.repo) + '</dd></dl></header>';
  }

  function printRoot(nodes, title) {
    var root = $('#print-root');
    root.innerHTML = '';
    nodes.forEach(function (n) { root.appendChild(n); });
    var oldTitle = document.title;
    document.title = title;
    var restore = function () { document.title = oldTitle; root.innerHTML = ''; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    return waitForImages(root, 8000).then(function () { window.print(); });
  }

  function entryLabel(e) {
    var g = groupOf(e.group);
    return (/^\d/.test(e.num) ? g.short + ' ' : '') + e.num;
  }

  function printDoc(doc) {
    var e = doc.entry;
    return fetchMd(doc).then(function (md) {
      var sec = el('section', { class: 'p-doc' });
      sec.innerHTML = coverHtml(e ? entryLabel(e) + ': ' + e.title : doc.src.split('/').pop(), e ? e.summary : '');
      sec.appendChild(renderMarkdown(md, doc, { dropH1: !!e, idPrefix: 'p-' }));
      return printRoot([sec], fileBase(e) + '_Report');
    });
  }

  function printAll() {
    var list = S.entries.slice();
    var ov = $('#overlay'), msg = $('#overlay-msg');
    ov.hidden = false;
    var done = 0;
    msg.textContent = 'Fetching reports 0 / ' + list.length;
    return Promise.all(list.map(function (e) {
      var d = docFor(e);
      return fetchMd(d).then(function (md) { msg.textContent = 'Fetching reports ' + (++done) + ' / ' + list.length; return md; },
        function () { msg.textContent = 'Fetching reports ' + (++done) + ' / ' + list.length; return null; });
    })).then(function (mds) {
      msg.textContent = 'Laying out ' + list.length + ' sections';
      var nodes = [];
      var cover = el('section', { class: 'p-doc p-front' });
      var toc = '<h2 class="p-toc-h">Contents</h2><ol class="p-toc">';
      S.groups.forEach(function (g) {
        var items = list.filter(function (e) { return e.group === g.id; });
        if (!items.length) return;
        toc += '<li class="p-toc-g">' + esc(g.title) + '<ol>';
        items.forEach(function (e) { toc += '<li><span>' + esc(entryLabel(e)) + '</span> ' + esc(e.title) + '</li>'; });
        toc += '</ol></li>';
      });
      cover.innerHTML = coverHtml('Lab and Theory Report', 'Every experiment, task, assignment and project, with its README, run instructions and the checks that were run.') + toc + '</ol>';
      nodes.push(cover);
      list.forEach(function (e, i) {
        var sec = el('section', { class: 'p-doc p-part' });
        sec.innerHTML = '<p class="p-kicker">' + esc(groupOf(e.group).title) + '</p><h1 class="p-h">' + esc(entryLabel(e) + ': ' + e.title) + '</h1>';
        if (mds[i] == null) sec.appendChild(el('p', null, 'This README could not be loaded.'));
        else sec.appendChild(renderMarkdown(mds[i], docFor(e), { dropH1: true, idPrefix: 'p' + i + '-' }));
        nodes.push(sec);
      });
      msg.textContent = 'Loading screenshots';
      return printRoot(nodes, S.sapId + '_' + S.student.replace(/\s+/g, '_') + '_Backend_Development_Report');
    }).finally(function () { ov.hidden = true; });
  }

  // ---------- views ----------

  function liveButtons(e, cls) {
    return (e.live || []).map(function (l) {
      var ext = /^https?:/.test(l.href);
      return '<a class="' + cls + '" href="' + esc(l.href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l.label) + '</a>';
    }).join('');
  }

  function tags(e) {
    return '<ul class="tags">' + e.stack.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
  }

  function renderHome() {
    var main = $('#main');
    var counts = S.groups.map(function (g) {
      return '<div class="stat"><b>' + S.entries.filter(function (e) { return e.group === g.id; }).length + '</b><span>' + esc(g.title) + '</span></div>';
    }).join('');
    var html =
      '<section class="hero">' +
        '<p class="kicker">' + esc(S.code) + ' &middot; ' + esc(S.programme) + '</p>' +
        '<h1>' + esc(S.course) + '</h1>' +
        '<p class="lede">Every lab experiment, theory task, assignment and project from the course. Open any card to read its report, try the live page where there is one, or download a report as a PDF.</p>' +
        '<p class="who">' + esc(S.student) + ' &middot; ' + esc(S.sapId) + ' &middot; Instructor: ' + esc(S.instructor) + '</p>' +
        '<div class="hero-actions">' +
          '<button class="btn primary" data-action="print-all" type="button">' + icon('download') + 'Download full report (PDF)</button>' +
          '<a class="btn" href="' + GH + S.repo + '" target="_blank" rel="noopener">' + icon('github') + 'Source on GitHub</a>' +
        '</div>' +
        '<div class="stats">' + counts + '</div>' +
      '</section>';

    S.groups.forEach(function (g) {
      var items = S.entries.filter(function (e) { return e.group === g.id; });
      if (!items.length) return;
      html += '<section class="group"><h2>' + esc(g.title) + '</h2><div class="cards">';
      items.forEach(function (e) {
        html += '<article class="card">' +
          '<a class="card-hit" href="#/' + esc(e.id) + '" aria-label="Read the ' + esc(entryLabel(e)) + ' report"></a>' +
          '<p class="num">' + esc(entryLabel(e)) + '</p>' +
          '<h3>' + esc(e.title) + '</h3>' +
          '<p class="sum">' + esc(e.summary) + '</p>' + tags(e) +
          '<div class="card-foot"><span class="read">Read report &rarr;</span>' + liveButtons(e, 'chip') + '</div>' +
        '</article>';
      });
      html += '</div></section>';
    });

    html += '<section class="group"><h2>Running them locally</h2><div class="table-wrap"><table class="plain">' +
      '<thead><tr><th>Kind</th><th>How</th></tr></thead><tbody>' +
      '<tr><td>Static pages (Exp 01-08, 09-11 pages, Task 5, Assignment 1)</td><td><code>py -3 -m http.server 8000</code> from the folder</td></tr>' +
      '<tr><td>Node (Exp 09-11 API, 12, 12B, 13, 13A, 13B, Exam 01, Tasks 1, 4, 6)</td><td><code>npm install</code> then <code>npm start</code>; the port is in the folder\'s README</td></tr>' +
      '<tr><td>Python (Exp 15, Tasks 2, 3, 6)</td><td>A virtual environment, <code>pip install -r requirements.txt</code>, then the README\'s command</td></tr>' +
      '<tr><td>MongoDB (Exp 13, 13A, 13B, Exam 01)</td><td>A MongoDB server on <code>localhost:27017</code></td></tr>' +
      '<tr><td>PostgreSQL (Exp 14, Assignment 2)</td><td>Postgres in Docker; the commands are in the folder</td></tr>' +
      '</tbody></table></div></section>';

    main.innerHTML = html;
    document.title = S.course + ' (' + S.code + ') | ' + S.student;
    setActive(null);
  }

  function renderDoc(doc) {
    var main = $('#main');
    var e = doc.entry;
    var title = e ? e.title : doc.src.split('/').pop();
    var idx = e ? S.entries.indexOf(e) : -1;
    var prev = idx > 0 ? S.entries[idx - 1] : null;
    var next = idx >= 0 && idx < S.entries.length - 1 ? S.entries[idx + 1] : null;

    main.innerHTML =
      '<div class="doc-layout"><div class="doc-col">' +
      '<nav class="crumbs"><a href="#/">Overview</a><span>/</span>' +
        (e ? '<span>' + esc(groupOf(e.group).title) + '</span>' : '<span>' + esc(dirOf(doc.src).replace(/\/$/, '')) + '</span>') + '</nav>' +
      '<header class="doc-head">' +
        (e ? '<p class="num">' + esc(entryLabel(e)) + '</p>' : '') +
        '<h1>' + esc(title) + '</h1>' +
        (e ? '<p class="sum">' + esc(e.summary) + '</p>' + tags(e) : '') +
        '<div class="doc-actions">' +
          (e ? liveButtons(e, 'btn primary') : '') +
          '<a class="btn" href="' + sourceUrl(doc) + '" target="_blank" rel="noopener">' + icon('github') + 'Source</a>' +
          '<button class="btn" type="button" data-action="print-doc">' + icon('download') + 'Download PDF</button>' +
          '<button class="btn" type="button" data-action="download-md">' + icon('file') + 'README.md</button>' +
        '</div>' +
      '</header>' +
      '<div id="doc-body" class="doc-body"><p class="loading">Loading the README&hellip;</p></div>' +
      '<nav class="pager">' +
        (prev ? '<a href="#/' + esc(prev.id) + '"><small>Previous</small>' + esc(entryLabel(prev) + ': ' + prev.title) + '</a>' : '<span></span>') +
        (next ? '<a class="next" href="#/' + esc(next.id) + '"><small>Next</small>' + esc(entryLabel(next) + ': ' + next.title) + '</a>' : '<span></span>') +
      '</nav></div>' +
      '<aside class="toc" id="toc" aria-label="On this page"></aside></div>';

    document.title = (e ? entryLabel(e) + ': ' + title : title) + ' | ' + S.course;
    setActive(e ? e.id : null);
    main.scrollTop = 0; window.scrollTo(0, 0);
    current = doc;

    fetchMd(doc).then(function (md) {
      if (current !== doc) return;
      var art = renderMarkdown(md, doc, { dropH1: !!e });
      var body = $('#doc-body');
      body.innerHTML = '';
      body.appendChild(art);
      var heads = art.querySelectorAll('h2, h3');
      if (heads.length > 2) {
        var t = '<p>On this page</p><ul>';
        heads.forEach(function (h) { t += '<li class="' + h.tagName.toLowerCase() + '"><a data-anchor="' + h.id + '" href="#' + h.id + '">' + esc(h.textContent) + '</a></li>'; });
        $('#toc').innerHTML = t + '</ul>';
      }
    }).catch(function (err) {
      if (current !== doc) return;
      $('#doc-body').innerHTML = '<p class="error">' + esc(err.message) + '. <a href="' + sourceUrl(doc) + '" target="_blank" rel="noopener">Open it on GitHub</a>.</p>';
    });
  }

  var current = null;

  function route() {
    var h = decodeURI(location.hash.replace(/^#\/?/, ''));
    closeNav();
    if (!h) { current = null; return renderHome(); }
    if (h.indexOf('doc/') === 0) {
      var path = h.slice(4);
      var owner = S.entries.find(function (e) { return !e.remote && path.indexOf(e.id + '/') === 0; });
      return renderDoc(docFor(owner && path === owner.id + '/README.md' ? owner : null, path));
    }
    var e = entryById(h);
    if (e) return renderDoc(docFor(e));
    renderHome();
  }

  // ---------- sidebar ----------

  function buildNav() {
    var nav = $('#nav-list');
    var html = '<a class="nav-home" href="#/">Overview</a>';
    S.groups.forEach(function (g) {
      var items = S.entries.filter(function (e) { return e.group === g.id; });
      if (!items.length) return;
      html += '<div class="nav-group" data-group="' + g.id + '"><p>' + esc(g.title) + '</p><ul>';
      items.forEach(function (e) {
        var hay = (e.num + ' ' + e.title + ' ' + e.summary + ' ' + e.stack.join(' ')).toLowerCase();
        html += '<li data-hay="' + esc(hay) + '"><a href="#/' + esc(e.id) + '" data-id="' + esc(e.id) + '">' +
          '<span class="n">' + esc(e.num) + '</span><span class="t">' + esc(e.title) + '</span>' +
          (e.live && e.live.length && !e.remote ? '<span class="dot" title="Has a live page"></span>' : '') + '</a></li>';
      });
      html += '</ul></div>';
    });
    nav.innerHTML = html;
  }

  function setActive(id) {
    document.querySelectorAll('#nav-list a').forEach(function (a) {
      var on = id ? a.getAttribute('data-id') === id : a.classList.contains('nav-home');
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function filterNav(q) {
    q = q.trim().toLowerCase();
    document.querySelectorAll('#nav-list .nav-group').forEach(function (g) {
      var any = false;
      g.querySelectorAll('li').forEach(function (li) {
        var hit = !q || li.getAttribute('data-hay').indexOf(q) >= 0;
        li.hidden = !hit; any = any || hit;
      });
      g.hidden = !any;
    });
  }

  function openNav() { document.body.classList.add('nav-open'); }
  function closeNav() { document.body.classList.remove('nav-open'); }

  // ---------- theme ----------

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function applyTheme(t) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next); store('bd-theme', next);
  }

  function icon(name) {
    var p = {
      download: '<path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14"/>',
      github: '<path d="M9 19c-4 1.3-4-2-6-2.5m12 5v-3.4a3 3 0 0 0-.8-2.3c2.7-.3 5.6-1.3 5.6-6a4.7 4.7 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.6 2.1 5.6 2.4 5.6 2.4a4.3 4.3 0 0 0-.1 3.2A4.7 4.7 0 0 0 4.2 8.8c0 4.6 2.9 5.7 5.6 6a3 3 0 0 0-.8 2.3V22"/>',
      file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    }[name];
    return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>';
  }

  // ---------- wiring ----------

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-anchor]');
    if (a) {
      var t = document.getElementById(a.getAttribute('data-anchor'));
      if (t) { ev.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      return;
    }
    var b = ev.target.closest('[data-action]');
    if (!b) return;
    var act = b.getAttribute('data-action');
    if (act === 'print-all') { b.disabled = true; printAll().finally(function () { b.disabled = false; }); }
    else if (act === 'print-doc' && current) { b.disabled = true; printDoc(current).finally(function () { b.disabled = false; }); }
    else if (act === 'download-md' && current) {
      var d = current;
      fetchMd(d).then(function (md) { downloadText(fileBase(d.entry) + '_README.md', md); });
    }
    else if (act === 'theme') toggleTheme();
    else if (act === 'nav') document.body.classList.contains('nav-open') ? closeNav() : openNav();
    else if (act === 'nav-close') closeNav();
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') closeNav();
    if (ev.key === '/' && document.activeElement.tagName !== 'INPUT') { ev.preventDefault(); $('#nav-search').focus(); }
  });

  $('#nav-search').addEventListener('input', function (ev) { filterNav(ev.target.value); });
  window.addEventListener('hashchange', route);

  applyTheme(store('bd-theme'));
  buildNav();
  route();
})();
