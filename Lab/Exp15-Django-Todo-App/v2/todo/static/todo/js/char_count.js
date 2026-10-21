// Add Task page only: show how many of the 200 allowed characters are used.
// This is a convenience; the server still strips and checks the title.
document.addEventListener("DOMContentLoaded", function () {
    const input = document.querySelector("#title");
    if (!input) {
        return;
    }

    const max = Number(input.getAttribute("maxlength")) || 200;
    const counter = document.createElement("p");
    counter.className = "char-count";
    counter.id = "title-count";
    counter.setAttribute("aria-live", "polite");
    input.setAttribute("aria-describedby", "title-count");
    input.insertAdjacentElement("afterend", counter);

    function update() {
        counter.textContent = input.value.length + " / " + max + " characters";
        counter.classList.toggle("near-limit", input.value.length > max - 20);
    }

    input.addEventListener("input", update);
    update();
});
