const crypto = require('crypto');
const { readJson, sendJson } = require('../lib/http');
const { getSupabaseAdmin } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const body = await readJson(req);
    const item = {
      id: crypto.randomUUID(),
      nickname: body.nickname || '',
      session_id: body.sessionId || '',
      result_key: body.resultKey || body.key || '',
      result_title: body.resultTitle || '',
      one_line: body.oneLine || '',
      pcts: body.pcts || {},
      scores: body.scores || {},
      answers: Array.isArray(body.answers) ? body.answers : [],
      lang: body.lang || 'ko',
      created_at: body.createdAt || new Date().toISOString(),
      received_at: new Date().toISOString(),
      source: body.source || 'pixel-prototype',
    };

    if (!item.result_key) {
      return sendJson(res, 400, { ok: false, message: 'resultKey is required' });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('test_results').insert(item);
    if (error) {
      return sendJson(res, 500, { ok: false, message: error.message });
    }

    return sendJson(res, 200, { ok: true, id: item.id });
  } catch (err) {
    return sendJson(res, 500, { ok: false, message: err.message || 'Unexpected error' });
  }
};
