// Exp 15 v1 — served from todo/static/todo/js/ to show the static directory at work.
// Focuses the title box on the Add page; nothing else depends on it.
document.addEventListener("DOMContentLoaded", function () {
    const title = document.querySelector('input[name="title"]');
    if (title) title.focus();
});
