# Experiment 05 — Programs to demonstrate JavaScript arrays, objects and functions

Manual: `Lectures/Backend Development/Lab/Exp 05 Programs to demonstrate JavaScript array, object and functions.md`
(CO2, Unit II).

| Manual | Where |
|--------|-------|
| Part B Task 1 — basic arrays, objects, functions | `script.js` — the manual's code, unchanged |
| Part B Task 2 — string, array and object methods | `script2.js` — the manual's code, unchanged |
| Part B Task 3 — HTML integration | `task3-index.html` — the manual's page, unchanged; `index.html` also loads `script.js` |
| Part B Task 4 — Node.js execution | every `.js` file runs under `node` (output below) |
| PBL — `library`, `addBook(title, author)`, `findBook(title)` | `library.js`, tested by `test-library.js` |
| (extension) further array / object / function programs | `programs.js` |

`index.html` is the page to open. It runs every program inside its own function scope with a
console that prints into the page, so each program's output sits under its source without
opening DevTools; the PBL section adds a form to call `addBook()` / `findBook()` interactively and
a table that shows the `library` array.

## Run

```bash
# Node (Task 4)
node script.js
node script2.js
node library.js
node test-library.js
node programs.js

# Browser — serve over HTTP (the page fetch()es the .js files to show their source)
py -3 -m http.server 8000      # open http://localhost:8000
```

No install step, no CDN, no dependencies.

## Deviations from the manual

- None in `script.js`, `script2.js` or `task3-index.html` — byte-for-byte the manual's code.
- `index.html` is not the manual's three-line Task 3 page; it is the styled demo page (same visual
  register as Exp 01 and Exp 07-08). It still loads `script.js` with a plain `<script>` tag, so the
  Task 3 behaviour (output in the F12 console) holds. The manual's exact page is kept as
  `task3-index.html`.
- PBL: the manual only asks for `addBook` and `findBook`. `addBook` also trims input, rejects
  blank fields and duplicate titles (returns `null`), and gives each book an `id`; `findBook` is
  case-insensitive. Both are exported with `module.exports` so `test-library.js` can `require()` them.

## Checks run

**Node.js (Task 4)** — Node v22.23.2, real output:

```text
$ node script.js
--- Array Demonstration ---
Fruits array: [ 'Apple', 'Banana', 'Mango' ]
After push: [ 'Apple', 'Banana', 'Mango', 'Orange' ]

--- Object Demonstration ---
Student object: { name: 'John Doe', age: 20, course: 'Backend Development' }
Student Name: John Doe

--- Function Demonstration ---
Hello, Student! Welcome to Backend Development Lab.

$ node script2.js
--- String Methods ---
Original: Backend Development
Upper Case: BACKEND DEVELOPMENT
Lower Case: backend development
Split by space: [ 'Backend', 'Development' ]

--- Array Methods ---
After Adding: [ 'Node', 'Express', 'MongoDB' ]
First Item (Read): Node
After Updating: [ 'Node.js', 'Express', 'MongoDB' ]

--- Object Methods ---
After Adding Key: { name: 'John', role: 'Dev', age: 25 }
User Name (Read): John
After Updating Role: { name: 'John', role: 'Senior Dev', age: 25 }

$ node library.js
--- Adding books ---
{ id: 1, title: 'Clean Code', author: 'Robert C. Martin' }
{ id: 2, title: "You Don't Know JS", author: 'Kyle Simpson' }
{ id: 3, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke' }
Duplicate rejected: null
Blank rejected: null

--- Library ---
[
  { id: 1, title: 'Clean Code', author: 'Robert C. Martin' },
  { id: 2, title: "You Don't Know JS", author: 'Kyle Simpson' },
  { id: 3, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke' }
]

--- Finding books ---
findBook("Eloquent JavaScript"): { id: 3, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke' }
findBook("  clean code "): { id: 1, title: 'Clean Code', author: 'Robert C. Martin' }
findBook("Missing Book"): undefined

$ node test-library.js
ok  - library starts as an empty array
ok  - addBook stores a book object and returns it
ok  - addBook trims input
ok  - addBook rejects duplicates, blanks and non-strings
ok  - findBook finds by exact title
ok  - findBook is case-insensitive and trims
ok  - findBook returns undefined when absent or given a non-string

7 tests passed

```

`node programs.js` prints 43 lines (array methods, objects, functions); the same text is visible
on the page under "Further programs".

**Browser vs Node, compared byte for byte.** Headless Chrome 158 driven over the DevTools protocol
loaded `http://127.0.0.1:3032/`, read each output panel and diffed it with `node <file>` stdout:

```text
script.js: browser panel == node stdout (identical)
script2.js: browser panel == node stdout (identical)
programs.js: browser panel == node stdout (identical)
```

**PBL form, driven through the page** (sample books button, then typed input):

```text
addBook('Clean Code', 'Robert C. Martin') → { id: 1, title: 'Clean Code', author: 'Robert C. Martin' }
addBook("You Don't Know JS", 'Kyle Simpson') → { id: 2, title: "You Don't Know JS", author: 'Kyle Simpson' }
addBook('Eloquent JavaScript', 'Marijn Haverbeke') → { id: 3, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke' }
addBook('Refactoring', 'Martin Fowler') → { id: 4, title: 'Refactoring', author: 'Martin Fowler' }
addBook('clean code', 'Dup') → null (blank or duplicate title)
addBook('  ', 'Blank') → null (blank or duplicate title)
findBook('  ELOQUENT javascript ') → { id: 3, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke' }
findBook('Missing Book') → undefined
```

The table then held exactly four rows (ids 1-4). Zero console errors, zero horizontal overflow
at 1280 px and at 375 px. `script.js`'s own output also appeared in the DevTools console (Task 3).

Screenshots (full page, after the PBL interactions): `screenshots/exp05-1280.png`,
`screenshots/exp05-375.png`.
