// Exp 11 — Campus Directory. Every page body and every record arrives by AJAX.
'use strict';

const view = document.getElementById('view');
const viewStatus = document.getElementById('view-status');
const $id = id => document.getElementById(id);

const SOURCES = {
  json: 'data/students.json',
  xml: 'data/students.xml',
  api: '/api/students'          // Practice Task 5: the Express backend in ../server.js
};

/* ---------------- shared helpers ---------------- */

async function getOk(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error: ${response.status} for ${url}`);
  return response;
}

function setStatus(el, text, kind) {
  el.textContent = text;
  el.className = 'status' + (kind ? ' ' + kind : '');
}

function parseStudentsXml(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('The XML document is invalid.');
  return Array.from(doc.querySelectorAll('student')).map(n => ({
    id: Number(n.getAttribute('id')),
    name: n.querySelector('name').textContent,
    course: n.querySelector('course').textContent,
    email: n.querySelector('email').textContent,
    semester: Number(n.querySelector('semester').textContent)
  }));
}

// Load students from any of the three sources and normalise to an array.
async function loadStudents(source) {
  const response = await getOk(SOURCES[source]);
  if (source === 'xml') return parseStudentsXml(await response.text());
  const data = await response.json();
  return data.students;
}

/* ---------------- router: hash → partial ---------------- */

const pages = { home: initHome, students: initStudents, courses: initCourses, about: initAbout };

async function showPage() {
  const name = (location.hash.slice(1) || 'home');
  const page = pages[name] ? name : 'home';
  document.querySelectorAll('#site-nav a[data-view]').forEach(a => {
    if (a.dataset.view === page) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  setStatus(viewStatus, `Loading ${page}…`, 'busy');
  try {
    const html = await (await getOk(`partials/${page}.html`)).text();
    view.innerHTML = html;                       // our own partials, not user data
    viewStatus.textContent = '';
    document.title = `${page[0].toUpperCase() + page.slice(1)} — Campus Directory`;
    await pages[page]();
    if (window.__routed) view.focus();          // move focus for keyboard/screen-reader users
    window.__routed = true;
    view.dataset.page = page;
  } catch (err) {
    setStatus(viewStatus, `Could not load the ${page} page: ${err.message}`, 'err');
  }
}

window.addEventListener('hashchange', showPage);
showPage();

/* ---------------- Home: counts from AJAX ---------------- */

async function initHome() {
  try {
    const [students, courses] = await Promise.all([
      loadStudents('json'),
      getOk('data/courses.json').then(r => r.json())
    ]);
    $id('stat-students').textContent = students.length;
    $id('stat-courses').textContent = courses.courses.length;
    $id('stat-programmes').textContent = new Set(students.map(s => s.course)).size;
  } catch (err) {
    $id('stat-students').textContent = '!';
  }
  try {
    const r = await fetch('/api/students');
    $id('stat-backend').textContent = r.ok ? 'online' : `off (${r.status})`;
  } catch {
    $id('stat-backend').textContent = 'off';
  }
}

/* ---------------- Students ---------------- */

let loaded = [];            // records currently in the table, used by the name search

function renderRows(students) {
  const tbody = $id('student-rows');
  tbody.replaceChildren();
  if (!students.length) {
    tbody.innerHTML = '<tr class="empty"><td colspan="5">No matching students.</td></tr>';
    return;
  }
  const term = $id('search').value.trim().toLowerCase();
  for (const s of students) {
    const tr = document.createElement('tr');
    [s.id, s.name, s.course, s.email, s.semester].forEach((value, i) => {
      const td = document.createElement('td');
      if (i === 1 && term) highlight(td, String(value), term);
      else td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
}

// Wrap the matched part of the name in <mark>, building nodes (no innerHTML with data).
function highlight(td, text, term) {
  const at = text.toLowerCase().indexOf(term);
  if (at < 0) { td.textContent = text; return; }
  const mark = document.createElement('mark');
  mark.textContent = text.slice(at, at + term.length);
  td.append(text.slice(0, at), mark, text.slice(at + term.length));
}

// Practice Task 2: filter what is already loaded — no new request.
function applySearch() {
  const term = $id('search').value.trim().toLowerCase();
  const shown = term ? loaded.filter(s => s.name.toLowerCase().includes(term)) : loaded;
  renderRows(shown);
  $id('search-count').textContent = loaded.length ? `showing ${shown.length} of ${loaded.length}` : '';
}

async function initStudents() {
  const status = $id('students-status');
  loaded = [];


  $id('load-all').addEventListener('click', async () => {
    const source = $id('source').value;
    setStatus(status, `Loading from ${SOURCES[source]}…`, 'busy');
    try {
      const started = performance.now();
      loaded = await loadStudents(source);
      applySearch();
      setStatus(status, `${loaded.length} students loaded from ${SOURCES[source]} (${source.toUpperCase()}) in ${Math.round(performance.now() - started)} ms — no page reload.`, 'ok');
    } catch (err) {
      loaded = [];
      applySearch();
      const hint = source === 'api' ? ' Start the backend with npm start.' : '';
      setStatus(status, `Error: ${err.message}.${hint}`, 'err');
    }
  });

  $id('search').addEventListener('input', applySearch);

  // Practice Task 3, plain JavaScript: fetch, then Array.prototype.filter.
  $id('course-js').addEventListener('click', async () => {
    const course = $id('course-pick').value;
    if (!course) { setStatus(status, 'Choose a course first.', 'err'); $id('course-pick').focus(); return; }
    setStatus(status, `Loading ${course} (JavaScript)…`, 'busy');
    try {
      const response = await getOk(SOURCES.json);
      const data = await response.json();
      loaded = data.students.filter(s => s.course === course);
      applySearch();
      setStatus(status, `${loaded.length} student(s) in ${course} — fetch() + Array.filter().`, 'ok');
    } catch (err) {
      setStatus(status, `Error: ${err.message}`, 'err');
    }
  });

  // Practice Task 3, jQuery: $.getJSON, then $.grep.
  $('#course-jq').on('click', function () {
    const course = $('#course-pick').val();
    if (!course) { setStatus(status, 'Choose a course first.', 'err'); $('#course-pick').trigger('focus'); return; }
    setStatus(status, `Loading ${course} (jQuery)…`, 'busy');
    $.getJSON(SOURCES.json)
      .done(function (data) {
        loaded = $.grep(data.students, s => s.course === course);
        applySearch();
        setStatus(status, `${loaded.length} student(s) in ${course} — $.getJSON() + $.grep().`, 'ok');
      })
      .fail(function (xhr, textStatus, error) {
        setStatus(status, `Request failed: ${error || textStatus}`, 'err');
      });
  });

  // Course dropdown filled from the data (after the handlers are wired, so no click is lost).
  try {
    const all = await loadStudents('json');
    [...new Set(all.map(s => s.course))].sort().forEach(c => {
      const o = document.createElement('option');
      o.value = o.textContent = c;
      $id('course-pick').appendChild(o);
    });
  } catch { /* dropdown stays with its placeholder */ }
}

/* ---------------- Courses (Practice Task 4) ---------------- */

async function initCourses() {
  const status = $id('courses-status');
  let courses = [];
  function render() {
    const sem = $id('sem-pick').value;
    const shown = sem ? courses.filter(c => String(c.semester) === sem) : courses;
    const wrap = $id('course-cards');
    wrap.replaceChildren();
    for (const c of shown) {
      const card = document.createElement('article');
      const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = c.code;
      const h = document.createElement('h3'); h.textContent = c.title;
      const p = document.createElement('p'); p.textContent = c.summary;
      const meta = document.createElement('p'); const sm = document.createElement('small');
      sm.textContent = `Semester ${c.semester} · ${c.credits} credits`; meta.appendChild(sm);
      card.append(tag, h, p, meta);
      wrap.appendChild(card);
    }
    $id('course-count').textContent = `${shown.length} of ${courses.length} courses`;
  }
  setStatus(status, 'Loading data/courses.json…', 'busy');
  try {
    courses = (await (await getOk('data/courses.json')).json()).courses;
    [...new Set(courses.map(c => c.semester))].sort((a, b) => a - b).forEach(s => {
      const o = document.createElement('option'); o.value = s; o.textContent = `Semester ${s}`;
      $id('sem-pick').appendChild(o);
    });
    $id('sem-pick').addEventListener('change', render);
    render();
    setStatus(status, `${courses.length} courses loaded with AJAX.`, 'ok');
  } catch (err) {
    setStatus(status, `Error: ${err.message}`, 'err');
  }
}

/* ---------------- About: Fetch vs jQuery measured ---------------- */

function initAbout() {
  $id('jq-version').textContent = $.fn.jquery;
  $id('measure').addEventListener('click', async () => {
    const url = SOURCES.json + '?t=' + Date.now();     // defeat the cache for a fair timing

    let t = performance.now();
    const response = await fetch(url);
    const data = await response.json();
    $id('m-fetch-ms').textContent = `${(performance.now() - t).toFixed(1)} ms`;
    $id('m-fetch-status').textContent = `${response.status} ${response.statusText || 'OK'}`;
    $id('m-fetch-type').textContent = response.headers.get('content-type');
    $id('m-fetch-count').textContent = data.students.length;

    t = performance.now();
    $.ajax({ url: SOURCES.json + '?t=' + Date.now(), method: 'GET', dataType: 'json' })
      .done(function (d, textStatus, xhr) {
        $id('m-jq-ms').textContent = `${(performance.now() - t).toFixed(1)} ms`;
        $id('m-jq-status').textContent = `${xhr.status} ${xhr.statusText}`;
        $id('m-jq-type').textContent = xhr.getResponseHeader('content-type');
        $id('m-jq-count').textContent = d.students.length;
        $id('measure').dataset.done = 'true';
      });
  });
}
