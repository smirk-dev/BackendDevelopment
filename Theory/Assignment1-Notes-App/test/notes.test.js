const cdp = require('./cdp');
const fs = require('fs'), path = require('path');
const URL = 'http://127.0.0.1:3049/';
const OUT = process.argv[2];               // screenshots dir
const TMP = process.argv[3];               // scratch dir for downloads / import file
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra && !ok ? '  ' + extra : '')); };

(async () => {
  const p = await cdp.open(null, { width: 900, height: 900 });
  const box = async sel => p.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  const click = async sel => { const b = await box(sel); if (!b) throw new Error('no element ' + sel);
    for (const type of ['mousePressed', 'mouseReleased']) await p.send('Input.dispatchMouseEvent', { type, x: b.x, y: b.y, button: 'left', clickCount: 1 });
    await p.sleep(80); };
  const type = async (sel, text) => { await click(sel); await p.send('Input.insertText', { text }); await p.sleep(40); };
  const key = async (k, code, mods = 0) => { for (const t of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type: t, key: k, code, windowsVirtualKeyCode: code === 'Enter' ? 13 : 27, modifiers: mods }); await p.sleep(80); };
  const stored = () => p.eval(`JSON.parse(localStorage.getItem('notes')||'[]')`);
  const texts = () => p.eval(`[...document.querySelectorAll('#notesList li.note .text')].map(e=>e.textContent)`);
  const clearSearch = () => p.eval(`(()=>{const i=document.getElementById('searchInput'); i.value=''; i.dispatchEvent(new Event('input'));})()`);

  await p.goto(URL);
  for (let i = 0; i < 50 && (await p.eval(`location.origin`)) !== 'http://127.0.0.1:3049'; i++) await p.sleep(100);
  await p.eval(`localStorage.clear()`); await p.reload();
  check('empty state on first load', (await p.eval(`document.getElementById('emptyState').textContent`)) === 'No notes yet. Write one above.');

  // ADD (typing + clicking the button, and Ctrl+Enter)
  await type('#noteInput', 'Read L07 notes on the storage event'); await type('#tagInput', 'study, backend'); await click('#addBtn');
  await type('#noteInput', 'Submit Assignment 2 on JSONB'); await type('#tagInput', 'assignment, #Backend'); await click('#addBtn');
  await type('#noteInput', 'Buy printer paper'); await key('Enter', 'Enter', 2 /* ctrl */);
  await type('#noteInput', 'Line one' + String.fromCharCode(10) + 'line two of a multi-line note'); await type('#tagInput', 'misc'); await click('#addBtn');
  let s = await stored();
  check('add: 4 notes stored (button x3, Ctrl+Enter x1)', s.length === 4, JSON.stringify(s.map(n => n.text)));
  check('add: fields id/text/completed/tags/createdAt/updatedAt', s.every(n => typeof n.id === 'number' && typeof n.text === 'string' && n.completed === false && Array.isArray(n.tags) && !isNaN(Date.parse(n.createdAt)) && n.updatedAt === null));
  check('add: ids unique', new Set(s.map(n => n.id)).size === 4);
  check('add: tags normalised (lower-case, # stripped)', JSON.stringify(s.find(n => n.text.startsWith('Submit')).tags) === '["assignment","backend"]');
  check('add: newest first in the list', (await texts())[0].startsWith('Line one'));
  await click('#addBtn');
  check('add: empty input ignored', (await stored()).length === 4);

  // XSS: markup typed into a note is shown as text, never run
  await type('#noteInput', '<img src=x onerror="window.__xss=1"> <b>not bold</b>'); await click('#addBtn');
  await p.sleep(200);
  check('escape: no script ran, markup shown literally', await p.eval(`window.__xss === undefined && !document.querySelector('#notesList img, #notesList b') && document.querySelector('#notesList li.note .text').textContent.startsWith('<img')`));

  // EDIT inline (click Edit, change text and tags, Save)
  const editId = s.find(n => n.text === 'Buy printer paper').id;
  await click(`li[data-id="${editId}"] .edit`);
  check('edit: form opens with current text', (await p.eval(`document.querySelector('.edit-text').value`)) === 'Buy printer paper');
  await p.eval(`document.querySelector('.edit-text').select()`);
  await p.send('Input.insertText', { text: 'Buy A4 printer paper (2 reams)' });
  await p.eval(`document.querySelector('.edit-tags').select()`); await p.send('Input.insertText', { text: 'errand' });
  await p.shot(path.join(OUT, 'notes-editing.png'), false);
  await click('.edit-form .save');
  let e = (await stored()).find(n => n.id === editId);
  check('edit: text and tags saved', e.text === 'Buy A4 printer paper (2 reams)' && JSON.stringify(e.tags) === '["errand"]');
  check('edit: updatedAt set, createdAt kept', e.updatedAt !== null && Date.parse(e.updatedAt) >= Date.parse(e.createdAt) && e.createdAt === s.find(n => n.id === editId).createdAt);
  check('edit: card shows "edited"', (await p.eval(`document.querySelector('li[data-id="${editId}"] .meta').textContent`)).includes('edited'));
  await click(`li[data-id="${editId}"] .edit`); await p.send('Input.insertText', { text: ' CHANGED' }); await key('Escape', 'Escape');
  check('edit: Escape cancels without saving', (await stored()).find(n => n.id === editId).text === 'Buy A4 printer paper (2 reams)' && !(await p.eval(`!!document.querySelector('.edit-form')`)));

  // DELETE (the XSS test note)
  const xssId = (await stored()).find(n => n.text.startsWith('<img')).id;
  await click(`li[data-id="${xssId}"] .del`);
  check('delete: removed from storage and DOM', (await stored()).length === 4 && !(await p.eval(`!!document.querySelector('li[data-id="${xssId}"]')`)));

  // COMPLETE toggle + Done/Open filter
  const doneId = (await stored()).find(n => n.text.startsWith('Read L07')).id;
  await click(`li[data-id="${doneId}"] .done`);
  check('complete: stored completed=true, card struck through', (await stored()).find(n => n.id === doneId).completed === true && (await p.eval(`document.querySelector('li[data-id="${doneId}"]').classList.contains('completed')`)));
  await click('.seg button[data-show="done"]');
  check('filter Done: only the completed note', JSON.stringify(await texts()) === JSON.stringify(['Read L07 notes on the storage event']));
  await click('.seg button[data-show="open"]');
  check('filter Open: the other three', (await texts()).length === 3);
  await click('.seg button[data-show="all"]');

  // SEARCH (text and tag text), then tag chip filter
  await type('#searchInput', 'assignment');
  check('search "assignment": one match', JSON.stringify(await texts()) === JSON.stringify(['Submit Assignment 2 on JSONB']));
  await clearSearch();
  await type('#searchInput', 'PAPER');
  const t1 = await texts();
  check('search is case-insensitive ("PAPER")', t1.length === 1 && t1[0].includes('paper'));
  await clearSearch();
  await click('#tagBar button[data-tag="backend"]');
  check('tag chip #backend: two notes', (await texts()).length === 2, JSON.stringify(await texts()));
  check('summary shows the filter count', (await p.eval(`document.getElementById('summary').textContent`)) === '4 notes, 1 done · showing 2');
  await p.shot(path.join(OUT, 'notes-tag-filter.png'));
  await click('#tagBar button[data-tag="backend"]');

  // REORDER with Up/Down buttons, then drag and drop
  const before = (await stored()).map(n => n.id);
  await click(`li[data-id="${before[3]}"] .up`);
  const after = (await stored()).map(n => n.id);
  check('reorder: Up moves the last note one place up', after[2] === before[3] && after[3] === before[2]);
  await click(`li[data-id="${before[3]}"] .down`);
  check('reorder: Down puts it back', JSON.stringify((await stored()).map(n => n.id)) === JSON.stringify(before));
  await p.eval(`(()=>{const src=document.querySelector('li[data-id="${before[0]}"]'), dst=document.querySelector('li[data-id="${before[2]}"]');
    const dt=new DataTransfer(); const r=dst.getBoundingClientRect(); const y=r.bottom-4;
    src.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));
    dst.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt,clientY:y}));
    dst.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt,clientY:y}));
    src.dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer:dt}));})()`);
  await p.sleep(100);
  check('reorder: drag first card onto the lower half of the third', JSON.stringify((await stored()).map(n => n.id)) === JSON.stringify([before[1], before[2], before[0], before[3]]));

  // PERSISTENCE across reload
  const snapshot = JSON.stringify(await stored());
  await p.reload();
  check('reload: same notes, same order', JSON.stringify(await stored()) === snapshot && (await texts()).length === 4);
  check('reload: completed state kept', await p.eval(`document.querySelector('li[data-id="${doneId}"] .done').checked`));

  // THEME toggle saved
  await click('#themeToggle');
  check('theme: dark applied and saved', (await p.eval(`document.documentElement.dataset.theme + '/' + localStorage.getItem('notes-theme')`)) === 'dark/dark');
  await p.reload();
  check('theme: still dark after reload', (await p.eval(`document.documentElement.dataset.theme`)) === 'dark' && (await p.eval(`getComputedStyle(document.body).backgroundColor`)) === 'rgb(27, 26, 23)');
  await p.shot(path.join(OUT, 'notes-dark.png'));

  // NEW TAB, then the storage event pushes a change from tab 2 into tab 1 without a reload
  const p2 = await cdp.open(URL, { width: 900, height: 700 });
  check('new tab: sees the same 4 notes', (await p2.eval(`document.querySelectorAll('#notesList li.note').length`)) === 4);
  await p2.eval(`(()=>{document.getElementById('noteInput').value='Added from the second tab'; document.getElementById('addForm').requestSubmit();})()`);
  await p.sleep(400);
  check('storage event: tab 1 shows the tab-2 note without reloading', (await texts())[0] === 'Added from the second tab');
  await p2.close();

  // EXPORT
  const dl = path.join(TMP, 'dl');
  fs.rmSync(dl, { recursive: true, force: true }); fs.mkdirSync(dl, { recursive: true });
  await p.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dl });
  await click('#exportBtn'); await p.sleep(1000);
  const files = fs.readdirSync(dl);
  const exported = files.length ? JSON.parse(fs.readFileSync(path.join(dl, files[0]), 'utf8')) : null;
  check('export: notes-YYYY-MM-DD.json equals localStorage', !!exported && /^notes-\d{4}-\d{2}-\d{2}\.json$/.test(files[0]) && JSON.stringify(exported) === JSON.stringify(await stored()), files.join(','));
  console.log('     exported file: ' + files[0] + ', ' + (exported ? exported.length : 0) + ' notes');

  // IMPORT
  await p.eval(`localStorage.removeItem('notes')`); await p.reload();
  check('import: starting from 0 notes', (await stored()).length === 0);
  const { root } = await p.send('DOM.getDocument');
  const { nodeId } = await p.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#importFile' });
  await p.send('DOM.setFileInputFiles', { nodeId, files: [path.join(dl, files[0])] });
  await p.sleep(400);
  const st1 = await p.eval(`document.getElementById('ioStatus').textContent`);
  check('import: every exported note restored', JSON.stringify(await stored()) === JSON.stringify(exported) && st1 === `Imported: ${exported.length} added, 0 replaced.`, st1);
  fs.writeFileSync(path.join(TMP, 'extra.json'), JSON.stringify([{ text: 'Imported without id or dates', tags: ['Imported'] }, { text: '' }, { nope: 1 }, { id: exported[0].id, text: 'Replaced by import', createdAt: exported[0].createdAt }]));
  await p.send('DOM.setFileInputFiles', { nodeId, files: [path.join(TMP, 'extra.json')] });
  await p.sleep(400);
  const st2 = await p.eval(`document.getElementById('ioStatus').textContent`);
  check('import: validates entries (1 added, 1 replaced, 2 skipped)', st2 === 'Imported: 1 added, 1 replaced, 2 skipped.', st2);
  fs.writeFileSync(path.join(TMP, 'bad.json'), '{"not": "a list"}');
  await p.send('DOM.setFileInputFiles', { nodeId, files: [path.join(TMP, 'bad.json')] });
  await p.sleep(400);
  const st3 = await p.eval(`document.getElementById('ioStatus').textContent`);
  check('import: rejects a file that is not a list', st3 === 'Import failed: expected a JSON array of notes', st3);

  // CORRUPT storage value
  const good = await p.eval(`localStorage.getItem('notes')`);
  await p.eval(`localStorage.setItem('notes','{oops')`); await p.reload();
  check('corrupt value: page still renders, raw value backed up', await p.eval(`document.getElementById('emptyState').hidden === false && localStorage.getItem('notes-corrupt-backup') === '{oops'`));
  await p.eval(`localStorage.setItem('notes', ${JSON.stringify(good)}); localStorage.removeItem('notes-corrupt-backup'); localStorage.setItem('notes-theme','light')`);
  await p.reload();

  // screenshots in light mode
  await p.shot(path.join(OUT, 'notes-light.png'));
  await type('#searchInput', 'jsonb'); await p.shot(path.join(OUT, 'notes-search.png'), false);
  const m = await cdp.open(URL, { width: 390, height: 844 });
  await m.shot(path.join(OUT, 'notes-mobile.png'));
  check('mobile 390px: no horizontal scroll', await m.eval(`document.documentElement.scrollWidth <= 390`));
  await m.close();

  const errs = p.consoleMsgs.filter(x => /^(error|EXCEPTION)/.test(x));
  check('no console errors (the corrupt-value warning is expected)', errs.length === 0, JSON.stringify(p.consoleMsgs));
  console.log('     console: ' + JSON.stringify(p.consoleMsgs));
  console.log(`\n${pass} passed, ${fail} failed`);
  await p.eval(`localStorage.clear()`);
  await p.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
