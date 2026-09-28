// Runs each program file inside its own function scope with a console that writes to the
// page, so the manual's top-level `const`s never collide and the output is visible without F12.
(function () {
  'use strict';

  // Format a value roughly the way Node's util.inspect does for console.log.
  function inspect(value, nested) {
    if (typeof value === 'string') return nested ? quote(value) : value;
    if (typeof value === 'function') return `[Function: ${value.name || '(anonymous)'}]`;
    if (value === null || typeof value !== 'object') return String(value);
    if (Array.isArray(value)) {
      return value.length ? `[ ${value.map(v => inspect(v, true)).join(', ')} ]` : '[]';
    }
    const ctor = value.constructor && value.constructor !== Object ? value.constructor.name + ' ' : '';
    const keys = Object.keys(value);
    if (!keys.length) return ctor + '{}';
    const body = keys.map(k => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k)}: ${inspect(value[k], true)}`);
    return `${ctor}{ ${body.join(', ')} }`;
  }
  function quote(s) {
    return s.includes("'") && !s.includes('"') ? `"${s}"` : `'${s.replace(/'/g, "\\'")}'`;
  }

  function pageConsole(panel) {
    const write = (...args) => { panel.textContent += args.map(a => inspect(a, false)).join(' ') + '\n'; };
    return { log: write, info: write, warn: write, error: write };
  }

  async function load(article) {
    const src = article.dataset.src;
    const res = await fetch(src);
    if (!res.ok) throw new Error(`${src}: HTTP ${res.status}`);
    const code = await res.text();
    article.querySelector('.code').textContent = code;
    const expose = article.dataset.expose;
    const tail = expose ? `\nreturn { ${expose} };` : '';
    const panel = article.querySelector('.out');
    return new Function('console', code + tail)(pageConsole(panel));
  }

  window.addEventListener('DOMContentLoaded', async () => {
    for (const article of document.querySelectorAll('.program')) {
      try {
        const api = await load(article);
        if (api && api.addBook) wireLibrary(api);
      } catch (err) {
        article.querySelector('.out').textContent = 'Could not run: ' + err.message +
          '\n(serve this folder over HTTP — fetch() is blocked on file://)';
      }
    }
    document.body.dataset.ready = 'true';
  });

  function wireLibrary({ library, addBook, findBook }) {
    const out = document.getElementById('pbl-out');
    const rows = document.getElementById('library-rows');
    const log = pageConsole(out).log;

    function render() {
      rows.replaceChildren();
      if (!library.length) {
        rows.innerHTML = '<tr><td colspan="3"><small>library is empty</small></td></tr>';
        return;
      }
      for (const book of library) {
        const tr = document.createElement('tr');
        for (const v of [book.id, book.title, book.author]) {
          const td = document.createElement('td');
          td.textContent = v;
          tr.appendChild(td);
        }
        rows.appendChild(tr);
      }
    }

    function add(title, author) {
      const book = addBook(title, author);
      log(`addBook(${quote(title)}, ${quote(author)}) →`,
        book === null ? 'null (blank or duplicate title)' : book);
      render();
    }

    document.getElementById('add-form').addEventListener('submit', e => {
      e.preventDefault();
      add(document.getElementById('book-title').value, document.getElementById('book-author').value);
      e.target.reset();
      document.getElementById('book-title').focus();
    });
    document.getElementById('find-form').addEventListener('submit', e => {
      e.preventDefault();
      const t = document.getElementById('find-title').value;
      log(`findBook(${quote(t)}) →`, findBook(t));
    });
    document.getElementById('seed').addEventListener('click', () => {
      add('Clean Code', 'Robert C. Martin');
      add("You Don't Know JS", 'Kyle Simpson');
      add('Eloquent JavaScript', 'Marijn Haverbeke');
    });
  }
})();
