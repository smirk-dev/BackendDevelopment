// Minimal CDP driver (Node 22, no deps). Chrome must be running with --remote-debugging-port=9340.
// Usage as a library: const cdp = require('./cdp'); const page = await cdp.open(url); await page.shot(file) ...
const PORT = process.env.CDP_PORT || 9340;

async function open(url, { width = 1200, height = 800 } = {}) {
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); const listeners = []; const consoleMsgs = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
    else if (m.method) {
      if (m.method === 'Runtime.consoleAPICalled') consoleMsgs.push(m.params.type + ': ' + m.params.args.map(a => a.value ?? a.description).join(' '));
      if (m.method === 'Runtime.exceptionThrown') consoleMsgs.push('EXCEPTION: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
      listeners.forEach(l => l(m));
    }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const waitEvent = (name, ms = 15000) => new Promise((res, rej) => { const to = setTimeout(() => rej(new Error('timeout ' + name)), ms); listeners.push(m => { if (m.method === name) { clearTimeout(to); res(m.params); } }); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const page = {
    send, consoleMsgs, on: fn => listeners.push(fn),
    async goto(u) { const w = waitEvent('Page.loadEventFired'); await send('Page.navigate', { url: u }); await w; await page.sleep(300); },
    async reload() { const w = waitEvent('Page.loadEventFired'); await send('Page.reload', {}); await w; await page.sleep(300); },
    async eval(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; },
    async shot(file, full = true) { const fs = require('fs'); const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); },
    sleep: ms => new Promise(r => setTimeout(r, ms)),
    async close() { try { await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`); } catch {} ws.close(); },
  };
  if (url) await page.goto(url);
  return page;
}
module.exports = { open };

// CLI: node cdp.js <url> <out.png> [width] [height]
if (require.main === module) {
  (async () => {
    const [url, out, w, h] = process.argv.slice(2);
    const p = await open(url, { width: +w || 1200, height: +h || 800 });
    await p.shot(out); console.log('saved', out, p.consoleMsgs.length ? p.consoleMsgs : ''); await p.close();
  })().catch(e => { console.error(e); process.exit(1); });
}
