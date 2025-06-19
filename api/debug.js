export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    method: req.method,
    headers: req.headers,
    bodyKeys: Object.keys(req.body || {}),
    bodyPreview: req.body ? JSON.stringify(req.body).substring(0, 500) : null,
    contentType: req.headers['content-type'],
    bodySize: JSON.stringify(req.body || {}).length
  });
}