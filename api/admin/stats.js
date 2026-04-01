const { sendJson } = require('../../lib/http');
const { getSession } = require('../../lib/admin-auth');
const { getSupabaseAdmin } = require('../../lib/supabase');

function isDaily(item) {
  const key = String(item.result_key || '').toLowerCase();
  return key.startsWith('daily-');
}

function dailyTeamLabel(item) {
  const key = String(item.result_key || '').toLowerCase();
  if (key === 'daily-warm') return 'team 다굽자';
  if (key === 'daily-cool') return 'team 다얼자';
  return item.result_title || item.result_key || '-';
}

function weeklyTypeLabel(item) {
  return String(item.result_title || item.result_key || '-');
}

function buildTopLabel(counter) {
  let topLabel = '-';
  let topCount = 0;
  for (const [label, count] of counter.entries()) {
    if (count > topCount) {
      topLabel = `${label} (${count})`;
      topCount = count;
    }
  }
  return topLabel;
}

function buildStats(items) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyCounter = new Map();
  const weeklyCounter = new Map();
  let today = 0;

  for (const item of items) {
    const dateKey = String(item.created_at || item.received_at || '').slice(0, 10);
    if (dateKey === todayKey) today += 1;

    if (isDaily(item)) {
      const label = dailyTeamLabel(item);
      dailyCounter.set(label, (dailyCounter.get(label) || 0) + 1);
    } else {
      const label = weeklyTypeLabel(item);
      weeklyCounter.set(label, (weeklyCounter.get(label) || 0) + 1);
    }
  }

  return {
    total: items.length,
    today,
    topDailyTeam: buildTopLabel(dailyCounter),
    topWeeklyType: buildTopLabel(weeklyCounter),
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
