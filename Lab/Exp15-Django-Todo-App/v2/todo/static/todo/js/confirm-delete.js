// Task list page only: ask before submitting a delete form.
// Without JavaScript the form still posts normally.
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("form button.danger").forEach(function (button) {
        button.form.addEventListener("submit", function (event) {
            if (!window.confirm("Delete this task?")) {
                event.preventDefault();
            }
        });
    });
});
