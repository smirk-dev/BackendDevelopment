// Exp 09-11, Practice Task 5 — a real backend for the AJAX pages.
// Serves the whole folder as static files and adds a small JSON API over the same
// student and course records the static files hold.
const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'exp11-website', 'data');

app.use(express.json());

// Re-read the file on every request so edits to the data show up without a restart.
async function readJson(file) {
  return JSON.parse(await fs.readFile(path.join(DATA, file), 'utf8'));
}

// GET /api/students            -> every student
// GET /api/students?course=X   -> only that course (exact match)
// GET /api/students?q=aa       -> name contains "aa" (case-insensitive)
app.get('/api/students', async (req, res, next) => {
  try {
    let { students } = await readJson('students.json');
    const { course, q } = req.query;
    if (course) students = students.filter(s => s.course === course);
    if (q) students = students.filter(s => s.name.toLowerCase().includes(String(q).toLowerCase()));
    res.json({ count: students.length, students });
  } catch (err) { next(err); }
});

app.get('/api/students/:id', async (req, res, next) => {
  try {
    const { students } = await readJson('students.json');
    const student = students.find(s => s.id === Number(req.params.id));
    if (!student) return res.status(404).json({ error: `No student with id ${req.params.id}` });
    res.json(student);
  } catch (err) { next(err); }
});

app.get('/api/courses', async (req, res, next) => {
  try {
    res.json(await readJson('courses.json'));
  } catch (err) { next(err); }
});

// POST /api/echo — returns what it received, so the pages can demonstrate sending JSON.
app.post('/api/echo', (req, res) => {
  res.status(201).json({ received: req.body, receivedAt: new Date().toISOString() });
});

// The manual's pages have no <link rel="icon">; answer the browser's automatic request quietly.
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(express.static(__dirname));

app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Exp 09-11 running at http://localhost:${PORT}`);
}).on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try: PORT=3001 npm start`);
    process.exit(1);
  }
  throw err;
});
