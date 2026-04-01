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

    const items = Array.isArray(data) ? data.map((item) => ({
      ...item,
      sessionId: item.session_id || '',
      resultKey: item.result_key || '',
      resultTitle: item.result_title || '',
      oneLine: item.one_line || '',
      createdAt: item.created_at || '',
      receivedAt: item.received_at || '',
    })) : [];

    return sendJson(res, 200, items);
  } catch (err) {
    return sendJson(res, 500, { ok: false, message: err.message || 'Unexpected error' });
  }
};
