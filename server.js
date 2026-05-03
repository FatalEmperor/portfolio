const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT    = 3000;
const SYMBOLS = ['KSE100', 'OGDC', 'PPL', 'ENGRO', 'HBL', 'HUBC', 'SYS', 'MEBL', 'LUCK'];

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.php':  null, // block PHP execution (no PHP runtime here)
};

function fetchPsx(symbol) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'dps.psx.com.pk',
      path: `/timeseries/int/${symbol}`,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0' },
      timeout: 10000,
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          const data = json.data;
          if (!data || data.length < 2) return resolve(null);
          const latest = data[0][1];
          const open   = data[data.length - 1][1];
          const pct    = open !== 0 ? ((latest - open) / open) * 100 : 0;
          const price  = latest > 1000
            ? latest.toLocaleString('en-US', { maximumFractionDigits: 0 })
            : latest.toFixed(2);
          const sign = pct >= 0 ? '+' : '';
          resolve([price, sign + pct.toFixed(2) + '%']);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function tickerHandler(res) {
  const settled = await Promise.allSettled(SYMBOLS.map(sym => fetchPsx(sym)));
  const result  = {};
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) result[SYMBOLS[i]] = r.value;
  });

  if (Object.keys(result).length === 0) {
    result['KSE100'] = ['162,994', '+0.00%'];
    result['OGDC']   = ['299.63',  '+0.00%'];
    result['PPL']    = ['218.70',  '+0.00%'];
  }

  const body = JSON.stringify({ source: 'psx-node-proxy', data: result });
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function staticHandler(req, res) {
  const parsed   = url.parse(req.url).pathname;
  const filePath = path.join(__dirname, parsed === '/' ? 'index.html' : parsed);
  const ext      = path.extname(filePath).toLowerCase();
  const mime     = MIME[ext];

  if (mime === null) { res.writeHead(403); return res.end('Forbidden'); }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(500); return res.end('Server error');
    }
    res.writeHead(200, { 'Content-Type': mime || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;
  if (pathname === '/api/ticker') return tickerHandler(res);
  staticHandler(req, res);
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
