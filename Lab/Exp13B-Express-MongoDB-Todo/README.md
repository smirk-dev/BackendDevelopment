# Exp 13 B (Optional) — User Registration, Login and ToDo App with Express and MongoDB

Manual: `Lectures/Backend Development/Lab/Exp 13 B (Optional) User registration and ToDo App with express and mongodb .md`

A JSON REST API: users register and log in, get a JWT, and manage their own to-do list.
All four of the manual's experiments are built, in the manual's own project layout, and the
whole "Testing Checklist" at the end of the manual was run with curl against the local MongoDB
service.

| Manual experiment | What it adds | Files |
|---|---|---|
| 1. Connect to MongoDB | Mongoose connection, `GET /` health route | `config/db.js`, `server.js` |
| 2. User Registration | `User` model (validators, bcrypt pre-save hook, `comparePassword`), `POST /api/auth/register` | `models/User.js`, `routes/auth.js` |
| 3. User Login | `POST /api/auth/login`, JWT auth middleware | `routes/auth.js`, `middleware/auth.js` |
| 4. Todo List | `Todo` model, protected CRUD on `/api/todos` scoped to the logged-in user | `models/Todo.js`, `routes/todos.js` |

Sibling of [`Exp13A-MongoDB-Mongoose-UserAuth/`](../Exp13A-MongoDB-Mongoose-UserAuth/): 13 A stores
plaintext passwords and renders forms; 13 B hashes with bcrypt, issues JWTs and is API-only.

## Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | — | `{"message":"API is running..."}` |
| POST | `/api/auth/register` | — | create user, returns token + user |
| POST | `/api/auth/login` | — | returns token + user |
| GET | `/api/todos` | Bearer | the caller's todos, newest first, with `count` |
| GET | `/api/todos/:id` | Bearer | one todo, only if the caller owns it |
| POST | `/api/todos` | Bearer | create (`title`, `description`, `priority`, `dueDate`) |
| PUT | `/api/todos/:id` | Bearer | partial update, including `completed` toggle |
| DELETE | `/api/todos/:id` | Bearer | delete |

## How to run

```bash
npm install
cp .env.example .env      # MONGODB_URI=mongodb://localhost:27017/todoapp, JWT_SECRET, PORT=3000
npm start                 # or: npm run dev   (nodemon)
bash checks.sh            # the full curl journey below; BASE=http://localhost:3000 by default
```

Needs a MongoDB server on `localhost:27017` (see [`Exp13-MongoDB-Installation/`](../Exp13-MongoDB-Installation/)).
The database `todoapp` and both collections are created by Mongoose on first write.

## Byte-faithfulness and deviations

Every source file is the manual's code block **byte for byte**, checked with a script that pulls
each ```` ```javascript ```` block out of the manual and compares it to the file
(`config/db.js`, `models/User.js`, `middleware/auth.js`, `models/Todo.js`, `routes/todos.js`,
`server.js` = the Step 4.3 version: all `True`; `routes/auth.js` = register block + login block
appended "after the register route", as the manual says). The manual's `server.js` already reads
`process.env.PORT || 3000`, so not even the usual port change was needed.

Things that differ from the manual, all outside the code:

- **`mongoose` is pinned to 8.x.** The manual's `config/db.js` passes `useNewUrlParser` and
  `useUnifiedTopology`. Mongoose 9 (driver 7) rejects both with
  `MongoParseError: options usenewurlparser, useunifiedtopology are not supported`, and since
  `connectDB()` calls `process.exit(1)` on error, the app would not start at all. On 8.x it starts
  and the driver prints a deprecation warning for each option (see `evidence/server-log.txt`).
  The same failure is captured in `../Exp13-MongoDB-Installation/evidence/05a-connect-mongoose9.txt`.
- **`.env` is not committed**; `.env.example` holds the manual's exact values. For the test run
  `.env` was copied from it, `PORT=3034` was set in the shell (dotenv does not override an
  existing variable), and `.env` was deleted afterwards.
- `package.json` `name` is the manual's `todo-app`; `author` is `smirk-dev`.
- The manual has no logout route. JWT auth is stateless — the server keeps no session — so
  "logout" means the client throws its token away. The journey ends by doing exactly that and
  showing the API answer 401.

Behaviour of the manual's code worth knowing (left as written, not "fixed"):

- Schema validation errors (short password, bad email, missing title, unknown priority) come back
  as **HTTP 500** `"Server error"` with the Mongoose message, because every route has one
  catch-all `catch`. A 400 would be more correct; the manual's code does not distinguish.
- Login returns the same `"Invalid credentials"` for a wrong password and an unknown email, as
  the manual intends.
- Another user's todo id returns **404**, not 403 — the query filters on `user: req.userId`, so to
  anyone else the todo does not exist.

## Checks run

2026-10-04, server on port 3034 against the local `MongoDB` service (8.2.1). Full transcript in
`evidence/curl-journey.txt`; tokens shortened here.

**Server start** (`evidence/server-log.txt`)

```
◇ injected env (2) from .env
(node:21872) [MONGODB DRIVER] Warning: useNewUrlParser is a deprecated option: ...
(node:21872) [MONGODB DRIVER] Warning: useUnifiedTopology is a deprecated option: ...
🚀 Server running on port 3034
MongoDB Connected: localhost
```

**Testing checklist from the manual**

| Checklist item | Request | Response |
|---|---|---|
| MongoDB connection successful | `GET /` | `200 {"message":"API is running..."}` |
| User registration works | `POST /api/auth/register` john | `201 {"message":"User registered successfully","token":"eyJhbGciOi...","user":{"id":"6ac1fd0038445aa891c59243","username":"john","email":"john@example.com"}}` |
| Duplicate registration prevented | same body again | `400 {"message":"User with this email or username already exists"}` |
| (validators) | `{"username":"al","email":"not-an-email","password":"123"}` | `500 {"message":"Server error","error":"User validation failed: username: Username must be at least 3 characters, email: Please enter a valid email, password: Password must be at least 6 characters"}` |
| User login works | `POST /api/auth/login` | `200 {"message":"Login successful","token":"eyJhbGciOi...","user":{...}}` |
| Invalid login credentials rejected | wrong password / unknown email | `401 {"message":"Invalid credentials"}` (both) |
| (missing field) | `{"email":"john@example.com"}` | `400 {"message":"Please provide email and password"}` |
| Protected routes require authentication | `GET /api/todos`, no header | `401 {"message":"No token, authorization denied"}` |
| | `Authorization: Bearer not.a.real.token` | `401 {"message":"Token is not valid"}` |
| Create todo works | `POST /api/todos` "Buy groceries" (high), "Finish Exp 13 B report" (dueDate 2026-10-09), "Call home" (low) | `201 {"message":"Todo created successfully","todo":{...,"completed":false,"priority":"high",...}}` x3 |
| (validators) | no title / `"priority":"urgent"` | `500 ... "Todo validation failed: title: Title is required"` / ``"... `urgent` is not a valid enum value for path `priority`."`` |
| Get all todos returns only user's todos | `GET /api/todos` | `200 {"count":3,"todos":[Call home, Finish..., Buy groceries]}` (newest first) |
| | `GET /api/todos/:id` | `200 {"_id":"6ac1fd0338445aa891c5924b","title":"Buy groceries",...}` |
| Update todo works | `PUT` `{"completed":true}` then `{"completed":false}` | `200 ... "completed":true` then `200 ... "completed":false`, `updatedAt` advancing |
| | `PUT` `{"completed":true,"title":"Finish Exp 13 B report (done)"}` | `200` both fields changed |
| Delete todo works | `DELETE /api/todos/<Call home>` | `200 {"message":"Todo deleted successfully",...}`, then `GET` it → `404 {"message":"Todo not found"}` |
| Users cannot access other users' todos | priya registers, `GET /api/todos` | `200 {"count":0,"todos":[]}` |
| | priya `GET` / `PUT` / `DELETE` john's todo id | `404 {"message":"Todo not found"}` x3 |
| | john `GET /api/todos` afterwards | `200 {"count":2,...}` — nothing changed |
| "Logout" | client drops the token, `GET /api/todos` | `401 {"message":"No token, authorization denied"}` |

**Confirmed in the database itself** (`evidence/mongosh-verify.txt`), not just from HTTP answers:

```
collections: ["todos","users"]
{ username: 'john',  email: 'john@example.com',  password: '$2b$10$rh6Y9UQSGIQjWofGOEut5ucU1IZkC.9L01NhdaV9wRDfkbcmdIKHK' }
{ username: 'priya', email: 'priya@example.com', password: '$2b$10$BSogQ6ymY1J4wemnOX6b.uxjS15Zrz4kNerIaLsOD1xOXEaQ1IYFe' }
indexes on users: _id_, username_1 (unique), email_1 (unique)
todos joined to their owner with $lookup:
  { title: 'Buy groceries', completed: false, owner: 'john' }
  { title: 'Finish Exp 13 B report (done)', completed: true, owner: 'john' }
```

Passwords are bcrypt hashes (`$2b$10$` = bcrypt, cost 10 from `genSalt(10)`), never plaintext.

**Clean-up** (`evidence/cleanup.txt`): server stopped (port 3034 closed), `.env` deleted,
`todoapp` dropped (`{ ok: 1, dropped: 'todoapp' }`), so the local server has the same databases
as before the run.
