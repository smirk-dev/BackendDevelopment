# Experiment 04 — Responsive Web Pages with Bootstrap and Tailwind CSS

Manual: `Lectures/Backend Development/Lab/Exp 04 Create Responsive web page with Bootstrap.md`
(the manual's own title: "Create Responsive Web Pages with Bootstrap and Tailwind CSS")

The same responsive page built twice — Bootstrap (Part A, Tasks 1-4) and Tailwind CSS (Part B,
Tasks 5-8) — with both contact-form exercises and a live class count for Exercise 3. Both
frameworks are **vendored in `vendor/`**: no CDN link anywhere, the folder works offline.

| Manual | Where |
|--------|-------|
| Part A, Task 1 — Bootstrap setup | `manual/bootstrap-task1.html` |
| Task 2 — responsive navbar | `manual/bootstrap-task2.html` |
| Task 3 — hero with grid columns | `manual/bootstrap-task3.html` |
| Task 4 — card grid section | `manual/bootstrap-task4.html` |
| Part B, Task 5 — Tailwind setup | `manual/tailwind-task5.html` |
| Task 6 — Tailwind navbar | `manual/tailwind-task6.html` |
| Task 7 — Tailwind hero | `manual/tailwind-task7.html` |
| Task 8 — card grid + footer | `manual/tailwind-task8.html` |
| Exercise 1 — Bootstrap contact form (`form-group`, `form-label`, `form-control`) | `exp04-bootstrap.html#contact` (Task 4 + the form) |
| Exercise 2 — the same form in Tailwind (`w-full border rounded px-3 py-2`) | `exp04-tailwind.html#contact` (Task 8 + the form) |
| Exercise 3 — count the classes, which is easier to read | `index.html#compare` (`js/compare.js` fetches and parses both pages) |
| Hub page | `index.html` (house style; the framework pages keep their framework look) |

## Vendored files

| File | Source | Size | SHA-256 |
|------|--------|------|---------|
| `vendor/bootstrap-5.3.3/css/bootstrap.min.css` | `cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/` | 232,803 B | `3c8f27e6…2e736fc8` |
| `vendor/bootstrap-5.3.3/js/bootstrap.bundle.min.js` | same (bundle includes Popper) | 80,721 B | `0833b2e9…98a61c6c` |
| `vendor/bootstrap-5.3.3/LICENSE` | same | | |
| `vendor/tailwind/tailwind.css` | built with Tailwind CLI 3.4.17 from the Tailwind pages' classes | 8,807 B | |
| `vendor/tailwind/tailwind.config.js`, `input.css`, `LICENSE` | build inputs, so the CSS can be regenerated | | |

Rebuild the Tailwind CSS after adding classes (from this folder):

```bash
npx tailwindcss@3.4.17 -c vendor/tailwind/tailwind.config.js -i vendor/tailwind/input.css -o vendor/tailwind/tailwind.css --minify
```

## Run

```bash
py -3 -m http.server 8000     # from this folder, then open http://localhost:8000
```

HTTP is needed for the Exercise 3 counter (it `fetch`es the two pages). Everything else also opens
from disk.

## Deviations from the manual

Every page in `manual/` is the manual's code block, extracted programmatically. The **only**
changed lines (checked with `diff`) are the ones that would reach the network:

| Manual line | Replaced with | Why |
|-------------|---------------|-----|
| `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css` | `../vendor/bootstrap-5.3.3/css/bootstrap.min.css` | no CDN; same file, same version |
| `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js` | `../vendor/bootstrap-5.3.3/js/bootstrap.bundle.min.js` | same |
| `<script src="https://cdn.tailwindcss.com"></script>` | `<link rel="stylesheet" href="../vendor/tailwind/tailwind.css">` | the Play CDN compiles in the browser and the manual itself says it is "for dev only"; the classes are compiled ahead of time instead — the production route the manual describes (9 KB, no runtime script) |
| `https://via.placeholder.com/500x300` | `../assets/hero.svg` (500×300) | the placeholder service is dead and remote |

`exp04-bootstrap.html` / `exp04-tailwind.html` are Task 4 / Task 8 with the same replacements
(paths without `../`) plus the exercise form inserted before the footer.

## Checks run

Headless Chrome over the DevTools protocol, served on `http://localhost:3030`. **24 page loads
(hub at 1280/375, both finished pages at 1280/900/375, all eight manual pages at 1280/375): zero
console errors, zero failed requests, zero requests leaving localhost, zero broken images, no
horizontal overflow.**

Bootstrap (`exp04-bootstrap.html`):

```
bootstrap JS loaded           : bootstrap.Tooltip.VERSION = "5.3.3" (from vendor/)
.btn-primary background       : rgb(13, 110, 253)   ← Bootstrap CSS applied
1280  cards' top edges [514, 514, 514]    → 3 columns (col-lg-4); hero columns 570 + 570; toggler hidden; form name/email side by side
 900  cards' top edges [725, 725, 917]    → 2 columns (col-md-6); hero stacked; toggler shown
 375  cards' top edges [673, 865, 1057]   → 1 column; form fields stacked (tops 1326, 1412)
      click .navbar-toggler → #navMenu has class "show": true
```

Tailwind (`exp04-tailwind.html`):

```
nav background                : rgb(17, 24, 39) = bg-gray-900 ← compiled CSS applied
1280  card grid 3 cols, hero flex-direction row,    form 2 cols
 900  card grid 2 cols, hero flex-direction column, form 2 cols
 375  card grid 1 col,  hero flex-direction column, form 1 col
```

Exercise 3, as computed by `index.html` from the two files:

```
Measure                          Bootstrap  Tailwind
Elements with a class attribute         64        48
Total class names used                 115       183
Distinct class names                    58        67
Average classes per element           1.80      3.81
Longest class list (count)               4         9
More total class names: Tailwind (183 vs 115)
Longest Bootstrap list: "navbar navbar-expand-lg navbar-dark bg-dark"
Longest Tailwind list : "max-w-6xl mx-auto px-4 py-16 flex flex-col lg:flex-row items-center gap-12"
```

Tailwind uses fewer elements with classes but 59% more class names, about twice as many per
element. The Bootstrap file is easier to read (names say what an element *is*); the Tailwind file
says how each element *looks* without leaving the HTML.

Screenshots in `screenshots/`: `index-1280.png`, `bootstrap-1280.png`, `bootstrap-375.png`,
`bootstrap-375-menu-open.png`, `tailwind-1280.png`, `tailwind-375.png`.
