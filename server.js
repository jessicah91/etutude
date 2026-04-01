
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 4875);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const CONFIG_PATH = path.join(ROOT, 'config.json');
const RESULTS_PATH = path.join(DATA_DIR, 'results.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RESULTS_PATH)) fs.writeFileSync(RESULTS_PATH, '[]', 'utf8');
if (!fs.existsSync(CONFIG_PATH)) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({
    adminUsername: 'admin',
    adminPassword: 'etutude0401!'
  }, null, 2), 'utf8');
}

const sessions = new Map();

function readConfig() {
  const fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  return {
    adminUsername: process.env.ADMIN_USERNAME || fileConfig.adminUsername,
    adminPassword: process.env.ADMIN_PASSWORD || fileConfig.adminPassword,
  };
}

function readResults() {
  try {
    const raw = fs.readFileSync(RESULTS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function writeResults(items) {
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(items, null, 2), 'utf8');
}

function sendJson(res, status, data, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  res.end(JSON.stringify(data));
}

function sendText(res, status, data, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  res.writeHead(status, { 'Content-Type': contentType, ...extraHeaders });
  res.end(data);
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  return cookieHeader.split(';').reduce((acc, item) => {
    const idx = item.indexOf('=');
    if (idx > -1) {
      const key = item.slice(0, idx).trim();
      const value = decodeURIComponent(item.slice(idx + 1).trim());
      acc[key] = value;
    }
    return acc;
  }, {});
}

function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies.etutude_admin_session;
  if (!token) return null;
  return sessions.get(token) || null;
}

function createSession(username) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { username, createdAt: Date.now() });
  return token;
}

function clearSession(req) {
  const cookies = parseCookies(req);
  const token = cookies.etutude_admin_session;
  if (token) sessions.delete(token);
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
  }[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath)) {
    sendText(res, 404, 'Not found');
    return;
  }
  sendText(res, 200, fs.readFileSync(filePath), contentType(filePath));
}

function requireAdmin(req, res) {
  const session = getSession(req);
  if (!session) {
    sendJson(res, 401, { ok: false, message: 'Unauthorized' });
    return null;
  }
  return session;
}

function buildStats(items) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const typeCount = new Map();
  const nicknames = new Set();
  let today = 0;
  for (const item of items) {
    const key = String(item.resultTitle || item.resultKey || '-');
    typeCount.set(key, (typeCount.get(key) || 0) + 1);
    if ((item.nickname || '').trim()) nicknames.add(item.nickname.trim());
    const dateKey = String(item.createdAt || item.receivedAt || '').slice(0, 10);
    if (dateKey === todayKey) today += 1;
  }
  let topType = '-';
  let topCount = 0;
  for (const [key, count] of typeCount.entries()) {
    if (count > topCount) {
      topType = `${key} (${count})`;
      topCount = count;
    }
  }
  return {
    total: items.length,
    today,
    topType,
    nicknameCount: nicknames.size,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/') {
    return serveFile(res, path.join(PUBLIC_DIR, 'index.html'));
  }

  if (req.method === 'GET' && pathname === '/admin-login') {
    return serveFile(res, path.join(PUBLIC_DIR, 'admin-login.html'));
  }

  if (req.method === 'GET' && pathname === '/admin') {
    const session = getSession(req);
    if (!session) {
      res.writeHead(302, { Location: '/admin-login' });
      return res.end();
    }
    return serveFile(res, path.join(PUBLIC_DIR, 'admin.html'));
  }

  if (req.method === 'GET' && pathname === '/api/admin/me') {
    const session = getSession(req);
    return sendJson(res, 200, {
      authenticated: !!session,
      username: session ? session.username : null,
    });
  }

  if (req.method === 'POST' && pathname === '/api/admin/login') {
    try {
      const body = await collectBody(req);
      const config = readConfig();
      if (body.username === config.adminUsername && body.password === config.adminPassword) {
        const token = createSession(body.username);
        return sendJson(res, 200, { ok: true }, {
          'Set-Cookie': `etutude_admin_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800`,
        });
      }
      return sendJson(res, 401, { ok: false, message: 'Invalid credentials' });
    } catch (err) {
      return sendJson(res, 400, { ok: false, message: 'Bad request' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/admin/logout') {
    clearSession(req);
    return sendJson(res, 200, { ok: true }, {
      'Set-Cookie': 'etutude_admin_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
    });
  }

  if (req.method === 'POST' && pathname === '/api/results') {
    try {
      const body = await collectBody(req);
      const items = readResults();
      const item = {
        id: crypto.randomUUID(),
        nickname: body.nickname || '',
        sessionId: body.sessionId || '',
        resultKey: body.resultKey || body.key || '',
        resultTitle: body.resultTitle || '',
        oneLine: body.oneLine || '',
        pcts: body.pcts || {},
        scores: body.scores || {},
        answers: Array.isArray(body.answers) ? body.answers : [],
        lang: body.lang || 'ko',
        createdAt: body.createdAt || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        source: body.source || 'unknown'
      };
      items.unshift(item);
      writeResults(items.slice(0, 5000));
      return sendJson(res, 200, { ok: true, id: item.id });
    } catch (err) {
      return sendJson(res, 400, { ok: false, message: 'Bad request' });
    }
  }

  if (req.method === 'GET' && pathname === '/api/admin/results') {
    if (!requireAdmin(req, res)) return;
    return sendJson(res, 200, readResults());
  }

  if (req.method === 'GET' && pathname === '/api/admin/stats') {
    if (!requireAdmin(req, res)) return;
    return sendJson(res, 200, buildStats(readResults()));
  }

  // static public files
  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (safePath.startsWith(PUBLIC_DIR) && fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    return serveFile(res, safePath);
  }

  sendText(res, 404, 'Not found');
});

server.listen(PORT, () => {
  console.log(`ETU-TUDE server running at http://127.0.0.1:${PORT}`);
  console.log(`Admin login: http://127.0.0.1:${PORT}/admin-login`);
  console.log(`Results path: ${RESULTS_PATH}`);
});
