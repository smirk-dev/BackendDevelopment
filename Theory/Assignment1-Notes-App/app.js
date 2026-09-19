// Assignment 1 — L07 section 12, "Build a Notes App". Plain HTML/CSS/JS, localStorage only.
// The data layer follows the lecture's starter pattern (getNotes / saveNotes / addNote / updateNote /
// deleteNote / renderNotes). The changes from the starter are noted where they happen.

const KEY = "notes";
const THEME_KEY = "notes-theme";

// ---------- storage ----------

function getNotes() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        // A hand-edited or half-written value should not brick the app. Keep a copy and start clean.
        localStorage.setItem(KEY + "-corrupt-backup", raw);
        console.warn("notes: stored value was not valid JSON, backed up to notes-corrupt-backup");
        return [];
    }
}

function saveNotes(notes) {
    localStorage.setItem(KEY, JSON.stringify(notes));
}

// Date.now() repeats if two notes are added in the same millisecond (an import, a fast test),
// so bump past the largest id already used.
function newId(notes) {
    const max = notes.reduce((m, n) => Math.max(m, Number(n.id) || 0), 0);
    return Math.max(Date.now(), max + 1);
}

function parseTags(str) {
    const seen = new Set();
    return String(str || "")
        .split(",")
        .map(t => t.trim().toLowerCase().replace(/^#/, ""))
        .filter(t => t && !seen.has(t) && seen.add(t))
        .slice(0, 8);
}

// ---------- CRUD ----------

function addNote(text, tagStr) {
    const notes = getNotes();
    const now = new Date().toISOString();
    notes.unshift({                       // newest first; drag or Up/Down changes the order after that
        id: newId(notes),
        text: text,
        completed: false,
        tags: parseTags(tagStr),
        createdAt: now,
        updatedAt: null
    });
    saveNotes(notes);
    renderNotes();
}

function updateNote(id, changes) {
    const notes = getNotes();
    const note = notes.find(n => n.id === id);
    if (!note) return;
    Object.assign(note, changes, { updatedAt: new Date().toISOString() });
    saveNotes(notes);
    renderNotes();
}

function deleteNote(id) {
    saveNotes(getNotes().filter(n => n.id !== id));
    renderNotes();
}

function toggleComplete(id) {
    const note = getNotes().find(n => n.id === id);
    if (note) updateNote(id, { completed: !note.completed });
}

// Reorder: take note `id` out and put it directly before or after `targetId`. Positions are looked up
// in the full list, so this also works while a search or tag filter hides some notes.
function moveNote(id, targetId, after = false) {
    if (id === targetId) return;
    const notes = getNotes();
    const from = notes.findIndex(n => n.id === id);
    if (from < 0) return;
    const [note] = notes.splice(from, 1);
    const at = notes.findIndex(n => n.id === targetId);
    if (at < 0) return;
    notes.splice(after ? at + 1 : at, 0, note);
    saveNotes(notes);
    renderNotes();
}

// ---------- view state (not saved: a filter is a question you are asking right now) ----------

const view = { query: "", show: "all", tag: null, editing: null };

function visibleNotes(notes) {
    const q = view.query.trim().toLowerCase();
    return notes.filter(n =>
        (view.show === "all" || (view.show === "done") === Boolean(n.completed)) &&
        (!view.tag || (n.tags || []).includes(view.tag)) &&
        (!q || n.text.toLowerCase().includes(q) || (n.tags || []).some(t => t.includes(q)))
    );
}

// ---------- render ----------
// The lecture's renderNotes builds HTML with a template string and innerHTML, which runs any
// markup typed into a note (try <img src=x onerror=alert(1)>). Here every piece of user text goes in
// through textContent, so a note is always shown as the characters that were typed.

const $ = id => document.getElementById(id);
const fmt = iso => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function renderNotes() {
    const all = getNotes();
    const notes = visibleNotes(all);
    const list = $("notesList");
    const tpl = $("noteTpl");
    list.replaceChildren();

    for (const note of notes) {
        const li = tpl.content.firstElementChild.cloneNode(true);
        li.dataset.id = note.id;
        li.classList.toggle("completed", Boolean(note.completed));
        li.querySelector(".done").checked = Boolean(note.completed);

        if (view.editing === note.id) {
            li.draggable = false;
            li.classList.add("editing");
            li.querySelector(".text").replaceWith(editForm(note));
            li.querySelector(".tags").remove();
            li.querySelector(".actions").remove();
        } else {
            li.querySelector(".text").textContent = note.text;
            const tags = li.querySelector(".tags");
            for (const t of note.tags || []) {
                const b = document.createElement("button");
                b.type = "button";
                b.className = "tag";
                b.textContent = "#" + t;
                b.dataset.tag = t;
                const item = document.createElement("li");
                item.append(b);
                tags.append(item);
            }
        }
        li.querySelector(".meta").textContent =
            "Created " + fmt(note.createdAt) + (note.updatedAt ? " · edited " + fmt(note.updatedAt) : "");
        list.append(li);
    }

    const done = all.filter(n => n.completed).length;
    $("summary").textContent = all.length === 0 ? "" :
        `${all.length} note${all.length === 1 ? "" : "s"}, ${done} done` +
        (notes.length !== all.length ? ` · showing ${notes.length}` : "");

    const empty = $("emptyState");
    empty.hidden = notes.length > 0;
    empty.textContent = all.length === 0 ? "No notes yet. Write one above." : "No notes match this filter.";

    renderTagBar(all);
}

function renderTagBar(all) {
    const counts = new Map();
    for (const n of all) for (const t of n.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
    if (view.tag && !counts.has(view.tag)) view.tag = null;
    const bar = $("tagBar");
    bar.replaceChildren();
    for (const [t, c] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tag" + (view.tag === t ? " on" : "");
        b.dataset.tag = t;
        b.setAttribute("aria-pressed", view.tag === t);
        b.textContent = `#${t} ${c}`;
        bar.append(b);
    }
}

function editForm(note) {
    const form = document.createElement("form");
    form.className = "edit-form";
    const ta = document.createElement("textarea");
    ta.className = "edit-text";
    ta.rows = 3;
    ta.maxLength = 2000;
    ta.value = note.text;
    ta.setAttribute("aria-label", "Edit note text");
    const tags = document.createElement("input");
    tags.className = "edit-tags";
    tags.value = (note.tags || []).join(", ");
    tags.placeholder = "tags, comma separated";
    tags.setAttribute("aria-label", "Edit tags");
    const save = document.createElement("button");
    save.type = "submit";
    save.className = "save";
    save.textContent = "Save";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "cancel";
    cancel.textContent = "Cancel";
    const row = document.createElement("div");
    row.className = "add-row";
    row.append(tags, save, cancel);
    form.append(ta, row);

    form.addEventListener("submit", e => {
        e.preventDefault();
        const text = ta.value.trim();
        if (!text) { ta.focus(); return; }
        view.editing = null;
        updateNote(note.id, { text, tags: parseTags(tags.value) });
    });
    cancel.addEventListener("click", () => { view.editing = null; renderNotes(); });
    form.addEventListener("keydown", e => {
        if (e.key === "Escape") { view.editing = null; renderNotes(); }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) form.requestSubmit();
    });
    queueMicrotask(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); });
    return form;
}

// ---------- events ----------

$("addForm").addEventListener("submit", e => {
    e.preventDefault();
    const text = $("noteInput").value.trim();
    if (!text) return;
    addNote(text, $("tagInput").value);
    $("noteInput").value = "";
    $("tagInput").value = "";
    $("noteInput").focus();
});
$("noteInput").addEventListener("keydown", e => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) $("addForm").requestSubmit();
});

// One listener on the list handles every card's buttons (event delegation).
$("notesList").addEventListener("click", e => {
    const li = e.target.closest("li.note");
    if (!li) return;
    const id = Number(li.dataset.id);
    const btn = e.target.closest("button");
    if (e.target.classList.contains("done")) return toggleComplete(id);
    if (!btn) return;
    if (btn.classList.contains("del")) return deleteNote(id);
    if (btn.classList.contains("edit")) { view.editing = id; return renderNotes(); }
    if (btn.dataset.tag) { view.tag = btn.dataset.tag; return renderNotes(); }
    const shown = [...$("notesList").children].map(x => Number(x.dataset.id));
    const i = shown.indexOf(id);
    if (btn.classList.contains("up") && i > 0) return moveNote(id, shown[i - 1]);
    if (btn.classList.contains("down") && i < shown.length - 1) return moveNote(id, shown[i + 1], true);
});

// Drag to reorder (HTML5 drag and drop). Dropping on the top half of a card puts the note before it.
let dragId = null;
$("notesList").addEventListener("dragstart", e => {
    const li = e.target.closest("li.note");
    if (!li) return;
    dragId = Number(li.dataset.id);
    li.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(dragId));
});
$("notesList").addEventListener("dragover", e => {
    if (dragId === null) return;
    e.preventDefault();
    for (const x of document.querySelectorAll(".drop-before, .drop-after")) x.classList.remove("drop-before", "drop-after");
    const li = e.target.closest("li.note");
    if (!li || Number(li.dataset.id) === dragId) return;
    const r = li.getBoundingClientRect();
    li.classList.add(e.clientY < r.top + r.height / 2 ? "drop-before" : "drop-after");
});
$("notesList").addEventListener("drop", e => {
    e.preventDefault();
    const li = e.target.closest("li.note");
    if (dragId === null || !li) return;
    moveNote(dragId, Number(li.dataset.id), li.classList.contains("drop-after"));
});
$("notesList").addEventListener("dragend", () => {
    dragId = null;
    for (const x of document.querySelectorAll(".dragging, .drop-before, .drop-after")) x.classList.remove("dragging", "drop-before", "drop-after");
});

$("searchInput").addEventListener("input", e => { view.query = e.target.value; renderNotes(); });
document.querySelector(".seg").addEventListener("click", e => {
    const b = e.target.closest("button[data-show]");
    if (!b) return;
    view.show = b.dataset.show;
    for (const x of document.querySelectorAll(".seg button")) x.classList.toggle("on", x === b);
    renderNotes();
});
$("tagBar").addEventListener("click", e => {
    const b = e.target.closest("button[data-tag]");
    if (!b) return;
    view.tag = view.tag === b.dataset.tag ? null : b.dataset.tag;
    renderNotes();
});

// ---------- export / import ----------

$("exportBtn").addEventListener("click", () => {
    const notes = getNotes();
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "notes-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    $("ioStatus").textContent = `Exported ${notes.length} note${notes.length === 1 ? "" : "s"}.`;
});

// Accept an array of notes (or { notes: [...] }). Each entry needs a non-empty text; everything else
// is filled in. A note whose id already exists replaces the stored one, the rest are added at the end.
function importNotes(data) {
    const incoming = Array.isArray(data) ? data : (data && Array.isArray(data.notes) ? data.notes : null);
    if (!incoming) throw new Error("expected a JSON array of notes");
    const notes = getNotes();
    let added = 0, replaced = 0, skipped = 0;
    for (const raw of incoming) {
        if (!raw || typeof raw.text !== "string" || !raw.text.trim()) { skipped++; continue; }
        const clean = {
            id: Number.isFinite(Number(raw.id)) && Number(raw.id) > 0 ? Number(raw.id) : newId(notes),
            text: raw.text.trim().slice(0, 2000),
            completed: Boolean(raw.completed),
            tags: parseTags(Array.isArray(raw.tags) ? raw.tags.join(",") : raw.tags),
            createdAt: isNaN(Date.parse(raw.createdAt)) ? new Date().toISOString() : new Date(raw.createdAt).toISOString(),
            updatedAt: raw.updatedAt && !isNaN(Date.parse(raw.updatedAt)) ? new Date(raw.updatedAt).toISOString() : null
        };
        const at = notes.findIndex(n => n.id === clean.id);
        if (at >= 0) { notes[at] = clean; replaced++; } else { notes.push(clean); added++; }
    }
    saveNotes(notes);
    renderNotes();
    return { added, replaced, skipped };
}

$("importFile").addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const r = importNotes(JSON.parse(await file.text()));
        $("ioStatus").textContent = `Imported: ${r.added} added, ${r.replaced} replaced` + (r.skipped ? `, ${r.skipped} skipped` : "") + ".";
    } catch (err) {
        $("ioStatus").textContent = "Import failed: " + err.message;
    }
    e.target.value = "";
});

// ---------- theme ----------

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    $("themeToggle").textContent = theme === "dark" ? "Light mode" : "Dark mode";
    $("themeToggle").setAttribute("aria-pressed", theme === "dark");
}
$("themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
});

// Another tab changed the notes or the theme: the storage event fires here, so redraw.
window.addEventListener("storage", e => {
    if (e.key === KEY) renderNotes();
    if (e.key === THEME_KEY) applyTheme(e.newValue || "light");
});

applyTheme(localStorage.getItem(THEME_KEY) || "light");
renderNotes();
