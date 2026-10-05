'use strict';

// Local development preview, not a hosted intake replacement. Only the write-only
// request contract is reachable over HTTP; operators use editorial.js separately.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { openStore } = require('./editorial');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mov': 'video/quicktime', '.mp4': 'video/mp4' };

function createPreview({ root = ROOT, privateDir }) {
  const store = openStore(privateDir, root);
  return http.createServer(async (req, res) => {
    const origin = `http://127.0.0.1:${serverPort(res)}`;
    const reply = (status, body, type = 'application/json') => {
      res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(typeof body === 'string' ? body : JSON.stringify(body));
    };
    if (req.headers.host !== `127.0.0.1:${serverPort(res)}`) return reply(403, { error: 'local_host_required' });
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, origin).pathname); }
    catch { return reply(400, { error: 'invalid_path' }); }
    if (pathname === '/__lumeya/intake') {
      if (req.method !== 'POST') return reply(405, { error: 'write_only' });
      if (req.headers.origin !== origin || req.headers['x-lumeya-local'] !== '1' || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return reply(403, { error: 'same_origin_required' });
      try {
        let body = '';
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 20000) return reply(413, { error: 'request_too_large' });
        }
        const receipt = store.receive(JSON.parse(body));
        return reply(200, { data: receipt });
      } catch (error) {
        if (error.message === 'idempotency_key_conflict') return reply(409, { error: 'idempotency_key_conflict' });
        return reply(400, { error: 'request_not_saved_check_fields_and_retry' });
      }
    }
    if (!['GET', 'HEAD'].includes(req.method)) return reply(405, { error: 'read_only_preview' });
    if (pathname === '/__lumeya/config.js') {
      return reply(200, `window.LumeyaLocalIntake = Object.freeze({ mode: 'local-preview', submit: async function(payload) {
      var response = await fetch('/__lumeya/intake', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lumeya-Local': '1' }, body: JSON.stringify(payload) });
      var result = await response.json();
      if (!response.ok || result.error) {
        var code = result.error === 'idempotency_key_conflict' ? result.error : 'local_receipt_failed';
        var error = new Error(code); error.code = code === 'idempotency_key_conflict' ? 'P0001' : undefined; throw error;
      }
        return result;
      }});`, TYPES['.js']);
    }
    if (pathname === '/') pathname = '/index.html';
    const relative = pathname.replace(/^\//, '');
    const extension = path.extname(relative).toLowerCase();
    const directory = relative.split('/')[0];
    if (!TYPES[extension] || relative.split('/').some(part => !part || part.startsWith('.')) ||
        (relative.includes('/') && !['assets', 'images', 'fonts', 'man_videos', 'woman_videos'].includes(directory))) return reply(404, { error: 'not_found' });
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile() || fs.realpathSync(file) !== file) return reply(404, { error: 'not_found' });
    if (extension === '.html') {
      const html = fs.readFileSync(file, 'utf8').replace('<head>', '<head><script src="/__lumeya/config.js"></script>');
      return reply(200, html, TYPES[extension]);
    }
    res.writeHead(200, { 'Content-Type': TYPES[extension], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}
function serverPort(res) { return res.socket.localPort; }

if (require.main === module) {
  const port = Number(process.env.PORT || 4173);
  try {
    const server = createPreview({ privateDir: process.env.LUMEYA_EDITORIAL_DIR });
    server.on('error', () => { console.error('editorial-preview: could not bind loopback port'); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Lumeya local editorial preview: http://127.0.0.1:${port} (private local receipts; no hosted delivery)`));
  } catch { console.error('editorial-preview: set LUMEYA_EDITORIAL_DIR to a private directory outside the repository (mode 700)'); process.exitCode = 1; }
}
module.exports = { createPreview };
