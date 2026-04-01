const { sendJson } = require('../../lib/http');
const { buildLogoutCookie } = require('../../lib/admin-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, message: 'Method not allowed' });
  }
  return sendJson(res, 200, { ok: true }, { 'Set-Cookie': buildLogoutCookie() });
};
