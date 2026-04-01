const { sendJson } = require('../../lib/http');
const { getSession } = require('../../lib/admin-auth');
const { getSupabaseAdmin } = require('../../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, message: 'Method not allowed' });
  }

  const session = getSession(req);
  if (!session) {
    return sendJson(res, 401, { ok: false, message: 'Unauthorized' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return sendJson(res, 500, { ok: false, message: error.message });
    }

    return sendJson(res, 200, Array.isArray(data) ? data : []);
  } catch (err) {
    return sendJson(res, 500, { ok: false, message: err.message || 'Unexpected error' });
  }
};
