# Experiment 03 — Responsive Web Page with HTML and CSS

Manual: `Lectures/Backend Development/Lab/Exp 03 Create a Responsive Web page with HTML and CSS.md`

A responsive page with no framework: viewport meta tag, flexbox navigation, CSS Grid cards and
media queries. The manual's five hands-on tasks are kept exactly as written, the three exercises
are applied on top of Task 5, and `index.html` is the finished page in the same hand as Exp 01/02.

| Manual | Where |
|--------|-------|
| Task 1 — HTML skeleton with viewport | `manual/task1.html` |
| Task 2 — flexbox row | `manual/task2.html` |
| Task 3 — cards stack on mobile | `manual/task3.html` |
| Task 4 — responsive navigation bar | `manual/task4.html` |
| Task 5 — footer and CSS Grid | `manual/task5.html` |
| Exercise 1 — 4 columns above 1024px | `manual/exercises.html` (4th card + `@media (min-width: 1025px)`) |
| Exercise 2 — responsive image | `manual/exercises.html` (`max-width: 100%; height: auto`) |
| Exercise 3 — dark mode | `manual/exercises.html` (`@media (prefers-color-scheme: dark)`) |
| All of it, finished | `index.html` + `css/style.css` |

`index.html` is written **mobile-first**: the base rules are the phone layout and `min-width`
queries add columns — 1 → 2 (481px) → 3 (769px) → 4 (1025px). It also uses every pattern in the
manual's "Common Media Query Patterns" list: max/min width, a range query, `print`, an
orientation query, plus `prefers-color-scheme: dark`. A label under the heading is written by the
active media query (`.bp::after { content: … }`), so the breakpoint is visible without DevTools.
The body is a flex column with `main { flex: 1 }`, so the footer sits at the bottom on short pages.

## Run

```bash
py -3 -m http.server 8000     # from this folder, then open http://localhost:8000
```

Resize the window, or use DevTools' device toolbar. No install, no CDN.

## Deviations from the manual

- `manual/task1.html` … `task5.html` are the manual's code blocks, extracted programmatically and
  compared byte-for-byte with `cmp` (identical).
- `manual/exercises.html` is Task 5 with exactly the three exercise changes (36 added lines).
  Exercise 3 only names `background-color` and text colour; with that alone the cards stay white
  and `#e0e0e0` text on them is unreadable, so the dark query also darkens `.card` to `#262626`
  and recolours the card headings and text.
- The image is a local SVG (`assets/hero.svg`) — no placeholder service.
- `index.html` is in the house style (warm paper, one accent, serif headings). Its dark mode is
  the house palette darkened, as Exercise 3 asks.

## Checks run

Headless Chrome over the DevTools protocol, served on `http://localhost:3030`, light colour scheme
pinned unless stated. **25 page loads (index at 1280/900/600/375, dark, print; all six manual
pages at 1280/900/375): zero console errors, zero failed or off-site requests, zero broken images,
no horizontal overflow anywhere.**

`index.html`, read back from computed styles at each width:

```
1280  label "desktop · > 1024px · 4 columns"        cols 4  nav row     image 224px in a 258px card
 900  label "tablet · 769–1024px · 3 columns"       cols 3  nav row     image 229px in 263px
 600  label "small tablet · 481–768px · 2 columns"  cols 2  nav row     image 228.5px in 262.5px
 375  label "phone · ≤ 480px · 1 column"            cols 1  nav column  image 309px in 343px
      highlighted table row matched the width every time; footer at the bottom every time
dark  (prefers-color-scheme: dark) body rgb(26, 26, 26), text rgb(224, 224, 224)
print .site-nav display none, card images display none
```

Manual pages, `.container` layout per width (1280 / 900 / 375):

```
task1      no container (header only)
task2      flex row   / flex row   / flex row       — no media query yet, as in the manual
task3      flex row   / flex row   / flex column
task4      flex row   / flex row   / flex column
task5      grid 3col  / grid 3col  / grid 1col
exercises  grid 4col  / grid 3col  / grid 1col      dark: body rgb(26,26,26), card text rgb(224,224,224)
```

Screenshots in `screenshots/`: `index-1280.png`, `index-900.png`, `index-600.png`,
`index-375.png`, `index-dark-1280.png`, `manual-task5-1280.png`, `manual-task5-375.png`,
`exercises-1280.png`, `exercises-900.png`, `exercises-375.png`, `exercises-dark-1280.png`.
