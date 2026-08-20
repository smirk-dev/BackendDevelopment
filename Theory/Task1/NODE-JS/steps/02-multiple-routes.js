// L03 Task 2 — Multiple routes, each returning plain text
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Welcome to the Student Management API");
});

app.get("/students", (req, res) => {
    res.send("List of all students");
});

app.get("/students/1", (req, res) => {
    res.send("Student: Aarav, Roll No: 1");
});

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
