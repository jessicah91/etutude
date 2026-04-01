const { readJson, sendJson } = require('../../lib/http');
const { buildSessionCookie, hasValidAdminCredentials } = require('../../lib/admin-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const body = await readJson(req);
    if (!hasValidAdminCredentials(body.username, body.password)) {
      return sendJson(res, 401, { ok: false, message: 'Invalid credentials' });
    }

    const cookie = buildSessionCookie(body.username);
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': cookie });
  } catch (err) {
    return sendJson(res, 500, { ok: false, message: err.message || 'Unexpected error' });
  }
};
