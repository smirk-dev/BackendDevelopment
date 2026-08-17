// Exercise 3 — "Count the number of CSS classes in each." Fetches both finished pages, parses them
// with DOMParser (nothing is executed) and counts class tokens. Needs HTTP, like the rest of the folder.
(function () {
  "use strict";
  var files = { bootstrap: "exp04-bootstrap.html", tailwind: "exp04-tailwind.html" };

  function count(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var els = doc.body.querySelectorAll("[class]"), tokens = 0, unique = new Set(), longest = { n: 0, cls: "" };
    els.forEach(function (el) {
      var list = el.getAttribute("class").trim().split(/\s+/).filter(Boolean);
      tokens += list.length;
      list.forEach(function (c) { unique.add(c); });
      if (list.length > longest.n) longest = { n: list.length, cls: list.join(" ") };
    });
    return { elements: els.length, tokens: tokens, unique: unique.size, perEl: els.length ? tokens / els.length : 0, longest: longest, bytes: html.length };
  }

  Promise.all(Object.keys(files).map(function (k) {
    return fetch(files[k]).then(function (r) { return r.text(); }).then(function (t) { return [k, count(t)]; });
  })).then(function (pairs) {
    var r = {}; pairs.forEach(function (p) { r[p[0]] = p[1]; });
    var rows = [
      ["Elements with a class attribute", "elements"],
      ["Total class names used", "tokens"],
      ["Distinct class names", "unique"],
      ["Average classes per element", "perEl"],
      ["Longest class list (count)", null]
    ];
    var tb = document.querySelector("#compare-table tbody");
    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      var b = row[1] ? r.bootstrap[row[1]] : r.bootstrap.longest.n;
      var t = row[1] ? r.tailwind[row[1]] : r.tailwind.longest.n;
      var fmt = function (v) { return row[1] === "perEl" ? v.toFixed(2) : String(v); };
      tr.innerHTML = "<td></td><td class='num'></td><td class='num'></td>";
      tr.children[0].textContent = row[0];
      tr.children[1].textContent = fmt(b);
      tr.children[2].textContent = fmt(t);
      tb.appendChild(tr);
    });
    var more = r.tailwind.tokens > r.bootstrap.tokens ? "Tailwind" : "Bootstrap";
    var out = document.getElementById("compare-out");
    out.textContent =
      "More total class names: " + more + " (" + r.tailwind.tokens + " vs " + r.bootstrap.tokens + ")\n" +
      "Longest Bootstrap list: \"" + r.bootstrap.longest.cls + "\"\n" +
      "Longest Tailwind list : \"" + r.tailwind.longest.cls + "\"";
    out.dataset.bootstrap = r.bootstrap.tokens;
    out.dataset.tailwind = r.tailwind.tokens;
  }).catch(function (e) {
    document.getElementById("compare-out").textContent = "Could not fetch the pages (" + e.message + "). Serve this folder over HTTP.";
  });
})();
