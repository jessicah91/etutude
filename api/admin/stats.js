const { sendJson } = require('../../lib/http');
const { getSession } = require('../../lib/admin-auth');
const { getSupabaseAdmin } = require('../../lib/supabase');

function buildStats(items) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const typeCount = new Map();
  const nicknames = new Set();
  let today = 0;

  for (const item of items) {
    const key = String(item.result_title || item.result_key || '-');
    typeCount.set(key, (typeCount.get(key) || 0) + 1);
    if ((item.nickname || '').trim()) nicknames.add(item.nickname.trim());
    const dateKey = String(item.created_at || item.received_at || '').slice(0, 10);
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
      .select('nickname,result_key,result_title,created_at,received_at')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      return sendJson(res, 500, { ok: false, message: error.message });
    }

    return sendJson(res, 200, buildStats(Array.isArray(data) ? data : []));
  } catch (err) {
    return sendJson(res, 500, { ok: false, message: err.message || 'Unexpected error' });
  }
};
