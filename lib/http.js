const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signPayload(payload, secret) {
  const encoded = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${encoded}.${signature}`;
}

function verifySignedPayload(token, secret) {
  if (!token || !secret || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (signature !== expected) return null;
  try {
    const json = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((acc, item) => {
    const index = item.indexOf('=');
    if (index > -1) {
      const key = item.slice(0, index).trim();
      const value = decodeURIComponent(item.slice(index + 1).trim());
      acc[key] = value;
    }
    return acc;
  }, {});
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
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

function sendJson(res, status, data, extraHeaders = {}) {
  res.statusCode = status;
  Object.entries({ 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders }).forEach(([k, v]) => {
    res.setHeader(k, v);
  });
  res.end(JSON.stringify(data));
}

module.exports = {
  signPayload,
  verifySignedPayload,
  parseCookies,
  readJson,
  sendJson,
};
