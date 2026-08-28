# Theory Task 5 — localStorage, sessionStorage and JSON

**Lecture:** Unit 1, **L07 LocalStorage SessionStorage and JSON** (the interactive tutorial,
sections 1–11). Student: Suryansh Mishra (590012069), `smirk-dev`.

One static page that turns each L07 exercise into a control you can click. It covers the four
core methods plus `key(i)` and `length` for both storage areas, the "[object Object]" problem,
`JSON.stringify` / `JSON.parse` with `try...catch`, Exercise 6.1's read-modify-save flow, the JSON
playground with the three preset values from Exercise 7.1, the `save` / `load` helpers from 7.2
(also put on `window` for the console), the four common mistakes from section 11, the 9.1 quiz and
the comparison table. A live table under each storage area is redrawn after every action, and a
`storage` event listener picks up changes made in other tabs.

Section 12 of the same tutorial, the Notes app, is **Assignment 1**:
see `Theory/Assignment1-Notes-App/`.

## Files

```
Task5/
├── index.html        # page structure, one section per tutorial section
├── storage-lab.js    # all behaviour
├── style.css         # Exp 01 register, no framework, no CDN
└── screenshots/storage-lab.png
```

## Run

Serve it over HTTP (on `file://` every file gets its own opaque origin in some browsers, which
muddles the per-origin point the lecture makes):

```bash
cd Task5
python -m http.server 3046
# open http://127.0.0.1:3046/
```

## Checks run

Driven in headless Chrome through the DevTools protocol: storage cleared, then every control
clicked in order. The page's own log, verbatim:

```
page loaded — localStorage has 0 key(s), sessionStorage has 0
localStorage.setItem("favColor", "blue")
localStorage.getItem("favColor") -> "blue"
sessionStorage.setItem("tempData", "hello")
sessionStorage.getItem("tempData") -> "hello"
localStorage.setItem("city", "Dehradun")
localStorage.length = 2; keys: city, favColor
setItem("user", {name:"Alice", age:25}) stored -> "[object Object]"
stored text: {"name":"Alice","age":25,"hobbies":["reading","chess"]}
parsed back: typeof = object, back.hobbies[0] = "reading", back.age + 1 = 26
JSON.parse("not valid json") threw SyntaxError: Unexpected token 'o', "not valid json" is not valid JSON
1-2. read todo: {"text":"Learn JSON","done":false}
3-4. set done = true and saved back
5. re-read: done is now true
load("settings") -> {"theme":"dark","fontSize":14}; s.fontSize + 2 = 16; load("missing") -> null
mistake 1: setItem("cart", [{id:1},{id:2}]) stored "[object Object],[object Object]" — the array is lost
mistake 2: without parse: cart.length = 19 (characters, not items); cart[0] = "["
mistake 3: getItem("prefs") -> null; with a fallback: {"theme":"light"}
mistake 4: typeof getItem("num") = string; getItem("flag") is truthy: true; a Date comes back as string
playground: saved "tasks" to localStorage
playground: loaded "tasks" from localStorage
```

Playground output for the array preset: `typeof: array` followed by the two task objects.

Exercise 3.1, "the disappearing act", checked with a reload and then a second tab:

```
after reload (same tab): local favColor = blue | session tempData = hello
new tab:                 local favColor = blue | session tempData = null
tab 1 last log line: storage event from another tab: "fromTab2" changed
console messages: []
```

So localStorage is shared by every tab on the origin, while sessionStorage belongs to one tab: it
survives a reload of that tab but a new tab starts empty. Storage was cleared and the server
stopped afterwards. Screenshot of the page after the run: `screenshots/storage-lab.png`.
