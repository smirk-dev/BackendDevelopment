# Experiment 02 — All Types of Cascading Style Sheets

Manual: `Lectures/Backend Development/Lab/Exp 02 Create a web page with all types of Cascading style sheets.md`

Every way CSS can reach a page — external, imported, internal, inline — and the rules that decide
between them, on one page in the same hand as Exp 01. The manual's six pages are kept exactly as
written, and all five practice tasks are built.

| Manual | Where |
|--------|-------|
| Theory: three types of CSS, cascade order | `index.html#types`, `#cascade` (live: switch each layer on and off) |
| Theory: selector types table | `index.html#selectors` — 12 selector families, each with a live match count |
| Theory: specificity calculation | `index.html#specificity` — computed table + a four-rule duel |
| Theory: box model | `index.html#box` — toggles `border-box` / `content-box`, reads back the widths |
| Theory: flexbox, grid | `index.html#layout` (+ `position`: static, relative, absolute, sticky) |
| Part A — External CSS | `manual/index-external.html` + `manual/styles.css` |
| Part B — Internal CSS | `manual/index-internal.html` |
| Part C — Inline CSS | `manual/index-inline.html` |
| Part D — Selectors | `manual/index-selectors.html` |
| Part E — Flexbox & Grid | `manual/index-layout.html` |
| Part F — Animations & Transitions | `manual/index-animations.html` |
| Practice Task 1 — CSS types | `tasks/task1-css-types.html` — header inline, main internal, footer external (`tasks/css/task1-footer.css`) |
| Practice Task 2 — Selector challenge | `tasks/task2-selectors.html` — 14 selectors in `tasks/css/task2.css`, table generated from that sheet |
| Practice Task 3 — Layout creation | `tasks/task3-layout.html` — flex nav, grid areas + card grid, breakpoints 1024/768/480 |
| Practice Task 4 — Animation gallery | `tasks/task4-gallery.html` — hover transitions, spinner, drifting background |
| Practice Task 5 — Theme creator | `tasks/task5-theme.html` — dark mode toggle via custom properties, remembered |

## How the origins are wired in `index.html`

| Origin | File / place |
|--------|--------------|
| External | `<link rel="stylesheet" href="css/style.css">`, `css/selectors.css` |
| Imported | `css/tokens.css`, reached only through `@import url("tokens.css")` on line 1 of `style.css` |
| External, print only | `<link rel="stylesheet" href="css/print.css" media="print">` |
| Internal | two `<style>` blocks in the head |
| Inline | `style=""` attributes (the cascade sentence, the Inline card) |
| Cascade lab layers | `css/cascade-external.css`, `#layer-internal`, the inline attribute, `css/cascade-important.css` |

`js/main.js` never sets a colour. It only flips `sheet.disabled` / the `style` attribute and
reports what `getComputedStyle` says, so every result on the page is the cascade's own.

## Run

```bash
py -3 -m http.server 8000     # from this folder, then open http://localhost:8000
```

No install, no CDN, no network. Opening `index.html` directly also works, but the checks were
run over HTTP.

## Deviations from the manual

- **None in `manual/`.** The seven files are the manual's code blocks extracted programmatically
  and compared byte-for-byte (`cmp`: identical). They keep the manual's own emoji, gradients and
  colours — that is what the manual asks for, so they are left alone.
- **The hub and the tasks use the house style** (warm paper, one accent, serif headings, no emoji,
  no gradients) so the submission set reads as one hand. Practice Task 5 adds a dark theme
  because the task asks for one.
- The manual's priority list puts "external < internal" as fixed ranks. The page demonstrates the
  more exact rule — both are author styles and the later one wins at equal specificity — and
  says so under the cascade table.

## Checks run

Headless Chrome driven over the DevTools protocol (Node 22, no packages), page served on
`http://localhost:3030`, light colour scheme pinned. **26 page loads in this folder (every page at
1280px and 375px, Task 3 also at 900 and 600): zero console errors, zero failed requests, zero
requests leaving localhost, zero broken images, no horizontal overflow at any width.**

Cascade lab, clicking the layer buttons in order (value read from the computed colour):

```
initial (all on, !important off) : the inline style attribute
!important on                    : the !important rule in cascade-important.css
!important off                   : the inline style attribute
inline off                       : the internal <style> block
internal off                     : the external file (cascade-external.css)
external off                     : the browser default (no author rule left)
all restored                     : the inline style attribute
```

Imported sheet is live: `.imported-proof` computes to `rgb(91, 107, 47)` = `--c-imported #5b6b2f`,
a rule that exists only in `tokens.css`; `style.css`'s first rule reads back as
`@import url("tokens.css");`. Stylesheets on the page:
`style.css, selectors.css, print.css [print], cascade-external.css, cascade-important.css, <style>, <style>`.
Under emulated print media `nav.toc` computes to `display: none`.

Selector match counts (from `querySelectorAll` with the same selector):
`element 1 · class 2 · id 1 · universal 7 · descendant 2 · child 3 · adjacent 1 · general 2 · attribute 6 · pseudo-class 2 · grouping 3`.

Specificity table as computed: `* 0 · p 1 · p::first-line 2 · .note 10 · [type="text"] 10 ·
a:hover 11 · ul > li 2 · p.note 11 · #spec p 101 · #spec .note 110 · #spec p.note.loud 121 ·
#header .nav a:hover 121` (the manual's own example, 121). Duel winner: `#spec p.note.loud (1,2,1)`.

Box model: `border-box` → rendered width 240px, space taken 272px; `content-box` → rendered 296px
(240 + 2×20 + 2×8), space taken 328px.

Practice tasks:

```
Task 1  header inline style attr : yes
        stylesheets on page      : css/task1-footer.css (2 rules) | <style> in head (10 rules)
        footer background-color  : rgb(20, 33, 46)
Task 2  14 selectors in task2.css; 14 of them match at least one element
        (#board * = 32, #board li:nth-child(2n+1) = 4, #board h4::before = 4, ...)
Task 3  1280 → desktop, 3 card cols, 2 page cols, nav row
         900 → tablet, 2 card cols, 2 page cols
         600 → small tablet, 2 card cols, 1 page col
         375 → phone, 1 card col, 1 page col, nav column
Task 4  loader visible on load (animation "spin"), gallery visible after 1.2 s, 6 plates,
        body animation "drift", card transition "transform, border-color"
Task 5  first visit light → click → data-theme=dark, body rgb(21, 20, 15), card rgb(31, 29, 23),
        aria-pressed=true, stored "dark"; reload → still dark; click → light rgb(251, 249, 244)
```

Screenshots in `screenshots/`: `index-1280.png`, `index-375.png`, the six manual pages at 1280,
`task1-1280.png` … `task4-1280.png`, `task3-375.png`, `task5-dark-1280.png`, `task5-light-1280.png`.
