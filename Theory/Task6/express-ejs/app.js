// Theory Task 6 (Express half) — L08 "Server-Side Rendering and Templating Engines", Parts B and D,
// plus Lab Exercises 1, 2 and 4.
const path = require("path");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));   // public/css/style.css is served at /css/style.css

const students = [
    { id: 1, name: "Aarav", branch: "CSE" },
    { id: 2, name: "Diya", branch: "ECE" },
    { id: 3, name: "Rohan", branch: "IT" },
    { id: 4, name: "Meera", branch: "CSE" },
    { id: 5, name: "Kabir", branch: "ME" }
];

// A server-side function every template can call (L08 section 11).
app.locals.upperCase = s => String(s).toUpperCase();

// Section 9: Hello World
app.get("/", (req, res) => {
    res.render("home", { name: "Aarav", title: "SSR Demo" });
});

// Section 10 + Lab 1 + Lab 4: the student table, alternating row classes, its own stylesheet
app.get("/students", (req, res) => {
    res.render("students", { title: "Student List", students });
});

// Section 11: conditionals and loops. A ?branch= that matches nobody shows the "No students found" branch.
app.get("/dashboard", (req, res) => {
    const branch = req.query.branch;
    const list = branch ? students.filter(s => s.branch === branch.toUpperCase()) : students;
    res.render("dashboard", { title: "Student Dashboard", students: list, branch });
});

// Lab 2: course name and lecturer passed in as variables
app.get("/about", (req, res) => {
    res.render("about", {
        title: "About",
        course: "Backend Development (CSFS3008P)",
        lecturer: "Dr. Prateek Raj Gautam",
        semester: "B.Tech Semester 5"
    });
});

app.use((req, res) => {
    res.status(404).render("about", { title: "Not found", course: "No page at " + req.path, lecturer: "-", semester: "-" });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
