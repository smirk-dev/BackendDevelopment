// Exp 02 — the page's only script. It never sets colours itself: it switches stylesheets on
// and off and reports what the browser computed, so every result on the page is the cascade's.

(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- 2. cascade lab ---------- */
  var target = $("#cascade-target");
  var inlineValue = target.getAttribute("style");
  var layers = {
    external: function (on) { $("#layer-external").sheet.disabled = !on; },
    internal: function (on) { $("#layer-internal").sheet.disabled = !on; },
    inline: function (on) { on ? target.setAttribute("style", inlineValue) : target.removeAttribute("style"); },
    important: function (on) { $("#layer-important").sheet.disabled = !on; }
  };
  var state = { external: true, internal: true, inline: true, important: false };

  function tokenColour(name) {
    var probe = document.createElement("span");
    probe.style.color = "var(" + name + ")";
    document.body.appendChild(probe);
    var c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }
  var names = {};
  [["--c-external", "the external file (cascade-external.css)"],
   ["--c-internal", "the internal <style> block"],
   ["--c-inline", "the inline style attribute"],
   ["--c-important", "the !important rule in cascade-important.css"]]
    .forEach(function (p) { names[tokenColour(p[0])] = p[1]; });

  function reportCascade() {
    var colour = getComputedStyle(target).color;
    var on = Object.keys(state).filter(function (k) { return state[k]; });
    var winner = names[colour] || "the browser default (no author rule left)";
    $("#cascade-out").textContent =
      "layers on : " + (on.length ? on.join(", ") : "none") + "\n" +
      "computed  : color = " + colour + "\n" +
      "winner    : " + winner;
    target.dataset.winner = winner;
  }

  document.querySelectorAll("[data-layer]").forEach(function (btn) {
    var key = btn.dataset.layer;
    layers[key](state[key]);
    btn.addEventListener("click", function () {
      state[key] = !state[key];
      layers[key](state[key]);
      btn.setAttribute("aria-pressed", String(state[key]));
      reportCascade();
    });
  });
  reportCascade();

  /* ---------- 3. selector counters ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var n = document.querySelectorAll(el.dataset.count).length;
    el.textContent = "matches " + n + " element" + (n === 1 ? "" : "s");
    el.dataset.matches = n;
  });

  /* ---------- 4. specificity ---------- */
  // Small, honest calculator for the selector forms used on this page (no :is()/:where() args).
  function specificity(sel) {
    var a = 0, b = 0, c = 0;
    var s = sel;
    s = s.replace(/::[\w-]+/g, function () { c++; return " "; });
    s = s.replace(/:(before|after|first-line|first-letter)\b/g, function () { c++; return " "; });
    s = s.replace(/#[\w-]+/g, function () { a++; return " "; });
    s = s.replace(/\.[\w-]+/g, function () { b++; return " "; });
    s = s.replace(/\[[^\]]+\]/g, function () { b++; return " "; });
    s = s.replace(/:[\w-]+(\([^)]*\))?/g, function () { b++; return " "; });
    s = s.replace(/[*>+~]/g, " ");
    (s.match(/[a-zA-Z][\w-]*/g) || []).forEach(function () { c++; });
    return [a, b, c];
  }
  var examples = ["*", "p", "p::first-line", ".note", "[type=\"text\"]", "a:hover",
    "ul > li", "p.note", "#spec p", "#spec .note", "#spec p.note.loud", "#header .nav a:hover"];
  var tbody = $("#spec-table tbody");
  examples.forEach(function (sel) {
    var s = specificity(sel);
    var tr = document.createElement("tr");
    tr.innerHTML = "<td><code></code></td><td></td><td></td>";
    tr.children[0].firstChild.textContent = sel;
    tr.children[1].textContent = "(" + s.join(", ") + ")";
    tr.children[2].textContent = s[0] * 100 + s[1] * 10 + s[2];
    tbody.appendChild(tr);
  });
  var specTarget = $("#spec-target");
  var specColour = getComputedStyle(specTarget).color;
  var specNames = {};
  specNames[tokenColour("--accent")] = "#spec p.note.loud  (1,2,1)";
  $("#spec-out").textContent =
    "rules: #spec p (1,0,1) · #spec .note (1,1,0) · p.note (0,1,1) · #spec p.note.loud (1,2,1)\n" +
    "computed color = " + specColour + "\nwinner         = " + (specNames[specColour] || "unexpected");
  specTarget.dataset.winner = specNames[specColour] || "unexpected";

  /* ---------- 5. box model ---------- */
  var box = $("#bm-box"), bmBtn = $("#bm-toggle");
  function reportBox() {
    var cs = getComputedStyle(box);
    $("#bm-out").textContent =
      "box-sizing      : " + cs.boxSizing + "\n" +
      "width (CSS)     : 240px\n" +
      "padding / border: " + cs.paddingLeft + " / " + cs.borderLeftWidth + " each side\n" +
      "margin          : " + cs.marginLeft + "\n" +
      "rendered width  : " + box.offsetWidth + "px  (offsetWidth = content + padding + border)\n" +
      "space taken     : " + (box.offsetWidth + 2 * parseFloat(cs.marginLeft)) + "px  (+ margins)";
  }
  bmBtn.addEventListener("click", function () {
    var contentBox = box.classList.toggle("content-box");
    bmBtn.textContent = "box-sizing: " + (contentBox ? "content-box" : "border-box");
    bmBtn.setAttribute("aria-pressed", String(!contentBox));
    reportBox();
  });
  reportBox();

  /* ---------- 6. flex justify-content ---------- */
  var flex = $("#flex-demo");
  document.querySelectorAll("[data-justify]").forEach(function (b) {
    b.addEventListener("click", function () {
      flex.style.justifyContent = b.dataset.justify;
      $("#flex-out").textContent = "justify-content: " + getComputedStyle(flex).justifyContent;
    });
  });
})();
