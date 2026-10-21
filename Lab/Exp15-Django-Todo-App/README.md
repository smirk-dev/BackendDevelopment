# Experiment 15 — Django To-Do Application (v1 Basic and v2)

Manuals:

- `Lectures/Backend Development/Lab/Exp 15 Django Todo App v1 Basic.md` → [`v1/`](v1/)
- `Lectures/Backend Development/Lab/Exp 15 Django Todo App v2.md` → [`v2/`](v2/)

**Folder layout:** one experiment folder with `v1/` and `v2/` side by side. Both manuals are
*Experiment 15* and build the same app (same `Task` model, same four routes); v2 is the
improved second edition. Keeping them next to each other makes the diff between them the point
— GET links vs CSRF-protected POST forms, `objects.get()` vs `get_object_or_404()`, plain
`admin.site.register` vs a configured `ModelAdmin`. Each is a complete, independent Django
project with its own `manage.py` and its own SQLite database.

| | v1 (Basic) | v2 |
|---|---|---|
| Model | `Task(title, completed, created_at)` | same |
| Routes | `/`, `add/`, `toggle/<id>/`, `delete/<id>/` | same names and paths |
| Toggle / delete | GET links | `@require_POST` forms with `{% csrf_token %}`; GET → 405 |
| Unknown id | `Task.objects.get()` → unhandled `DoesNotExist` (500) | `get_object_or_404()` → 404 |
| Empty title | ignored | `.strip()`ped, whitespace-only also ignored |
| Admin | `admin.site.register(Task)` | `@admin.register` with `list_display`, `list_filter`, `search_fields`, `list_editable`; `apps.py` `verbose_name = 'To-Do Tasks'` |
| Templates | Lab Assignment: `base.html` + `{% include %}` header/footer partials | §9: `base.html`, `header.html`, `footer.html`, `extra_css`/`extra_js` blocks |
| Static | Lab Assignment: `todo/static/todo/css/style.css`, `js/main.js` | §10/§11: `style.css`, `app.js`, `images/logo.png` + page-specific `add_task.css`, `char_count.js`, `confirm-delete.js` |
| Styling | Exp01 house style (the manual specifies none) | the manual's own stylesheet, byte-identical |

## Run

```bash
python -m venv venv
venv\Scripts\activate            # Git Bash: source venv/Scripts/activate
pip install -r requirements.txt  # Django 6.1.3 (what `pip install django` resolved)

cd v1                            # or v2
python manage.py migrate         # creates db.sqlite3 from the committed migration
python manage.py runserver       # http://127.0.0.1:8000/
python manage.py createsuperuser # for /admin/
python manage.py test todo
```

`db.sqlite3`, `venv/` and `__pycache__/` are not committed (`.gitignore`); the migration file
`todo/migrations/0001_initial.py` is, per Django convention.

## Manual → files

**v1 — every step of §4–§10 plus the Lab Assignment.** `models.py`, `views.py`, `todo/urls.py`,
`todo_project/urls.py`, `admin.py` and the `INSTALLED_APPS` entry are the manual's code
verbatim. The two templates carry the manual's markup unchanged *inside* `{% block content %}`:
the Lab Assignment ("show the use of `extend` and `include`", "show use of `static` dir")
requires the pages to extend a shared `base.html` that includes `partials/header.html` /
`partials/footer.html` and links `{% static %}` CSS and JS — so the manual's standalone
`<!DOCTYPE html>…<head>` wrapper moved into `base.html`.

**v2 — §4–§11.** `models.py`, `views.py`, both `urls.py`, `admin.py`, `apps.py`, `base.html`,
`header.html` (with the §10 Step 5 logo and `{% load static %}`), `footer.html`, the §9 versions
of `task_list.html`/`add_task.html`, `style.css` (diffed: identical) and `app.js` are the
manual's code verbatim. Final assignment (§11) items on top:

- Template requirement 7 (*"at least one page-specific block"*): `add_task.html` fills
  `extra_css` (`add_task.css`) and `extra_js` (`char_count.js`, a live `n / 200 characters`
  counter announced via `aria-live`); `task_list.html` fills `extra_js` (`confirm-delete.js`,
  a `confirm()` before the delete form posts — without JS the form still works).
- Static requirement: `todo/static/todo/images/logo.png` (160×160 PNG, drawn for this app), shown
  at 40×40 with `alt="Task Tracker logo"`.
- Submission item 5 (the two explanations) is the next section.

### Deviations

| Where | Manual | Here | Why |
|---|---|---|---|
| v1 templates | standalone HTML documents | same markup inside `{% block content %}` of a shared `base.html` | the v1 Lab Assignment asks for `extends`/`include` and static files |
| v1 `style.css`, `main.js` | not given | written for the assignment (Exp01 register; focuses the title box) | the manual names the task but gives no code |
| v2 `INSTALLED_APPS` comment | `# Add this line`-style | `# Tell Django to load the To-Do application.` | comment only |
| both | `pip install django` | `requirements.txt` pins `Django==6.1.3` | reproducible install; it is what `pip install django` gave on 2026-10-21 |
| both | `runserver` on 8000 | checks ran on 3036 (v1) / 3037 (v2) | port range reserved for this lab on the machine |

## `admin.py` vs `apps.py`, `extends` vs `include` (v2 §11 submission item 5)

- **`admin.py`** registers models with the admin site and customises how staff see them —
  here `TaskAdmin` adds the title/completed/created columns, the *By completed* filter, title
  search and in-list editing of `completed`. **`apps.py`** configures the app itself:
  `TodoConfig.name`, `default_auto_field = BigAutoField` (the reason `id` is a 64-bit integer)
  and `verbose_name`, which is why the admin sidebar says *To-Do Tasks*. Model registration
  never belongs in `apps.py`; `ready()` is only for startup work such as importing signals.
- **`{% extends 'todo/base.html' %}`** makes a page a *child* of a layout — it must come first,
  and the child only fills blocks (`title`, `content`, `extra_css`, `extra_js`) that the parent
  defines. **`{% include 'todo/header.html' %}`** pastes a fragment in at one spot; the fragment
  has no blocks and must `{% load static %}` itself because loaded tag libraries do not carry
  over. Inheritance gives the page its skeleton, includes supply the repeated pieces.

## Checks run

All of this is produced by [`checks.sh`](checks.sh)
(`PY=venv/Scripts/python.exe bash checks.sh`), which deletes each `db.sqlite3`, rebuilds it from
the migration, runs the suite, then drives `runserver` with curl. Raw output is in
[`evidence/`](evidence/).

### Management commands and tests — [`v1`](evidence/v1-manage-and-tests.txt), [`v2`](evidence/v2-manage-and-tests.txt)

```
$ python -m django --version              6.1.3
$ python manage.py check                  System check identified no issues (0 silenced).
$ python manage.py makemigrations --check --dry-run todo
No changes detected in app 'todo'         (the committed migration matches models.py)
$ python manage.py migrate                ... Applying todo.0001_initial... OK
$ python manage.py sqlmigrate todo 0001
CREATE TABLE "todo_task" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "title" varchar(200) NOT NULL,
                          "completed" bool NOT NULL, "created_at" datetime NOT NULL);
$ python manage.py test todo -v 2
v1: Ran 14 tests in 1.609s  OK
v2: Ran 24 tests in 3.960s  OK
```

The tests use Django's test client: create (including empty/whitespace titles), read (newest
first, empty-list message, struck-through/`completed` class), toggle both ways, delete, unknown
ids (v1 raises `DoesNotExist`, v2 404s), GET on toggle/delete → 405 (v2), CSRF enforced with
`Client(enforce_csrf_checks=True)` → 403, every POST form carries `csrfmiddlewaretoken`, both
pages extend `base.html` and include header/footer, child page titles and `extra_css`/`extra_js`
blocks, logo `alt` text, every static asset found by the staticfiles finders, and the admin
(registration; v2 column/filter/search/editable config, search and filter results, anonymous
user redirected to login).

### Curl journey on the running server — [`v1`](evidence/v1-curl-journey.txt), [`v2`](evidence/v2-curl-journey.txt)

CSRF handled the way a browser does it: GET `/add/` stores the `csrftoken` cookie, every POST
sends it back as `csrfmiddlewaretoken`.

v2 (abridged; v1 is the same journey with GET links):

```
$ curl -X POST http://127.0.0.1:3037/add/ --data-urlencode csrfmiddlewaretoken=… --data-urlencode "title=Write the Exp 15 README"
HTTP/1.1 302 Found          Location: /            (×3 titles; "" and "   " create nothing)
  rendered list:
   Submit Django lab (class=none) [Mark complete POST /toggle/3/] [Delete POST /delete/3/]
   Revise Unit 3 notes on middleware (class=none) [Mark complete POST /toggle/2/] [Delete POST /delete/2/]
   Write the Exp 15 README (class=none) [Mark complete POST /toggle/1/] [Delete POST /delete/1/]
$ curl -X GET  http://127.0.0.1:3037/toggle/2/                       HTTP/1.1 405 Method Not Allowed   Allow: POST
$ curl -X POST http://127.0.0.1:3037/toggle/2/ -d csrfmiddlewaretoken=…  HTTP/1.1 302 Found
   Revise Unit 3 notes on middleware (class=completed) [Mark incomplete POST /toggle/2/] …
$ curl -X GET  http://127.0.0.1:3037/delete/3/                       HTTP/1.1 405 Method Not Allowed
$ curl -X POST http://127.0.0.1:3037/delete/3/ -d csrfmiddlewaretoken=…  HTTP/1.1 302 Found   (row gone)
$ curl -X POST http://127.0.0.1:3037/toggle/999/ -d csrfmiddlewaretoken=… HTTP/1.1 404 Not Found
$ curl -X POST http://127.0.0.1:3037/delete/2/                       HTTP/1.1 403 Forbidden   (no token)
$ curl http://127.0.0.1:3037/static/todo/{css/style.css,css/add_task.css,js/app.js,js/char_count.js,js/confirm-delete.js,images/logo.png}
HTTP/1.1 200 OK  (each)     — /static/todo/missing.css → 404
```

v1 differences, from its journey: `GET /toggle/2/` and `GET /delete/3/` → `302` and change
data (the reason v2 switched to POST); `GET /toggle/999/` → `500 Internal Server Error`;
`POST /add/` without a token → `403 Forbidden`; `style.css` and `main.js` → `200`.

### Persistence across a restart — [`v1`](evidence/v1-persistence.txt), [`v2`](evidence/v2-persistence.txt)

```
  rows in db.sqlite3 before restart:
    1 Write the Exp 15 README False
    2 Revise Unit 3 notes on middleware True
  server restarted on 3037 (new PID); list after restart:
   Revise Unit 3 notes on middleware (class=completed) [Mark incomplete POST /toggle/2/] …
   Write the Exp 15 README (class=none) [Mark complete POST /toggle/1/] …
```

### Django Admin (v2) — [`evidence/v2-admin.txt`](evidence/v2-admin.txt)

```
$ DJANGO_SUPERUSER_PASSWORD=… python manage.py createsuperuser --noinput --username admin
Superuser created successfully.
$ curl http://127.0.0.1:3037/admin/todo/task/          302 → /admin/login/?next=/admin/todo/task/
$ curl -X POST http://127.0.0.1:3037/admin/login/ …    302 → /admin/todo/task/
$ curl http://127.0.0.1:3037/admin/todo/task/          200  Select task to change
  columns: Title, Completed, Created at · editable checkboxes: 2 · search box: True
  filter options: Yes / No
  ?q=Revise              → ['Revise Unit 3 notes on middleware']
  ?completed__exact=0    → ['Write the Exp 15 README']
  ?completed__exact=1    → ['Revise Unit 3 notes on middleware']
```

### Screenshots — [`screenshots/`](screenshots/)

Headless Chrome over CDP against the two dev servers:
`v1-task-list.png`, `v1-add-task.png`, `v2-task-list.png`, `v2-task-list-mobile.png` (390 px),
`v2-add-task.png`, `v2-admin-task-list.png` — the home page, add page and admin task list the
v2 submission asks for. [`screenshots/cdp-report.json`](screenshots/cdp-report.json) holds the
in-page assertions: no broken images, no horizontal overflow at either width, the logo's
`alt` text and 160 px natural size, the scripts and stylesheets actually loaded, and the
console showing `Task Tracker JavaScript loaded.` (the `app.js` check from §10 Step 4). The only
console error is the browser's automatic `/favicon.ico` request on each server's first page
load (404 — neither manual adds a favicon).

Afterwards: both servers stopped (ports 3036/3037 free), `db.sqlite3` and `__pycache__`
deleted, the venv lived outside the repository.
