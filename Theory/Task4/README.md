# Theory Task 4 — Sessions, Cookies and Query Strings

**Lecture:** Unit 1, **L06 Managing server-side Session, Cookie, and State Management**.
Student: Suryansh Mishra (590012069), `smirk-dev`.

HTTP forgets every request as soon as it answers it. This Express app shows the three ways L06
gives for carrying state from one request to the next: a **session** (data kept on the server,
found again through a signed id cookie), a **cookie** (data kept in the browser and sent back on
every request) and a **query string** (data written into the URL itself).

Folder note: `Theory/Unit4-Docker-CICD` is the Unit 4 Docker/CI hands-on and lives in its own repo.
This `Task4` is the fourth in-class task, which follows L06.

## Routes

| Route | Mechanism | What it does |
|---|---|---|
| `/login` | session | stores `username` in the session |
| `/profile` | session | reads it, or asks you to log in |
| `/visits` | session | counter that only this browser's session can see |
| `/logout` | session | `req.session.destroy()` and clears the id cookie |
| `/setcookie` | cookie | `username=Suryansh`, 1 hour, `httpOnly`, `sameSite=strict` |
| `/getcookie` | cookie | reads `req.cookies.username` |
| `/deletecookie` | cookie | `res.clearCookie()` |
| `/welcome?user=&role=` | query | reads `req.query`, escapes it before echoing, 400 without `user` |
| `/state` | all three | JSON of the session id, session data, cookies and query the server received |

Session settings follow the lecture (`resave: false`, `saveUninitialized: true`, `maxAge: 60000`),
except the secret can come from `SESSION_SECRET`. The default in-memory store loses every session
when the server restarts, which is fine for a lab and wrong for production.

## Run

```bash
cd Task4
npm install
npm start            # http://localhost:3000    (PORT=3045 npm start)
```

## Checks run

Server on port 3045. Two separate curl cookie jars play two different browsers, A and B
(headers trimmed to status and `Set-Cookie`):

```
$ curl /profile (browser A)
HTTP/1.1 200 OK
Set-Cookie: connect.sid=s%3A5NBL-qFrgAuWc90YDixWV-WOnWHZlljW.JNN29IZ5...; Path=/; Expires=Sun, 23 Aug 2026 07:20:11 GMT; HttpOnly
Please log in first.

$ curl /login (browser A)
Session started for Suryansh

$ curl /profile (browser A)
Welcome Suryansh

$ curl /visits (browser A)          -> You have opened this page 1 time(s) in this session.
$ curl /visits (browser A)          -> You have opened this page 2 time(s) in this session.

$ curl /profile (browser B)
Set-Cookie: connect.sid=s%3AR1ecXS-ZSURpHb-WQze3fwnNf0w_gtWL...     <- a different session id
Please log in first.
$ curl /visits (browser B)          -> You have opened this page 1 time(s) in this session.

$ curl /state (browser A)
{"sessionID":"5NBL-qFrgAuWc90YDixWV-WOnWHZlljW","session":{"cookie":{"originalMaxAge":60000,"expires":"2026-08-23T07:20:12.806Z","httpOnly":true,"path":"/"},"username":"Suryansh","visits":2},"cookies":{"connect.sid":"s:5NBL-qFrgAuWc90YDixWV-WOnWHZlljW.JNN29IZ5qxUCnO/Yj2ApLp2SHrTRCbJ8Zyewyw9klUE"},"query":{}}

$ curl /logout (browser A)
Set-Cookie: connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
Session destroyed successfully
$ curl /profile (browser A)
Please log in first.

$ curl /setcookie (browser A)
Set-Cookie: username=Suryansh; Max-Age=3600; Path=/; Expires=Sun, 23 Aug 2026 08:19:14 GMT; HttpOnly; SameSite=Strict
Cookie has been set!
$ curl /getcookie (browser A)       -> Welcome back, Suryansh
$ curl /getcookie (browser B)       -> No cookie found.
$ curl /deletecookie (browser A)
Set-Cookie: username=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
Cookie deleted.
$ curl /getcookie (browser A)       -> No cookie found.

$ curl "/welcome?user=Suryansh&role=student"   -> Welcome Suryansh, your role is student
$ curl "/welcome?user=%3Cb%3EX%3C/b%3E"         -> Welcome &lt;b&gt;X&lt;/b&gt;, your role is guest
$ curl /welcome                                -> HTTP/1.1 400 Bad Request
```

The session's one-minute `maxAge`, watched with a third jar:

```
12:49:25 $ curl /login                       Session started for Suryansh
12:49:25 $ curl /profile                     Welcome Suryansh
12:50:27 $ curl /profile   (62 s later)      Please log in first.
```

The same flow in headless Chrome, with the cookie list read from the browser (what DevTools shows
under Application → Cookies):

```
document.cookie = ""                         <- both cookies are httpOnly, page JavaScript sees nothing
cookies in the browser:
  username=Suryansh  httpOnly=true sameSite=Strict session=false expires=2026-08-23T08:19:33.946Z
  connect.sid=s%3ABoDSfqAJLLX6s1LKSOTb...  httpOnly=true sameSite=- session=false expires=2026-08-23T07:20:34.316Z
/getcookie -> Welcome back, Suryansh
/profile -> Welcome Suryansh
/welcome -> Welcome Suryansh, your role is student
```

Screenshots: `screenshots/index.png`, `screenshots/state.png`. The server was stopped after the run.

## What the run shows

- The session id cookie carries no user data. `username` and `visits` stay in server memory; A and
  B get different ids and separate counters.
- After `/logout` the old id is useless. A new request gets a fresh, empty session.
- The `username` cookie is the reverse: the value itself travels with every request. That is why
  it is `httpOnly` and why nothing secret should go in a cookie unsigned.
- A query string is visible to anyone who sees the URL, and anything echoed from it has to be
  escaped (the `<b>` test).
