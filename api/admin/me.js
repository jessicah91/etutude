const { sendJson } = require('../../lib/http');
const { getSession } = require('../../lib/admin-auth');

module.exports = async (req, res) => {
  const session = getSession(req);
  return sendJson(res, 200, {
    authenticated: !!session,
    username: session ? session.username : null,
  });
};
