// Theory Task 1 — L03 "Setting Up the Backend Environment", Section 7, Task 5 (final version).
// The earlier tasks of the lecture (hello world, multiple routes, JSON, HTML strings) are kept
// as standalone files in steps/ so each one can still be run on its own.

const path = require("path");
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
// The templates live next to this file, so the server works no matter which folder it is started from.
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const students = [
    { id: 1, name: "Aarav", branch: "CSE" },
    { id: 2, name: "Diya", branch: "ECE" },
    { id: 3, name: "Rohan", branch: "IT" }
];

// ---- EJS pages (Task 5) ----

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/students", (req, res) => {
    res.render("students", { students: students });
});

app.get("/students/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const student = students.find(s => s.id === id);
    res.status(student ? 200 : 404).render("student", { student, id: req.params.id });
});

// ---- one route per response type ----

app.get("/text", (req, res) => {
    res.type("text").send("Backend Development — plain text response");
});

app.get("/html", (req, res) => {
    res.send("<h1>Backend Development</h1><p>An HTML string sent with res.send().</p>");
});

app.get("/json", (req, res) => {
    res.json(students);
});

// ---- JSON API (Task 3) plus Lab Exercise 3: filter by branch ----

app.get("/api/students", (req, res) => {
    res.json(students);
});

app.get("/api/students/branch/:branch", (req, res) => {
    const branch = req.params.branch.toUpperCase();
    res.json(students.filter(s => s.branch.toUpperCase() === branch));
});

app.get("/api/students/:id", (req, res) => {
    const student = students.find(s => s.id === parseInt(req.params.id));
    if (student) {
        res.json(student);
    } else {
        res.status(404).json({ error: "Student not found" });
    }
});

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
