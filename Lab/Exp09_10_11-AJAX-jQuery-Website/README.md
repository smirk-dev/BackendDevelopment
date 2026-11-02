# Experiments 09, 10 and 11 — AJAX, XML, JSON, jQuery and an Ajax website

Manual: `Lectures/Backend Development/Lab/Exp 09_10_11.md` — "Asynchronous Data Exchange and
Interactive Web Development Using AJAX, XML, JSON, jQuery, HTML, CSS and JavaScript". The manual
covers the three experiments as one project, so this is one folder:

| Experiment (list of experiments) | Where |
|----------------------------------|-------|
| Manual Parts A-F, the "Student Directory" walkthrough | `manual/part-c-d/` (fetch for JSON and XML) and `manual/part-e-f/` (jQuery `$.ajax` for JSON, fetch for XML) — the manual's code, unchanged |
| **09** Programs using AJAX with HTML, XML and JSON data | `exp09-ajax/` — each format with `XMLHttpRequest` and with `fetch()`, five failure cases, POSTing JSON |
| **10** Programs to familiarize jQuery (2 programs) | `exp10-jquery/program1-dom.html` (selectors, DOM manipulation, events, effects) and `exp10-jquery/program2-ajax.html` (`$.ajax`, `$.getJSON`, `$.get` + XML, `.load()`, `$.when`, POST, `.fail()`) |
| **11** Website with HTML, CSS and JavaScript (implement Ajax) | `exp11-website/` — "Campus Directory": every page body, record and count arrives by AJAX; Practice Tasks 1-5 |
| Practice Task 5, backend integration | `server.js` — Express API over the same records; also serves every page |
| Section 7 observation table | measured live on `exp11-website/#about` (Fetch vs jQuery: status, format, record count, duration) |

`index.html` is a landing page that links all of it.

## Practice tasks (manual section 10)

| Task | Done in |
|------|---------|
| 1 — add email and semester to every record, in JSON and XML; show them | `exp11-website/data/students.json` + `students.xml` (8 students); five-column tables everywhere |
| 2 — search box filtering by name without another request | Students page: filters the loaded array, highlights the match with `<mark>` built from text nodes, "showing N of M" in a live region |
| 3 — load one course, with JavaScript and then with jQuery | Students page: "Load course (JavaScript)" = `fetch` + `Array.filter`; "Load course (jQuery)" = `$.getJSON` + `$.grep`. Also Program 2 of Exp 10 |
| 4 — course directory, at least five courses, via AJAX | `exp11-website/data/courses.json` (7 courses) → Courses page with a semester filter; Program 2's catalogue |
| 5 — replace the static file with a real backend | `server.js` (Express 5): `/api/students` (with `?course=` and `?q=`), `/api/students/:id`, `/api/courses`, `POST /api/echo`. The Students page has a data-source switch: static JSON / static XML / API |
| 6 — AI-assisted review | at the end of this file |

## Run

```bash
npm install
npm start                 # http://localhost:3000   (PORT=3001 npm start if 3000 is busy)
```

Everything except the API also works from any static server (`py -3 -m http.server`); the pages
then say the backend is off instead of failing silently. Opening the files from disk (`file://`)
does not work — the browser blocks the requests, as the manual warns.

## Deviations from the manual

- **jQuery is vendored, not loaded from the CDN.** The manual's
  `<script src="https://code.jquery.com/jquery-3.7.1.min.js">` is `../../vendor/jquery-3.7.1.min.js`
  here (the repo's no-CDN rule: a lab submission must work offline). The file was downloaded from
  that same URL and its SHA-256 matches jQuery's published SRI hash,
  `sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=`. That line is the only change inside `manual/`.
- **Two folders instead of one evolving project.** The manual edits one project in place (Part E
  *replaces* the fetch JSON handler with the jQuery one). To keep both versions runnable,
  `part-c-d/` holds the code as it stands after Part D and `part-e-f/` as it stands after Part E.
  Every code block of Parts B-E was checked by script to appear verbatim in the matching folder.
- Part A's folder name `Experiment09_11` became `manual/` inside the experiment folder.
- The full builds (`exp09-ajax/`, `exp10-jquery/`, `exp11-website/`) use the repo's visual register
  (warm paper, one accent, serif headings) instead of the manual's blue-grey `style.css`, which is
  kept unchanged in `manual/`.
- Course codes in `courses.json` are neutral placeholders (`C101`…), not real catalogue codes.

## Checks run

All against `PORT=3033 npm start` (Express 5.3.0, Node v22.23.2). Pages were driven in headless
Chrome 158 over the DevTools protocol: every button clicked, every status line and table read back.
Zero horizontal overflow at 1280 px and at 375 px on every page.

### Backend (curl)

```text
$ curl -i "http://localhost:3033/api/students?course=BCA"
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
{"count":2,"students":[{"id":104,"name":"Ananya","course":"BCA","email":"ananya.104@stu.upes.ac.in","semester":1},{"id":107,"name":"Vihaan","course":"BCA","email":"vihaan.107@stu.upes.ac.in","semester":3}]}

$ curl -i "http://localhost:3033/api/students?q=aa"
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
{"count":3,"students":[{"id":101,"name":"Aarav","course":"B.Tech CSE","email":"aarav.101@stu.upes.ac.in","semester":5},{"id":107,"name":"Vihaan","course":"BCA","email":"vihaan.107@stu.upes.ac.in","semester":3},{"id":108,"name":"Saanvi","course":"B.Tech CSE (AI & ML)","email":"saanvi.108@stu.upes.ac.in","semester":1}]}

$ curl -i "http://localhost:3033/api/students/101"
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
{"id":101,"name":"Aarav","course":"B.Tech CSE","email":"aarav.101@stu.upes.ac.in","semester":5}

$ curl -i "http://localhost:3033/api/students/999"
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
{"error":"No student with id 999"}

$ curl -i "http://localhost:3033/api/nope"
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
{"error":"Unknown API route"}

$ curl -s http://localhost:3033/api/students | node -p "JSON.parse(require('fs').readFileSync(0)).count"
8

$ curl -s http://localhost:3033/api/courses | node -p "JSON.parse(require('fs').readFileSync(0)).courses.map(c => c.title).join(', ')"
Backend Development, Discrete Mathematics, Database Management Systems, Object Oriented Programming, Operating Systems, Frontend Development, Data Communication and Networks

$ curl -i -X POST http://localhost:3033/api/echo -H 'Content-Type: application/json' -d '{"name":"Suryansh","semester":5}'
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
{"received":{"name":"Suryansh","semester":5},"receivedAt":"2026-11-02T07:27:23.301Z"}

$ curl -s -o /dev/null -w '%{http_code} %{content_type}\n' http://localhost:3033/exp11-website/data/students.xml
200 application/xml
```

### Manual walkthrough

Both stages, JSON button then XML button:

```text
part-c-d  JSON → "JSON data loaded successfully."   XML → "XML data loaded successfully."
part-e-f  JSON → "JSON data loaded using jQuery."   XML → "XML data loaded successfully."   (jQuery 3.7.1 loaded)
rows, both stages, both buttons: 101 | Aarav | B.Tech CSE · 102 | Meera | B.Tech IT · 103 | Kabir | B.Tech CSE
students.json requested once per click (no duplicate handler — the manual's Part E warning)
```

The manual's deliberate-error steps (Part D step 6, Part F step 5), done for real: `students.json`
renamed and `</students>` broken in `students.xml`, then both restored:

```text
part-c-d  JSON → "Error: HTTP error: 404"       XML → "Error: The XML document is invalid."
part-e-f  JSON → "Request failed: Not Found"    XML → "Error: The XML document is invalid."
```

### Experiment 09 — AJAX with HTML, XML and JSON

```text
xhr-html   → Loaded 307 characters of HTML (status 200).
xhr-xml    → Parsed 8 <student> elements from responseXML (root <students>).
xhr-json   → Received 8 students as a ready-made object.
fetch-html → Loaded 307 characters of HTML.
fetch-xml  → DOMParser read 8 students.
fetch-json → response.json() returned 8 students.
HTML fragment inserted by both: <h3>Lab notice</h3>; XHR and fetch tables identical: true

XMLHttpRequest readyState log (first request):
GET data/notice.html (responseType "text")
  readyState 1
  readyState 2  status 200
  readyState 3  status 200
  readyState 4  status 200

Error section:
XHR  data/missing.json → onload fired anyway, status 404: the code must check xhr.status itself.
fetch data/missing.json → promise RESOLVED with ok=false, status 404: fetch does not reject on 404.
DOMParser data/broken.xml → parsererror element present: "This page contains the following errors:error on line 8 at column 12: Opening and ending t"
response.json() data/broken.json → rejected with SyntaxError: Expected double-quoted property name in JSON at position 46 (line 1 column 47)
fetch to an unreachable server → REJECTED with TypeError: Failed to fetch (only network failures reject)

POST /api/echo with XHR   → Server echoed the JSON back (201 Created).
POST /api/echo with fetch → Server echoed the JSON back (201 Created).
```

The only console messages on this page were the three that the error buttons cause on purpose (two
404s for `missing.json`, and `net::ERR_UNSAFE_PORT` — Chrome refuses port 9 before connecting,
which `fetch` reports exactly like an unreachable server).

### Experiment 10 — Program 1 (jQuery DOM, events, effects)

```text
added via form:      ["HTML5 semantic elements","CSS flexbox and grid","ES6 modules","Express middleware"]
delegated clicks:    ["HTML5 semantic elements [done]","CSS flexbox and grid","ES6 modules","Express middleware [done]"]  → 4 topic(s), 2 done.
dblclick removed:    ["HTML5 semantic elements [done]","ES6 modules","Express middleware [done]"]
.each() + :even:     ["1. HTML5 semantic elements [done] [hl]","2. ES6 modules","3. Express middleware [done] [hl]"]
remove done:         ["2. ES6 modules"]  → 1 topic(s), 0 done.
live counter:        18 / 40 (a blank topic was ignored)
toggle → hidden:     .toggle(): visible=false, left=auto, width=96px, class="demo-box", title="the demo box"
animate mid-flight:  left=99.6787px; at the end: .animate() there and back: visible=true, left=0px, width=96px, class="demo-box", title="the demo box"
css/toggleClass:     .toggleClass() + .css(): visible=true, left=0px, width=96px, class="demo-box outlined", title="the demo box"
attr:                .attr(): visible=true, left=0px, width=96px, class="demo-box outlined", title="renamed with .attr()" aria-label=renamed with .attr()
hover:               "mouseenter — handler ran"; .one() clicked 3x → ran 1x; after .off(): "hover handlers removed with .off()"
```

### Experiment 10 — Program 2 (jQuery AJAX)

```text
dropdown (from data): (all), B.Tech CSE, B.Tech CSE (AI & ML), B.Tech IT, BCA
$.ajax + $.grep BCA:  2 student(s) in BCA (filtered with $.grep). ["Ananya / BCA","Vihaan / BCA"]
$.getJSON courses:    7 courses loaded with $.getJSON.
$.get XML:            8 <student> nodes read with $(xml).find(). First: 101 — Aarav (B.Tech CSE, sem 5)
.load("... #tip"):    #tip inserted true, #not-loaded inserted false
$.when:               Both finished: 8 students and 7 courses.
POST:                 Server echoed the student back (201 Created).
.fail():              .fail() ran: status 404, textStatus "error", error "Not Found".
ajaxStart/ajaxStop marker off at the end: true
```

The only console message was the intentional 404 for `data/missing.json`.

### Experiment 11 — Campus Directory

```text
home tiles:        {"students":"8","courses":"7","programmes":"4","backend":"online","current":"Home"}
source json        8 students loaded from data/students.json (JSON) in N ms — no page reload.  first row: 101 | Aarav | B.Tech CSE | aarav.101@stu.upes.ac.in | 5
source xml         8 students loaded from data/students.xml (XML) in N ms — no page reload.  first row: 101 | Aarav | B.Tech CSE | aarav.101@stu.upes.ac.in | 5
source api         8 students loaded from /api/students (API) in N ms — no page reload.  first row: 101 | Aarav | B.Tech CSE | aarav.101@stu.upes.ac.in | 5
search "aa":       showing 3 of 8, <mark>s ["Aa","aa","aa"], new requests while typing: 0
search "zzz":      showing 0 of 8 → No matching students.
course, no pick:   Choose a course first.
course (JS):       2 student(s) in B.Tech IT — fetch() + Array.filter().
course (jQuery):   2 student(s) in B.Tech CSE (AI & ML) — $.getJSON() + $.grep().
courses page:      7 courses loaded with AJAX.; semester 3 → 3 of 7 courses ["Discrete Mathematics","Database Management Systems","Operating Systems"]
navigation:        full page loads during the whole run = 1; Back button → courses; focus moved to <main id="view">

Observation table, measured (Observation | Fetch API | jQuery AJAX):
Library required | No additional library | jQuery 3.7.1
Request method used | GET | GET
JSON parsing | response.json() | dataType: "json"
Success handling | try / await | success callback
Error handling | catch and status check | error callback
DOM manipulation | Native JavaScript | jQuery or native JavaScript
HTTP status | 200 OK | 200 OK
Response format | application/json; charset=utf-8 | application/json; charset=utf-8
Records received | 8 | 8
Duration | 4.1 ms | 5.8 ms
```

Zero console errors. The same site from a plain static server (no backend): the home tile reads
`off (404)`, choosing the API source shows "Error: HTTP error: 404 for /api/students. Start the
backend with npm start.", and the JSON and XML sources keep working.

Screenshots (`screenshots/`, each at 1280 and 375 px): `index`, `manual-part-c-d`,
`manual-part-e-f`, `exp09-ajax`, `exp10-program1`, `exp10-program2`, `exp11-home`,
`exp11-students` (API source, search "an"), `exp11-courses`, `exp11-about` (measured table).

## Practice Task 6 — AI-assisted review

I asked an AI coding assistant to review the finished code, checked each suggestion myself, and
recorded the decision:

| Suggestion | Verified? | Decision |
|------------|-----------|----------|
| The Students page attached its click handlers only after an extra request (for the course dropdown) finished, so an early click on "Load students" could be lost | Checked in the code: the handlers were registered after an `await`ed request, so a click in that window had no listener to reach | **Accepted** — handlers are wired first, the dropdown fills afterwards |
| Search should not re-request the data | Checked with `performance.getEntriesByType('resource')`: 0 new requests while typing | Already true — no change |
| Build table rows with `innerHTML` and a template string, for brevity | A name such as `<img src=x onerror=...>` in the data would then run as HTML | **Rejected** — rows use `textContent`; the search highlight uses text nodes and `<mark>` |
| The manual's pages request `/favicon.ico` and log a 404 | Seen in the console on the first run | **Accepted** in the server (`204` for `/favicon.ico`), so the manual's HTML stays unchanged |
| Fall back to the jQuery CDN if the local copy fails to load | The local copy comes from the same server as the page, so it cannot fail on its own | **Rejected** — it would also break the offline rule |
