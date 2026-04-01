const { parseCookies, signPayload, verifySignedPayload } = require('./http');

const COOKIE_NAME = 'etutude_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 8;

function getEnv(name) {
  return process.env[name] || '';
}

function buildSessionCookie(username) {
  const secret = getEnv('ADMIN_SESSION_SECRET');
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is missing');
  const token = signPayload({ username, exp: Date.now() + MAX_AGE_SECONDS * 1000 }, secret);
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

function buildLogoutCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const payload = verifySignedPayload(token, getEnv('ADMIN_SESSION_SECRET'));
  if (!payload) return null;
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

function hasValidAdminCredentials(username, password) {
  return username === getEnv('ADMIN_USERNAME') && password === getEnv('ADMIN_PASSWORD');
}

module.exports = {
  buildSessionCookie,
  buildLogoutCookie,
  getSession,
  hasValidAdminCredentials,
};
