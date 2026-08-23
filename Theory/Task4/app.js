// Theory Task 4 — L06 "Managing server-side Session, Cookie, and State Management".
// Sessions (express-session), cookies (cookie-parser) and query strings in one Express app.
const path = require("path");
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || "theory-task4-dev-secret", // signs the session-id cookie
    resave: false,              // do not write the session back if nothing changed
    saveUninitialized: true,    // the lecture's setting: every visitor gets a session
    cookie: { maxAge: 60000 }   // 1 minute, as in the lecture, so expiry is easy to watch
}));

// Small helper so every page shares the same frame.
const page = (title, body) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title><link rel="stylesheet" href="/paper.css"></head>
<body><main><h1>${title}</h1>${body}<hr><p><a href="/">Back to the index</a></p></main></body></html>`;

const escape = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

app.get("/", (req, res) => {
    res.send(page("Sessions, Cookies and Query Strings", `
<p class="lede">Three ways to carry state across stateless HTTP requests.</p>
<h2>Session (data on the server)</h2>
<ul class="plain">
  <li><a href="/login">/login</a> — start a session</li>
  <li><a href="/profile">/profile</a> — read it</li>
  <li><a href="/visits">/visits</a> — a counter kept in the session</li>
  <li><a href="/logout">/logout</a> — destroy it</li>
</ul>
<h2>Cookie (data in the browser)</h2>
<ul class="plain">
  <li><a href="/setcookie">/setcookie</a></li>
  <li><a href="/getcookie">/getcookie</a></li>
  <li><a href="/deletecookie">/deletecookie</a></li>
</ul>
<h2>Query string (data in the URL)</h2>
<ul class="plain">
  <li><a href="/welcome?user=Suryansh&amp;role=student">/welcome?user=Suryansh&amp;role=student</a></li>
</ul>
<h2>What the server sees</h2>
<ul class="plain"><li><a href="/state">/state</a> — session id, session data, cookies and query of this request</li></ul>`));
});

// ---------------- sessions ----------------

app.get("/login", (req, res) => {
    req.session.username = "Suryansh";
    res.send("Session started for " + req.session.username);
});

app.get("/profile", (req, res) => {
    if (req.session.username) {
        res.send("Welcome " + req.session.username);
    } else {
        res.send("Please log in first.");
    }
});

app.get("/visits", (req, res) => {
    req.session.visits = (req.session.visits || 0) + 1;
    res.send(`You have opened this page ${req.session.visits} time(s) in this session.`);
});

app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) return res.send("Error destroying session");
        res.clearCookie("connect.sid");   // also drop the now-useless id from the browser
        res.send("Session destroyed successfully");
    });
});

// ---------------- cookies ----------------

app.get("/setcookie", (req, res) => {
    res.cookie("username", "Suryansh", {
        maxAge: 3600000,    // 1 hour
        httpOnly: true,     // document.cookie cannot read it
        secure: false,      // true once the site is served over HTTPS
        sameSite: "strict"  // not sent on requests started by other sites
    });
    res.send("Cookie has been set!");
});

app.get("/getcookie", (req, res) => {
    const user = req.cookies.username;
    if (user) {
        res.send("Welcome back, " + user);
    } else {
        res.send("No cookie found.");
    }
});

app.get("/deletecookie", (req, res) => {
    res.clearCookie("username");
    res.send("Cookie deleted.");
});

// ---------------- query strings ----------------

app.get("/welcome", (req, res) => {
    const user = req.query.user;
    const role = req.query.role;
    if (!user) return res.status(400).send("Add ?user=<name>&role=<role> to the URL.");
    // query values come straight from the URL, so escape them before echoing back
    res.send(`Welcome ${escape(user)}, your role is ${escape(role || "guest")}`);
});

// ---------------- inspection ----------------

app.get("/state", (req, res) => {
    res.json({
        sessionID: req.sessionID,
        session: req.session,
        cookies: req.cookies,
        query: req.query
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
