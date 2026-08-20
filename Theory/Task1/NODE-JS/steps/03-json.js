// L03 Task 3 — Returning JSON, plus Lab Exercise 3: GET /students/branch/:branch
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const students = [
    { id: 1, name: "Aarav", branch: "CSE" },
    { id: 2, name: "Diya", branch: "ECE" },
    { id: 3, name: "Rohan", branch: "IT" },
    { id: 4, name: "Meera", branch: "CSE" }
];

app.get("/", (req, res) => {
    res.send("Student Management API");
});

app.get("/students", (req, res) => {
    res.json(students);
});

// Two path segments after /students, so this never collides with /students/:id below.
app.get("/students/branch/:branch", (req, res) => {
    const wanted = req.params.branch.toUpperCase();
    const matches = students.filter(s => s.branch.toUpperCase() === wanted);
    res.json(matches);
});

app.get("/students/:id", (req, res) => {
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
