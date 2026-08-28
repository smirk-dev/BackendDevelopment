// Theory Task 5 — L07 Web Storage exercises, wired to the controls in index.html.

const $ = id => document.getElementById(id);
const stores = { local: localStorage, session: sessionStorage };

function log(msg) {
  const time = new Date().toLocaleTimeString();
  $("log").textContent += `[${time}] ${msg}\n`;
  $("log").scrollTop = $("log").scrollHeight;
}

// Draw every key of a storage area into its table. Uses key(i) and length, the "two more" methods.
function renderTable(storage, tbodyId) {
  const tbody = $(tbodyId);
  tbody.innerHTML = "";
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    const tr = document.createElement("tr");
    const k = document.createElement("td");
    const v = document.createElement("td");
    k.textContent = key;
    v.textContent = storage.getItem(key);
    tr.append(k, v);
    tbody.append(tr);
  }
  if (storage.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" class="muted">empty</td></tr>';
  }
}

function refresh() {
  renderTable(localStorage, "ls-table");
  renderTable(sessionStorage, "ss-table");
}

// ---- 2 and 3: the core methods, once for each storage area ----
document.querySelectorAll(".buttons[data-store]").forEach(group => {
  const name = group.dataset.store;              // "local" or "session"
  const storage = stores[name];
  const prefix = name === "local" ? "ls" : "ss";
  const label = name + "Storage";

  group.addEventListener("click", event => {
    const op = event.target.dataset.op;
    if (!op) return;
    const key = $(prefix + "-key").value.trim();
    const value = $(prefix + "-value").value;

    if ((op === "set" || op === "get" || op === "remove") && !key) {
      log(`${label}: type a key first`);
      return;
    }
    if (op === "set") {
      storage.setItem(key, value);
      log(`${label}.setItem("${key}", "${value}")`);
    } else if (op === "get") {
      const got = storage.getItem(key);
      log(`${label}.getItem("${key}") -> ${got === null ? "null" : JSON.stringify(got)}`);
    } else if (op === "remove") {
      storage.removeItem(key);
      log(`${label}.removeItem("${key}")`);
    } else if (op === "clear") {
      storage.clear();
      log(`${label}.clear() — length is now ${storage.length}`);
    } else if (op === "all") {
      const keys = [];
      for (let i = 0; i < storage.length; i++) keys.push(storage.key(i));
      log(`${label}.length = ${storage.length}; keys: ${keys.join(", ") || "(none)"}`);
    }
    refresh();
  });
});

// ---- 4-6: the JSON problem and its fix ----
$("btn-object-problem").addEventListener("click", () => {
  const user = { name: "Alice", age: 25 };
  localStorage.setItem("user", user);
  log(`setItem("user", {name:"Alice", age:25}) stored -> ${JSON.stringify(localStorage.getItem("user"))}`);
  refresh();
});

$("btn-roundtrip").addEventListener("click", () => {
  const user = { name: "Alice", age: 25, hobbies: ["reading", "chess"] };
  const text = JSON.stringify(user);
  localStorage.setItem("user", text);
  const back = JSON.parse(localStorage.getItem("user"));
  log(`stored text: ${text}`);
  log(`parsed back: typeof = ${typeof back}, back.hobbies[0] = "${back.hobbies[0]}", back.age + 1 = ${back.age + 1}`);
  refresh();
});

$("btn-bad-json").addEventListener("click", () => {
  try {
    JSON.parse("not valid json");
  } catch (e) {
    log(`JSON.parse("not valid json") threw ${e.name}: ${e.message}`);
  }
});

$("btn-flow").addEventListener("click", () => {
  localStorage.setItem("todo", JSON.stringify({ text: "Learn JSON", done: false }));
  const item = JSON.parse(localStorage.getItem("todo"));
  log(`1-2. read todo: ${JSON.stringify(item)}`);
  item.done = true;
  localStorage.setItem("todo", JSON.stringify(item));
  log(`3-4. set done = true and saved back`);
  log(`5. re-read: done is now ${JSON.parse(localStorage.getItem("todo")).done}`);
  refresh();
});

// ---- 7: playground ----
document.querySelectorAll("[data-preset]").forEach(b =>
  b.addEventListener("click", () => { $("pg-value").value = b.dataset.preset; })
);

document.querySelectorAll("[data-pg]").forEach(button => {
  button.addEventListener("click", () => {
    const [area, action] = button.dataset.pg.split("-");
    const storage = stores[area];
    const key = $("pg-key").value.trim();
    const out = $("pg-out");
    if (!key) { out.textContent = "Type a key first."; return; }

    if (action === "save") {
      let data;
      try {
        data = JSON.parse($("pg-value").value);   // validate before storing
      } catch (e) {
        out.textContent = "Not valid JSON: " + e.message;
        return;
      }
      storage.setItem(key, JSON.stringify(data));
      out.textContent = `${area}Storage["${key}"] = ${storage.getItem(key)}`;
      log(`playground: saved "${key}" to ${area}Storage`);
    } else {
      const raw = storage.getItem(key);
      if (raw === null) { out.textContent = `${area}Storage has no "${key}" (getItem returned null)`; return; }
      const data = JSON.parse(raw);
      out.textContent = `typeof: ${Array.isArray(data) ? "array" : typeof data}\n` + JSON.stringify(data, null, 2);
      log(`playground: loaded "${key}" from ${area}Storage`);
    }
    refresh();
  });
});

// ---- 7.2: helper pattern ----
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function load(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}
window.save = save;
window.load = load;

$("btn-helpers").addEventListener("click", () => {
  save("settings", { theme: "dark", fontSize: 14 });
  const s = load("settings");
  log(`load("settings") -> ${JSON.stringify(s)}; s.fontSize + 2 = ${s.fontSize + 2}; load("missing") -> ${load("missing")}`);
  refresh();
});

// ---- 11: common mistakes ----
const mistakes = {
  1() {
    localStorage.setItem("cart", [{ id: 1 }, { id: 2 }]);
    return `setItem("cart", [{id:1},{id:2}]) stored ${JSON.stringify(localStorage.getItem("cart"))} — the array is lost`;
  },
  2() {
    localStorage.setItem("cart", JSON.stringify([{ id: 1 }, { id: 2 }]));
    const cart = localStorage.getItem("cart");
    return `without parse: cart.length = ${cart.length} (characters, not items); cart[0] = "${cart[0]}"`;
  },
  3() {
    localStorage.removeItem("prefs");
    const unsafe = localStorage.getItem("prefs");
    const safe = JSON.parse(localStorage.getItem("prefs")) || { theme: "light" };
    return `getItem("prefs") -> ${unsafe}; with a fallback: ${JSON.stringify(safe)}`;
  },
  4() {
    localStorage.setItem("num", 42);
    localStorage.setItem("flag", false);
    const date = JSON.parse(JSON.stringify({ when: new Date(2026, 10, 25) })).when;
    return `typeof getItem("num") = ${typeof localStorage.getItem("num")}; ` +
      `getItem("flag") is truthy: ${Boolean(localStorage.getItem("flag"))}; a Date comes back as ${typeof date}`;
  },
};
document.querySelectorAll("[data-mistake]").forEach(b =>
  b.addEventListener("click", () => { log(`mistake ${b.dataset.mistake}: ${mistakes[b.dataset.mistake]()}`); refresh(); })
);

// ---- 9.1 quiz ----
document.querySelectorAll("[data-answer]").forEach(b =>
  b.addEventListener("click", () => {
    const span = document.createElement("span");
    span.className = "answer";
    span.textContent = b.dataset.answer;
    b.replaceWith(span);
  })
);

$("btn-clear-log").addEventListener("click", () => { $("log").textContent = ""; });

// Another tab changed localStorage: the "storage" event fires here, so the table stays honest.
window.addEventListener("storage", e => {
  log(`storage event from another tab: "${e.key}" changed`);
  refresh();
});

refresh();
log(`page loaded — localStorage has ${localStorage.length} key(s), sessionStorage has ${sessionStorage.length}`);
