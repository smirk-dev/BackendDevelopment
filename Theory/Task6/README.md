# Theory Task 6 — Server-Side Rendering and Templating Engines

**Lecture:** Unit 1, **L08 Server-Side Rendering and Templating Engines** (Parts B, C and D and all
five Lab Exercises). Student: Suryansh Mishra (590012069), `smirk-dev`.

The same pages built twice, once with **Express + EJS** and once with **FastAPI + Jinja2**, so the
two template languages can be compared side by side. In both, the server sends finished HTML and the
browser runs no script to fill it in.

## Folders

```
Task6/
├── express-ejs/
│   ├── app.js                    # /, /students, /dashboard, /about, 404
│   ├── views/                    # home, students, dashboard, about + partials/header, partials/footer
│   └── public/                   # css/style.css, css/students.css, images/logo.svg  (served at /)
├── fastapi-jinja/
│   ├── main.py                   # /, /students, /now, /gallery
│   ├── templates/                # base.html + home, students, now, gallery (all {% extends "base.html" %})
│   └── static/                   # css/style.css, images/server-rack.svg  (mounted at /static)
└── screenshots/
```

## Lecture and lab coverage

| L08 item | Express + EJS | FastAPI + Jinja2 |
|---|---|---|
| Hello World (§9, §13) | `GET /` → `Hello, <%= name %>!` | `GET /` → `Hello, {{ name }}!` |
| Static page converted to a template (§10, §14) | `students.ejs` with `forEach` | `students.html` with `{% for %}` |
| Conditionals and loops (§11) | `/dashboard`, `if/else` + `for` loop, `?branch=civil` hits the empty branch | `{% if students\|length == 0 %}`, `?empty=1` |
| Includes (§11, §15) | `<%- include("partials/header") %>` | `{% extends "base.html" %}` blocks |
| Server function in a template (§11) | `app.locals.upperCase` | the `\|upper` filter |
| Static files (§17, §18) | `express.static("public")` at `/` | `StaticFiles` mounted at `/static` |
| **Lab 1** table with alternating row colours | `row-even` / `row-odd` from `index % 2` | `loop.cycle('row-even', 'row-odd')` |
| **Lab 2** `/about` with course and lecturer variables | `GET /about` | — |
| **Lab 3** current date and time via `{{ now }}` | — | `GET /now` |
| **Lab 4** custom CSS changing the student page's background and font | `public/css/students.css`, loaded only by `/students` | — |
| **Lab 5** image from `static/images/` in a template | — | `GET /gallery` |

## Run

```bash
cd Task6/express-ejs
npm install
npm start                       # http://localhost:3000   (PORT=3047 npm start)

cd Task6/fastapi-jinja
pip install -r requirements.txt
uvicorn main:app --reload       # http://localhost:8000   (python main.py also works)
```

## Checks run

Express on 3047, FastAPI on 3048 (`python -m uvicorn main:app --port 3048`). Key lines of each
response as curl received them:

```
$ curl -s http://localhost:3047/students
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/students.css">
<h1>Student List</h1>
<tr class="row-even"> <td>1</td> <td>Aarav</td> <td>CSE</td>
<tr class="row-odd">  <td>2</td> <td>Diya</td>  <td>ECE</td>
<tr class="row-even"> <td>3</td> <td>Rohan</td> <td>IT</td>
<tr class="row-odd">  <td>4</td> <td>Meera</td> <td>CSE</td>
<tr class="row-even"> <td>5</td> <td>Kabir</td> <td>ME</td>
[200 text/html; charset=utf-8]

$ curl -s "http://localhost:3047/dashboard?branch=cse"
<p class="lede">Filtered to branch CSE. <a href="/dashboard">Show all</a></p>
<p>Total students: <strong>2</strong></p>
<tr><td>1</td><td>AARAV</td><td>CSE</td></tr>
<tr><td>4</td><td>MEERA</td><td>CSE</td></tr>

$ curl -s "http://localhost:3047/dashboard?branch=civil"
<p class="empty">No students found.</p>

$ curl -s http://localhost:3047/about
<dt>Course</dt><dd>Backend Development (CSFS3008P)</dd>
<dt>Lecturer</dt><dd>Dr. Prateek Raj Gautam</dd>
<dt>Semester</dt><dd>B.Tech Semester 5</dd>
[200 text/html; charset=utf-8]

$ curl -s http://localhost:3047/nope           -> [404 text/html]  <dd>No page at /nope</dd>
$ curl -s http://localhost:3047/css/students.css -> [200 text/css; charset=utf-8]
```

```
$ curl -s http://127.0.0.1:3048/students
<link rel="stylesheet" href="http://127.0.0.1:3048/static/css/style.css">
<p>Total students: 3</p>
<tr class="row-even"> <td>1</td> <td>AARAV</td> <td>CSE</td>
<tr class="row-odd">  <td>2</td> <td>DIYA</td>  <td>ECE</td>
<tr class="row-even"> <td>3</td> <td>ROHAN</td> <td>IT</td>

$ curl -s "http://127.0.0.1:3048/students?empty=1"
<p class="empty">No students found.</p>

$ curl -s http://127.0.0.1:3048/now
<h1>Server time</h1>
<p class="big">Sunday, 30 August 2026, 12:54:49</p>

$ curl -s http://127.0.0.1:3048/gallery
<img src="http://127.0.0.1:3048/static/images/server-rack.svg" alt="Line drawing of a server rack with three units" width="320" height="240">

svg: 200 image/svg+xml 852 bytes
```

Computed styles read in headless Chrome, to prove Lab 1 and Lab 4 actually apply:

```
EJS /students computed: body = rgb(244, 239, 227) / Georgia, "Times New Roman", serif
                        row-even = rgb(251, 249, 244), row-odd = rgb(236, 227, 208)
EJS /about body (no students.css): rgb(251, 249, 244) / "Segoe UI", Roboto, Arial, sans-serif
Jinja /gallery image: {"complete":true,"naturalWidth":320,"src":"http://127.0.0.1:3048/static/images/server-rack.svg"}
console errors: none
```

Screenshots: `ejs-students.png`, `ejs-about.png`, `ejs-dashboard-empty.png`, `jinja-students.png`,
`jinja-now.png`, `jinja-gallery.png` in `screenshots/`. Both servers were stopped afterwards.

## Notes

- Jinja2's `url_for('static', ...)` writes absolute URLs that include the host and port the
  request came in on. EJS paths are plain `/css/...` because Express serves `public/` at the root.
- `TemplateResponse(request, name, context)` is the current Starlette signature. The older
  `TemplateResponse(name, {"request": request, ...})` form in parts of the lecture still runs but
  prints a deprecation warning.
- The server-rack image is a hand-written SVG, so the folder needs no binary assets.
