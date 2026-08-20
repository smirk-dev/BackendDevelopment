# Theory Task 1 — Node.js, npm, Express and EJS

**Lecture:** Unit 1, **L03 Setting Up the Backend Environment** (Section 7, Tasks 1–5, and Lab
Exercise 3). Course: Backend Development CSFS3008P, B.Tech Sem 5, UPES.
Student: Suryansh Mishra (590012069), `smirk-dev`.

The first backend server of the course: an Express app that answers with plain text, HTML strings,
JSON and finally EJS templates, all over the same three-student data set.

## What is in the folder

```
Task1/NODE-JS/
├── server.js              # final version (L03 Task 5): EJS pages + text/html/json routes + JSON API
├── steps/
│   ├── 01-hello-world.js  # L03 Task 1
│   ├── 02-multiple-routes.js  # L03 Task 2
│   ├── 03-json.js         # L03 Task 3 + Lab Exercise 3 (/students/branch/:branch)
│   └── 04-html.js         # L03 Task 4 (HTML built as strings)
├── views/                 # home.ejs, students.ejs, student.ejs
├── public/paper.css       # served by express.static
└── screenshots/
```

The lecture rewrites one `server.js` four times. I kept every stage as its own file under `steps/`
so each can still be run and compared, and `server.js` is the last stage.

## The `views/` fix

The templates used to sit in `Task2/views/`, while `Task1/NODE-JS/server.js` called
`res.render("home")`. Express looks for templates in `<current folder>/views`, so both EJS routes
failed with `Failed to lookup view`. Two changes:

1. `home.ejs` and `students.ejs` moved to `Task1/NODE-JS/views/`. **`Task2/views/` was removed**:
   Task 2 is a Flask JSON API and never renders EJS, so a copy there only invites the same mistake
   again.
2. `server.js` now sets `app.set("views", path.join(__dirname, "views"))`, so the server finds its
   templates even when started from another folder (checked below by starting it from `Theory/`).

## Run

```bash
cd Task1/NODE-JS
npm install
npm start                 # http://localhost:3000   (PORT=3040 npm start for another port)
npm run step1             # ...step4 — the earlier stages of the lecture
```

| Route | Response |
|---|---|
| `GET /` | EJS home page |
| `GET /students` | EJS list of students |
| `GET /students/:id` | EJS detail page, 404 page for an unknown id |
| `GET /text`, `/html`, `/json` | one route per response type |
| `GET /api/students`, `/api/students/:id` | JSON (404 JSON for unknown id) |
| `GET /api/students/branch/:branch` | Lab Exercise 3, case-insensitive |

## Checks run

**Before the fix** — the original `server.js` from git, started in a folder with no `views/`:

```
GET / -> 500
Error: Failed to lookup view "students" in views directory "...\t1old\run\views"
```

**After the fix** — `PORT=3040 node Task1/NODE-JS/server.js`, started from `Theory/`:

```
$ curl -i http://localhost:3040/students
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
    <h1>All Students</h1>
    <p class="lede">3 records, rendered on the server with EJS.</p>
            <li><strong><a href="/students/1">Aarav</a></strong> — CSE</li>
            <li><strong><a href="/students/2">Diya</a></strong> — ECE</li>
            <li><strong><a href="/students/3">Rohan</a></strong> — IT</li>

$ curl -i http://localhost:3040/students/9
HTTP/1.1 404 Not Found
        <h1>Student not found</h1>

$ curl -i http://localhost:3040/text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Backend Development — plain text response

$ curl -i http://localhost:3040/json
Content-Type: application/json; charset=utf-8
[{"id":1,"name":"Aarav","branch":"CSE"},{"id":2,"name":"Diya","branch":"ECE"},{"id":3,"name":"Rohan","branch":"IT"}]

$ curl -i http://localhost:3040/api/students/7
HTTP/1.1 404 Not Found
{"error":"Student not found"}

$ curl -i http://localhost:3040/api/students/branch/cse
[{"id":1,"name":"Aarav","branch":"CSE"}]
```

**Each lecture stage** on port 3041 (`route -> body [status]`):

```
=== steps/01-hello-world.js
/ -> Backend Server Running [200]
=== steps/02-multiple-routes.js
/ -> Welcome to the Student Management API [200]
/students -> List of all students [200]
/students/1 -> Student: Aarav, Roll No: 1 [200]
=== steps/03-json.js
/students -> [{"id":1,...},{"id":2,...},{"id":3,...},{"id":4,"name":"Meera","branch":"CSE"}] [200]
/students/1 -> {"id":1,"name":"Aarav","branch":"CSE"} [200]
/students/branch/CSE -> [{"id":1,"name":"Aarav","branch":"CSE"},{"id":4,"name":"Meera","branch":"CSE"}] [200]
/students/5 -> {"error":"Student not found"} [404]
=== steps/04-html.js
/students -> <h2>All Students</h2><ul><li><strong>Aarav</strong> — CSE</li>...</ul> [200]
/students/1 -> <h2>Aarav</h2><p>Branch: CSE</p> [200]
/students/5 -> <h2>Student not found</h2> [404]
```

Screenshots (headless Chrome): `screenshots/home.png`, `screenshots/students.png`,
`screenshots/student-404.png`. Every server was stopped after the run.
