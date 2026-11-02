// Exp 09 — AJAX with HTML, XML and JSON, using XMLHttpRequest and fetch().
'use strict';

const $id = id => document.getElementById(id);

function setStatus(id, text, kind) {
  const el = $id(id);
  el.textContent = text;
  el.className = 'status' + (kind ? ' ' + kind : '');
}

// Shared renderer: values go in with textContent, never as HTML.
function renderStudents(tbodyId, students) {
  const tbody = $id(tbodyId);
  tbody.replaceChildren();
  for (const s of students) {
    const tr = document.createElement('tr');
    for (const v of [s.id, s.name, s.course, s.email, s.semester]) {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

// XML document → array of plain objects.
function studentsFromXml(xmlDoc) {
  return Array.from(xmlDoc.querySelectorAll('student')).map(node => ({
    id: node.getAttribute('id'),
    name: node.querySelector('name')?.textContent ?? '',
    course: node.querySelector('course')?.textContent ?? '',
    email: node.querySelector('email')?.textContent ?? '',
    semester: node.querySelector('semester')?.textContent ?? ''
  }));
}

/* ---------------- 1. XMLHttpRequest ---------------- */

const xhrLog = $id('xhr-log');
function logXhr(line) { xhrLog.textContent += line + '\n'; }

// A small helper so the three XHR demos share the readyState logging.
function xhrGet(url, responseType, onDone, onFail) {
  const xhr = new XMLHttpRequest();
  logXhr(`GET ${url} (responseType "${responseType || 'text'}")`);
  xhr.onreadystatechange = () => logXhr(`  readyState ${xhr.readyState}` + (xhr.readyState >= 2 ? `  status ${xhr.status}` : ''));
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) onDone(xhr);
    else onFail(new Error(`HTTP ${xhr.status} ${xhr.statusText}`));
  };
  xhr.onerror = () => onFail(new Error('Network error — the request never got a response'));
  xhr.open('GET', url);          // asynchronous by default
  if (responseType) xhr.responseType = responseType;
  xhr.send();
}

$id('xhr-html').addEventListener('click', () => {
  setStatus('xhr-html-status', 'Loading HTML…', 'busy');
  xhrGet('data/notice.html', '', xhr => {
    $id('xhr-html-target').innerHTML = xhr.responseText;   // our own trusted fragment
    setStatus('xhr-html-status', `Loaded ${xhr.responseText.length} characters of HTML (status ${xhr.status}).`, 'ok');
  }, err => setStatus('xhr-html-status', 'Error: ' + err.message, 'err'));
});

$id('xhr-xml').addEventListener('click', () => {
  setStatus('xhr-xml-status', 'Loading XML…', 'busy');
  xhrGet('data/students.xml', '', xhr => {
    const doc = xhr.responseXML;                  // already parsed by the browser
    if (!doc || doc.querySelector('parsererror')) {
      setStatus('xhr-xml-status', 'Error: the XML document is invalid.', 'err');
      return;
    }
    const students = studentsFromXml(doc);
    renderStudents('xhr-xml-rows', students);
    setStatus('xhr-xml-status', `Parsed ${students.length} <student> elements from responseXML (root <${doc.documentElement.nodeName}>).`, 'ok');
  }, err => setStatus('xhr-xml-status', 'Error: ' + err.message, 'err'));
});

$id('xhr-json').addEventListener('click', () => {
  setStatus('xhr-json-status', 'Loading JSON…', 'busy');
  xhrGet('data/students.json', 'json', xhr => {
    if (xhr.response === null) {                  // responseType json gives null on bad JSON
      setStatus('xhr-json-status', 'Error: the response was not valid JSON.', 'err');
      return;
    }
    renderStudents('xhr-json-rows', xhr.response.students);
    setStatus('xhr-json-status', `Received ${xhr.response.students.length} students as a ready-made object.`, 'ok');
  }, err => setStatus('xhr-json-status', 'Error: ' + err.message, 'err'));
});

/* ---------------- 2. fetch() ---------------- */

async function fetchOk(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  return response;
}

$id('fetch-html').addEventListener('click', async () => {
  setStatus('fetch-html-status', 'Loading HTML…', 'busy');
  try {
    const html = await (await fetchOk('data/notice.html')).text();
    $id('fetch-html-target').innerHTML = html;
    setStatus('fetch-html-status', `Loaded ${html.length} characters of HTML.`, 'ok');
  } catch (err) {
    setStatus('fetch-html-status', 'Error: ' + err.message, 'err');
  }
});

$id('fetch-xml').addEventListener('click', async () => {
  setStatus('fetch-xml-status', 'Loading XML…', 'busy');
  try {
    const text = await (await fetchOk('data/students.xml')).text();
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('The XML document is invalid.');
    const students = studentsFromXml(doc);
    renderStudents('fetch-xml-rows', students);
    setStatus('fetch-xml-status', `DOMParser read ${students.length} students.`, 'ok');
  } catch (err) {
    setStatus('fetch-xml-status', 'Error: ' + err.message, 'err');
  }
});

$id('fetch-json').addEventListener('click', async () => {
  setStatus('fetch-json-status', 'Loading JSON…', 'busy');
  try {
    const data = await (await fetchOk('data/students.json')).json();
    renderStudents('fetch-json-rows', data.students);
    setStatus('fetch-json-status', `response.json() returned ${data.students.length} students.`, 'ok');
  } catch (err) {
    setStatus('fetch-json-status', 'Error: ' + err.message, 'err');
  }
});

/* ---------------- 3. errors ---------------- */

const errLog = $id('err-log');
function logErr(line) { errLog.textContent += line + '\n'; }

$id('err-404-xhr').addEventListener('click', () => {
  const xhr = new XMLHttpRequest();
  xhr.onload = () => logErr(`XHR  data/missing.json → onload fired anyway, status ${xhr.status}: the code must check xhr.status itself.`);
  xhr.open('GET', 'data/missing.json');
  xhr.send();
});

$id('err-404-fetch').addEventListener('click', async () => {
  const response = await fetch('data/missing.json');
  logErr(`fetch data/missing.json → promise RESOLVED with ok=${response.ok}, status ${response.status}: fetch does not reject on 404.`);
});

$id('err-xml').addEventListener('click', async () => {
  const text = await (await fetchOk('data/broken.xml')).text();
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const error = doc.querySelector('parsererror');
  logErr(`DOMParser data/broken.xml → ${error ? 'parsererror element present: "' + error.textContent.trim().split('\n')[0].slice(0, 90) + '"' : 'parsed?!'}`);
});

$id('err-json').addEventListener('click', async () => {
  try {
    await (await fetchOk('data/broken.json')).json();
    logErr('response.json() data/broken.json → parsed?!');
  } catch (err) {
    logErr(`response.json() data/broken.json → rejected with ${err.name}: ${err.message}`);
  }
});

$id('err-network').addEventListener('click', async () => {
  try {
    await fetch('http://127.0.0.1:9/nothing-listens-here');
    logErr('fetch to port 9 → resolved?!');
  } catch (err) {
    logErr(`fetch to an unreachable server → REJECTED with ${err.name}: ${err.message} (only network failures reject)`);
  }
});

/* ---------------- 4. POST JSON ---------------- */

$id('post-form').addEventListener('submit', e => {
  e.preventDefault();
  const via = e.submitter?.dataset.via || 'fetch';
  const body = { name: $id('post-name').value, course: $id('post-course').value };
  const show = (status, data) => {
    $id('post-out').textContent = `POST /api/echo via ${via}\nrequest body:  ${JSON.stringify(body)}\nstatus:        ${status}\nresponse body: ${JSON.stringify(data, null, 2)}`;
  };
  setStatus('post-status', `Sending with ${via}…`, 'busy');

  if (via === 'xhr') {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/echo');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';
    xhr.onload = () => {
      show(xhr.status, xhr.response);
      setStatus('post-status', xhr.status === 201 ? 'Server echoed the JSON back (201 Created).' : `Error: HTTP ${xhr.status} — is the Express server running (npm start)?`, xhr.status === 201 ? 'ok' : 'err');
    };
    xhr.onerror = () => setStatus('post-status', 'Error: network failure', 'err');
    xhr.send(JSON.stringify(body));
    return;
  }

  fetch('/api/echo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(async response => {
      const data = await response.json().catch(() => null);
      show(response.status, data);
      if (!response.ok) throw new Error(`HTTP ${response.status} — is the Express server running (npm start)?`);
      setStatus('post-status', 'Server echoed the JSON back (201 Created).', 'ok');
    })
    .catch(err => setStatus('post-status', 'Error: ' + err.message, 'err'));
});
