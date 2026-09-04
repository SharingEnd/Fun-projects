#!/usr/bin/env node
'use strict';

/*
 * blow-up — the server half.
 *
 * A browser cannot delete a file off your disk, and that is a good thing.
 * So this ~100 line static server sits behind the page and does the one
 * unsafe thing the page asks for: POST /__detonate unlinks index.html.
 *
 *   node serve.js              serve http://localhost:8080 (armed)
 *   node serve.js --resurrect  put index.html back and exit
 *   PORT=3000 node serve.js    pick a port
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT     = __dirname;
const TARGET   = path.join(ROOT, 'index.html');
const BACKUP   = path.join(ROOT, '.backup', 'index.html');
const PORT     = Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.md':   'text/plain; charset=utf-8'
};

function backup() {
  if (!fs.existsSync(TARGET)) return;
  fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
  fs.copyFileSync(TARGET, BACKUP);
}

function resurrect() {
  if (!fs.existsSync(BACKUP)) {
    console.error('No backup at .backup/index.html — try: git restore blow-up/index.html');
    process.exit(1);
  }
  fs.copyFileSync(BACKUP, TARGET);
  console.log('index.html is back. Reload the page and the button is armed again.');
}

const TOMBSTONE = `<!doctype html><meta charset="utf-8">
<title>410 Gone</title>
<style>
  body{margin:0;height:100vh;display:grid;place-items:center;background:#0a0a0c;color:#8b8b93;
       font:14px/1.7 ui-monospace,Menlo,Consolas,monospace;text-align:center}
  b{display:block;font-size:56px;margin-bottom:14px}
  code{color:#9b9ba3;background:#15151a;border:1px solid #22222a;border-radius:5px;padding:2px 6px}
  span{color:#e1121b}
</style>
<div>
  <b>🕳️</b>
  <span>410 Gone</span>
  <p>index.html deleted itself. Nothing here serves it now.</p>
  <p><code>node serve.js --resurrect</code></p>
</div>`;

if (process.argv.includes('--resurrect')) {
  resurrect();
  process.exit(0);
}

backup();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // ---- the one dangerous route -------------------------------------------
  if (url.pathname === '/__detonate') {
    if (req.method !== 'POST') {
      res.writeHead(405, { allow: 'POST' }).end();
      return;
    }
    fs.unlink(TARGET, (err) => {
      const gone = !err || err.code === 'ENOENT';
      if (gone) console.log('💥 deleted ' + path.relative(process.cwd(), TARGET));
      else console.error('failed to delete: ' + err.message);
      res.writeHead(gone ? 200 : 500, { 'content-type': TYPES['.json'] });
      res.end(JSON.stringify({ deleted: gone, error: err && err.code !== 'ENOENT' ? err.code : null }));
    });
    return;
  }

  // ---- boring static file serving ----------------------------------------
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';

  const file = path.join(ROOT, path.normalize(rel));
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) {
    res.writeHead(403).end('Nope.');
    return;
  }

  fs.readFile(file, (err, body) => {
    if (err) {
      const missingIndex = path.basename(file) === 'index.html';
      res.writeHead(missingIndex ? 410 : 404, { 'content-type': TYPES['.html'] });
      res.end(missingIndex ? TOMBSTONE : '404');
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(body);
  });
});

server.listen(PORT, () => {
  console.log('blow-up armed at http://localhost:' + PORT);
  console.log('one button. it deletes index.html for real. (backup kept in .backup/)');
});
