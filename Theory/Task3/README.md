# Theory Task 3 — RESTful APIs with FastAPI

**Lecture:** Unit 1, **L05 RESTful APIs and FastAPI** (Part B Task 1 and the Lab Exercise).
Student: Suryansh Mishra (590012069), `smirk-dev`.

Two FastAPI apps:

| File | What it is |
|---|---|
| `main.py` | The lecture's Student Management API: list (with `?branch=`), get, create, replace, delete. Kept as written in L05. |
| `course_api.py` | The lab exercise: a **Course** resource (`id`, `title`, `credits`, `department`) with all five CRUD operations and `GET /courses?department=CSE`. |

Choices in `course_api.py` beyond the bare exercise:

- Input and output are separate models (`CourseIn` without `id`, `Course` with it), so a client
  cannot pick its own id.
- Pydantic `Field` limits: title 2–80 characters, credits 1–6. A bad body gets FastAPI's 422 with
  one entry per broken field.
- Department is trimmed and upper-cased on the way in, and the filter compares the same way, so
  `?department=cse` and a body with `" cse "` both work.
- Courses sit in a dict keyed by id, which makes get/replace/delete a lookup instead of a loop.

## Run

```bash
cd Task3
pip install -r requirements.txt
uvicorn main:app --reload --port 5000          # or: python main.py
uvicorn course_api:app --reload --port 5000    # or: python course_api.py
```

Swagger UI at `/docs`, ReDoc at `/redoc`.

## Checks run

`main.py` on port 3043 and `course_api.py` on port 3044, run with `python -m uvicorn` (FastAPI
0.128.0, uvicorn 0.40.0). Output pasted as returned, `[status]` appended by curl:

```
$ curl http://127.0.0.1:3043/students
[{"id":1,"name":"Aarav","branch":"CSE"},{"id":3,"name":"Rohan","branch":"CSE"},{"id":4,"name":"Priya","branch":"CSE"}]  [200]
   (this list is after the POST, PUT and DELETE below had run)
$ curl "http://127.0.0.1:3043/students?branch=cse"
[{"id":1,"name":"Aarav","branch":"CSE"}]  [200]
$ curl -X POST http://127.0.0.1:3043/students -H "Content-Type: application/json" -d '{"name": "Priya", "branch": "CSE"}'
{"id":4,"name":"Priya","branch":"CSE"}  [201]
$ curl -X PUT http://127.0.0.1:3043/students/3 -H "Content-Type: application/json" -d '{"name": "Rohan", "branch": "CSE"}'
{"id":3,"name":"Rohan","branch":"CSE"}  [200]
$ curl -X DELETE http://127.0.0.1:3043/students/2
  [204]
$ curl http://127.0.0.1:3043/students/2
{"detail":"Student not found"}  [404]
$ curl -X POST http://127.0.0.1:3043/students -H "Content-Type: application/json" -d '{"name": "NoBranch"}'
{"detail":[{"type":"missing","loc":["body","branch"],"msg":"Field required","input":{"name":"NoBranch"}}]}  [422]
```

```
---- course_api.py ----
$ curl http://127.0.0.1:3044/courses
[{"title":"Backend Development","credits":4,"department":"CSE","id":1},{"title":"Data Communication and Networks","credits":3,"department":"CSE","id":2},{"title":"Digital Electronics","credits":3,"department":"ECE","id":3},{"title":"Linear Algebra","credits":4,"department":"MATH","id":4}]  [200]
$ curl "http://127.0.0.1:3044/courses?department=cse"
[{"title":"Backend Development",...,"id":1},{"title":"Data Communication and Networks",...,"id":2}]  [200]
$ curl http://127.0.0.1:3044/courses/3
{"title":"Digital Electronics","credits":3,"department":"ECE","id":3}  [200]
$ curl http://127.0.0.1:3044/courses/42
{"detail":"Course 42 not found"}  [404]
$ curl -X POST http://127.0.0.1:3044/courses -H "Content-Type: application/json" -d '{"title": "Research Methodology", "credits": 2, "department": " cse "}'
{"title":"Research Methodology","credits":2,"department":"CSE","id":5}  [201]
$ curl -X PUT http://127.0.0.1:3044/courses/4 -H "Content-Type: application/json" -d '{"title": "Linear Algebra II", "credits": 3, "department": "MATH"}'
{"title":"Linear Algebra II","credits":3,"department":"MATH","id":4}  [200]
$ curl -X DELETE http://127.0.0.1:3044/courses/3
  [204]
$ curl -X DELETE http://127.0.0.1:3044/courses/3
{"detail":"Course 3 not found"}  [404]
$ curl -X POST http://127.0.0.1:3044/courses -H "Content-Type: application/json" -d '{"title": "X", "credits": 9, "department": "CSE"}'
{"detail":[{"type":"string_too_short","loc":["body","title"],"msg":"String should have at least 2 characters",...},{"type":"less_than_equal","loc":["body","credits"],"msg":"Input should be less than or equal to 6",...}]}  [422]
$ curl "http://127.0.0.1:3044/courses?department=CSE"
[{"title":"Backend Development",...,"id":1},{"title":"Data Communication and Networks",...,"id":2},{"title":"Research Methodology",...,"id":5}]  [200]
```

Routes in the generated OpenAPI document (`/openapi.json`):

```
GET /    GET /courses    POST /courses    GET /courses/{course_id}    PUT /courses/{course_id}    DELETE /courses/{course_id}
```

Swagger UI and ReDoc, read in headless Chrome:

```
swagger ops: GET / | GET /courses | POST /courses | GET /courses/{course_id} | PUT /courses/{course_id} | DELETE /courses/{course_id}
redoc title: Course Management API (1.0.0) | menu: Root | List Courses | Create Course | Get Course | Replace Course | Delete Course
```

Screenshots: `screenshots/swagger-courses.png`, `screenshots/redoc-courses.png`,
`screenshots/swagger-students.png`.

Note: the old `Task3/venv/` and `__pycache__/` were deleted and are listed in `.gitignore`. Both
servers were stopped after the run.
