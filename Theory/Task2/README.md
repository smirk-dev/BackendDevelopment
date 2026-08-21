# Theory Task 2 — Flask API and inspecting HTTP requests

**Lectures:** Unit 1, **L03** Sections 8–10 (Flask server, Tasks 6–7, Lab Exercise 4) and
**L04 HTTP Requests, DevTools, curl, Postman, fetch** (Tasks 1–5 and the Lab Exercise).
Student: Suryansh Mishra (590012069), `smirk-dev`.

The Flask version of the student API, then the same requests sent four ways: the browser's
Network panel, `curl`, a saved Postman collection, and `fetch()` from a web page.

## What is in the folder

```
Task2/demo2flask/
├── main.py                 # GET /, GET /students, GET /students/<id>, POST /students, GET /client
├── static/client.html      # fetch() client: list, client-side CSE filter, POST form
├── postman/flask-students.postman_collection.json   # 6 saved requests with tests
├── requirements.txt
└── screenshots/
```

`Task2/views/` used to sit here. Those EJS files belong to Task 1 (Flask never renders them) and
were moved to `Task1/NODE-JS/views/`; see the Task 1 README.

## Run

```bash
cd Task2/demo2flask
pip install -r requirements.txt
python main.py                       # http://localhost:5000   (PORT=3042 python main.py)
```

Open `http://localhost:5000/client` for the fetch() page. Import the collection in Postman, or
run it headless: `npx newman run postman/flask-students.postman_collection.json`.

| L04 exercise | Where |
|---|---|
| 1. DevTools on `GET /students` (Express) | Network-panel data below, `screenshots/express-api-students.png` |
| 2. curl `GET /students/3` | below |
| 3. Postman request saved to a collection | `postman/flask-students.postman_collection.json` |
| 4. fetch() all students, filter CSE on the client | `getStudentsByBranch()` in `static/client.html` |
| 5. `curl -v` to list Express response headers | below |
| L03 Lab 4: `POST /students` on Flask | `add_student()` in `main.py` |

## Checks run

Flask on port 3042, real responses:

```
$ curl -i http://localhost:3042/students/5
HTTP/1.1 404 NOT FOUND
Server: Werkzeug/3.1.3 Python/3.13.14
Content-Type: application/json
{
  "error": "Student not found"
}

$ curl -i -X POST http://localhost:3042/students -H "Content-Type: application/json" -d '{"name": "Kabir", "branch": "it"}'
HTTP/1.1 201 CREATED
Content-Type: application/json
{
  "branch": "IT",
  "id": 4,
  "name": "Kabir"
}

$ curl -i -X POST http://localhost:3042/students -d "name=x"
HTTP/1.1 400 BAD REQUEST
{
  "error": "Both 'name' and 'branch' are required"
}

$ curl -v http://localhost:3042/students/1
> GET /students/1 HTTP/1.1
> Host: localhost:3042
> User-Agent: curl/8.12.1
> Accept: */*
< HTTP/1.1 200 OK
< Server: Werkzeug/3.1.3 Python/3.13.14
< Content-Type: application/json
< Content-Length: 52
< Connection: close
```

The Postman collection, run with newman against the live server:

```
  GET http://localhost:3042/ [200 OK, 196B, 77ms]
  Pass  200 and plain text
  GET http://localhost:3042/students [200 OK, 419B, 20ms]
  Pass  200 and an array of 3+
  Pass  JSON content type
  GET http://localhost:3042/students/2 [200 OK, 217B, 16ms]
  Pass  Diya is id 2
  GET http://localhost:3042/students/99 [404 NOT FOUND, 208B, 14ms]
  Pass  404 with error body
  POST http://localhost:3042/students [201 CREATED, 223B, 12ms]
  Pass  201 Created
  Pass  id assigned, branch upper-cased
  POST http://localhost:3042/students [400 BAD REQUEST, 230B, 16ms]
  Pass  400 Bad Request
|              requests |                 6 |                0 |
|              assertions |                 8 |                0 |
```

The fetch() page, driven in headless Chrome (load, then submit the form with `Ishaan` / `cse`):

```
on load:    all = Aarav, Diya, Rohan, Kabir, Priya      cse = Aarav, Priya
after POST: all = ... Priya, Ishaan                     cse = Aarav, Priya, Ishaan
page log:   GET /students -> 200 application/json
            CSE filter kept 2 of 5
            POST /students -> 201 {"branch":"CSE","id":6,"name":"Ishaan"}
            CSE filter kept 3 of 6
console errors: none
```

Screenshot: `screenshots/fetch-client.png`.

**Network panel for the Express server** (Task 1 on port 3040). Headless Chrome cannot show the
DevTools window, so these fields were read from the same Chrome DevTools Protocol events the
Network tab is built on:

```
General
  Request URL: http://localhost:3040/api/students
  Request Method: GET
  Status Code: 200 OK
  Remote Address: [::1]:3040
Response Headers
  Connection: keep-alive
  Content-Length: 116
  Content-Type: application/json; charset=utf-8
  ETag: W/"74-B5U8WfIpTBTShGjYs098Ub7annU"
  Keep-Alive: timeout=5
  X-Powered-By: Express
Request Headers
  Accept: text/html,application/xhtml+xml,...
  Host: localhost:3040
  Sec-Fetch-Mode: navigate
  User-Agent: Mozilla/5.0 (...) HeadlessChrome/158.0.0.0 Safari/537.36
```

`curl -v` against the same server (Lab Exercise 2 and 5):

```
$ curl -v http://localhost:3040/api/students/3
> GET /api/students/3 HTTP/1.1
> Host: localhost:3040
> User-Agent: curl/8.12.1
> Accept: */*
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Content-Type: application/json; charset=utf-8
< Content-Length: 37
< ETag: W/"25-0p7E9c4xn+sjCZ1RW+p0GjUhpbU"
< Date: Fri, 21 Aug 2026 07:13:38 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
{"id":3,"name":"Rohan","branch":"IT"}
```

Two servers, one protocol: Werkzeug sends `Connection: close` and no ETag, Express keeps the
connection alive and adds a weak ETag, but the status line, `Content-Type` and JSON body have the
same shape. Both servers were stopped after the run.
