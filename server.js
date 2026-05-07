const http   = require('http');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');
const crypto = require('crypto');

const PORT    = 3000;
const SYMBOLS = ['KSE100', 'OGDC', 'PPL', 'ENGRO', 'HBL', 'HUBC', 'SYS', 'MEBL', 'LUCK'];

const DATA_DIR  = path.join(__dirname, 'data');
const USERS_DB  = path.join(DATA_DIR, 'users.json');
const SECRET_FN = path.join(DATA_DIR, '.jwt-secret');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_DB)) fs.writeFileSync(USERS_DB, '{}');

// Persistent JWT secret — generated once on first run
let JWT_SECRET;
if (fs.existsSync(SECRET_FN)) {
  JWT_SECRET = fs.readFileSync(SECRET_FN, 'utf8').trim();
} else {
  JWT_SECRET = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(SECRET_FN, JWT_SECRET, { mode: 0o600 });
}

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
  '.php':  null,
};

/* ────────────────────── PSX TICKER ────────────────────── */

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
  sendJson(res, 200, body);
}

/* ────────────────────── AUTH HELPERS ────────────────────── */

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_DB, 'utf8')); }
  catch { return {}; }
}
function writeUsers(obj) {
  // Atomic write
  const tmp = USERS_DB + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, USERS_DB);
}

// PBKDF2 password hashing
function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.pbkdf2Sync(password, s, 100000, 32, 'sha256').toString('hex');
  return { salt: s, hash: h };
}
function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  // Constant-time comparison
  const a = Buffer.from(hash, 'hex'), b = Buffer.from(expectedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Minimal HMAC-signed token: base64url(payload).base64url(sig)
function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}
function signToken(payload, ttlSeconds = 60 * 60 * 24 * 30) {
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const enc  = b64url(JSON.stringify(body));
  const sig  = b64url(crypto.createHmac('sha256', JWT_SECRET).update(enc).digest());
  return enc + '.' + sig;
}
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [enc, sig] = parts;
  const expected = b64url(crypto.createHmac('sha256', JWT_SECRET).update(enc).digest());
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const body = JSON.parse(b64urlDecode(enc));
    if (body.exp && Math.floor(Date.now() / 1000) > body.exp) return null;
    return body;
  } catch { return null; }
}

/* ────────────────────── REQUEST HELPERS ────────────────────── */

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
function sendJson(res, code, bodyOrObj) {
  const body = typeof bodyOrObj === 'string' ? bodyOrObj : JSON.stringify(bodyOrObj);
  res.writeHead(code, { 'Content-Type': 'application/json', ...corsHeaders() });
  res.end(body);
}
function readBody(req, max = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => {
      data += c;
      if (data.length > max) { req.destroy(); reject(new Error('payload-too-large')); }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(new Error('invalid-json')); }
    });
    req.on('error', reject);
  });
}
function getBearer(req) {
  const h = req.headers['authorization'] || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

/* ────────────────────── AUTH ROUTES ────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handleSignup(req, res) {
  let body;
  try { body = await readBody(req); }
  catch (e) { return sendJson(res, 400, { error: e.message }); }

  const name  = (body.name  || '').toString().trim();
  const email = (body.email || '').toString().trim().toLowerCase();
  const phone = (body.phone || '').toString().trim();
  const pw    = (body.password || '').toString();

  if (name.length < 2)         return sendJson(res, 400, { error: 'Enter your full name.' });
  if (!EMAIL_RE.test(email))   return sendJson(res, 400, { error: 'Invalid email.' });
  if (phone && !/^[\d\s+()-]{7,}$/.test(phone))
                                return sendJson(res, 400, { error: 'Invalid phone.' });
  if (pw.length < 8)           return sendJson(res, 400, { error: 'Password must be 8+ characters.' });

  const users = readUsers();
  if (users[email]) return sendJson(res, 409, { error: 'Account already exists with this email.' });

  const { salt, hash } = hashPassword(pw);
  users[email] = { name, email, phone, salt, hash, createdAt: Date.now() };
  writeUsers(users);

  const token = signToken({ sub: email, name });
  sendJson(res, 201, { token, user: { name, email, phone } });
}

async function handleSignin(req, res) {
  let body;
  try { body = await readBody(req); }
  catch (e) { return sendJson(res, 400, { error: e.message }); }

  const email = (body.email || '').toString().trim().toLowerCase();
  const pw    = (body.password || '').toString();
  if (!email || !pw) return sendJson(res, 400, { error: 'Email and password required.' });

  const users = readUsers();
  const user = users[email];
  if (!user) return sendJson(res, 401, { error: 'Invalid email or password.' });
  if (!verifyPassword(pw, user.salt, user.hash))
    return sendJson(res, 401, { error: 'Invalid email or password.' });

  const token = signToken({ sub: email, name: user.name });
  sendJson(res, 200, { token, user: { name: user.name, email: user.email, phone: user.phone } });
}

function handleMe(req, res) {
  const token = getBearer(req);
  const claims = verifyToken(token);
  if (!claims) return sendJson(res, 401, { error: 'Invalid or expired token.' });
  const users = readUsers();
  const user = users[claims.sub];
  if (!user) return sendJson(res, 404, { error: 'User no longer exists.' });
  sendJson(res, 200, { user: { name: user.name, email: user.email, phone: user.phone } });
}

/* ────────────────────── STATIC + ROUTER ────────────────────── */

function staticHandler(req, res) {
  const parsed   = url.parse(req.url).pathname;
  const filePath = path.join(__dirname, parsed === '/' ? 'index.html' : parsed);
  // Block traversal outside project root
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); return res.end('Forbidden'); }
  // Block access to data dir
  if (filePath.startsWith(DATA_DIR))   { res.writeHead(403); return res.end('Forbidden'); }
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext];
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

const server = http.createServer(async (req, res) => {
  const pathname = url.parse(req.url).pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  // API routes
  if (pathname === '/api/ticker')      return tickerHandler(res);
  if (pathname === '/api/auth/signup' && req.method === 'POST') return handleSignup(req, res);
  if (pathname === '/api/auth/signin' && req.method === 'POST') return handleSignin(req, res);
  if (pathname === '/api/auth/me'     && req.method === 'GET')  return handleMe(req, res);

  // Static
  staticHandler(req, res);
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
