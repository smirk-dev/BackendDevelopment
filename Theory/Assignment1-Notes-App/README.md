# Assignment 1 — Notes App (localStorage)

**Lecture:** Unit 1, **L07 LocalStorage, SessionStorage and JSON**, section **12, "Final Task: Build a
Notes App"**. Assignment 01 says "Follow tutorial and complete task 12". Student: Suryansh Mishra
(590012069), `smirk-dev`.

A notes app written in plain HTML, CSS and JavaScript, with no framework, no build step and no
server. Every note lives in the browser's `localStorage` under the key `notes`, as a JSON array.

```
Assignment1-Notes-App/
├── index.html     # markup, plus a <template> for one note card
├── style.css      # Exp 01 paper look, with a dark variant
├── app.js         # storage helpers, CRUD, render, events, import/export, theme
├── screenshots/
└── test/          # headless Chrome test (notes.test.js + cdp.js) and its last output
```

## What it does

| Requirement (L07 §12) | Done | How |
|---|---|---|
| Add a note with text | yes | textarea + Add button, or Ctrl+Enter |
| Show all saved notes on page load | yes | `renderNotes()` runs at startup from `getNotes()` |
| Delete a note | yes | Delete on each card |
| Edit a note | yes | inline: Edit turns the card into a form (Save, Cancel, Esc, Ctrl+Enter) |
| Persists after refresh | yes | every change goes through `saveNotes()` → `localStorage.setItem("notes", JSON.stringify(notes))` |
| Each note has `id, text, createdAt, updatedAt` | yes | plus `completed` and `tags` |
| *Stretch:* complete / incomplete | yes | checkbox; All / Open / Done filter |
| *Stretch:* search / filter | yes | live search over text and tags, case-insensitive |
| *Stretch:* categories or tags | yes | comma-separated tags, a chip bar with counts, click a chip to filter |
| *Stretch:* import / export JSON | yes | Export downloads `notes-YYYY-MM-DD.json`; Import validates and merges |
| *Stretch:* dark / light mode, saved | yes | stored as `notes-theme`, applied before first paint |
| *Stretch:* drag to reorder | yes | HTML5 drag and drop, plus Up / Down buttons for keyboard users |

One note as stored:

```json
{
  "id": 1789800734123,
  "text": "Buy A4 printer paper (2 reams)",
  "completed": false,
  "tags": ["errand"],
  "createdAt": "2026-09-19T07:52:14.123Z",
  "updatedAt": "2026-09-19T07:52:15.870Z"
}
```

## Where it differs from the lecture's starter code

- **No `innerHTML` with note text.** The starter's `renderNotes()` puts `${note.text}` into a
  template string and assigns it to `innerHTML`. A note containing `<img src=x onerror=...>` would
  then run script. Here each card is cloned from a `<template>` and the text is set with
  `textContent`. The test types exactly that payload and checks that nothing runs.
- **No `prompt()` for editing.** Editing happens in place on the card, so the text can be several
  lines long and the page is never blocked by a dialog.
- **Unique ids.** `Date.now()` repeats if two notes are created in the same millisecond (an import,
  or a fast script), so `newId()` takes the larger of `Date.now()` and the highest id plus one.
- **A broken stored value does not break the page.** If `localStorage.notes` is not valid JSON,
  `getNotes()` copies it to `notes-corrupt-backup`, logs a warning and starts with an empty list.
- **Tabs stay in sync.** A `storage` event listener redraws the list when another tab changes the
  notes, and applies a theme change made in another tab.
- Ticking a note as done also sets `updatedAt`, because the note did change.

## Run

Open `index.html` in a browser. To serve it over http instead (this is how the test runs):

```bash
cd Theory/Assignment1-Notes-App
python -m http.server 8000      # then open http://localhost:8000
```

## Checks run

Served with `python -m http.server 3049` and driven by `test/notes.test.js` in headless Chrome 158
over the DevTools protocol. Clicks and typing are real input events (`Input.dispatchMouseEvent`,
`Input.insertText`, `Input.dispatchKeyEvent`). Drag and drop is the one exception: it uses
`DragEvent`s with a real `DataTransfer`, because headless Chrome does not start a native drag from
synthetic mouse moves. Output from the run (`test/last-run.txt`):

```
PASS empty state on first load
PASS add: 4 notes stored (button x3, Ctrl+Enter x1)
PASS add: fields id/text/completed/tags/createdAt/updatedAt
PASS add: ids unique
PASS add: tags normalised (lower-case, # stripped)
PASS add: newest first in the list
PASS add: empty input ignored
PASS escape: no script ran, markup shown literally
PASS edit: form opens with current text
PASS edit: text and tags saved
PASS edit: updatedAt set, createdAt kept
PASS edit: card shows "edited"
PASS edit: Escape cancels without saving
PASS delete: removed from storage and DOM
PASS complete: stored completed=true, card struck through
PASS filter Done: only the completed note
PASS filter Open: the other three
PASS search "assignment": one match
PASS search is case-insensitive ("PAPER")
PASS tag chip #backend: two notes
PASS summary shows the filter count
PASS reorder: Up moves the last note one place up
PASS reorder: Down puts it back
PASS reorder: drag first card onto the lower half of the third
PASS reload: same notes, same order
PASS reload: completed state kept
PASS theme: dark applied and saved
PASS theme: still dark after reload
PASS new tab: sees the same 4 notes
PASS storage event: tab 1 shows the tab-2 note without reloading
PASS export: notes-YYYY-MM-DD.json equals localStorage
     exported file: notes-2026-09-19.json, 5 notes
PASS import: starting from 0 notes
PASS import: every exported note restored
PASS import: validates entries (1 added, 1 replaced, 2 skipped)
PASS import: rejects a file that is not a list
PASS corrupt value: page still renders, raw value backed up
PASS mobile 390px: no horizontal scroll
PASS no console errors (the corrupt-value warning is expected)
     console: ["warning: notes: stored value was not valid JSON, backed up to notes-corrupt-backup"]

38 passed, 0 failed
```

To repeat it, start Chrome with `--headless=new --remote-debugging-port=9340`, serve the folder on
port 3049, then run `node test/notes.test.js <screenshot-dir> <scratch-dir>`. The test clears this
origin's `localStorage` before and after it runs.

| Screenshot | Shows |
|---|---|
| `screenshots/notes-light.png` | the full list after the import test, with tags, a completed note and "edited" stamps |
| `screenshots/notes-editing.png` | a card in edit mode, with the escaped `<img ...>` note shown as plain text above it |
| `screenshots/notes-tag-filter.png` | the `#backend` chip filter, "4 notes, 1 done · showing 2" |
| `screenshots/notes-search.png` | live search for "jsonb" |
| `screenshots/notes-dark.png` | dark mode after a reload |
| `screenshots/notes-mobile.png` | 390 px wide, no horizontal scroll |

The http server and the test tabs were closed afterwards.
