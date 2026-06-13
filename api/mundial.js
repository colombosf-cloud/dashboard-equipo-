const MASTER_KEY = '$2a$10$DlvfLgypON0S8yXHDwQoJumgPx5UJaffjyS7lo.FRw.fKXV9XMLXW';
const BIN_NAME = 'mundial2026-prode-sofia';
const BASE = 'https://api.jsonbin.io/v3';

// Cached across warm serverless invocations
let cachedBinId = null;

async function jbFetch(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': MASTER_KEY,
      ...(opts.headers || {}),
    },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => String(r.status));
    throw new Error(`JSONBin ${r.status}: ${text}`);
  }
  return r.json();
}

async function ensureBinId() {
  if (cachedBinId) return cachedBinId;

  // Try to find the existing bin by listing all bins
  try {
    const list = await jbFetch('/b');
    const bins = Array.isArray(list) ? list : (list.bins || []);
    const found = bins.find(b => {
      const name = b.metadata?.name || b.name || b.record?.name;
      return name === BIN_NAME;
    });
    if (found) {
      cachedBinId = found.metadata?.id || found.id || found.record?.id;
      return cachedBinId;
    }
  } catch (_) {
    // listing failed, will create a new bin
  }

  // Create the bin on first ever use
  const data = await jbFetch('/b', {
    method: 'POST',
    headers: { 'X-Bin-Name': BIN_NAME, 'X-Private': 'true' },
    body: JSON.stringify({ scores: {}, lastSaved: '', version: 1 }),
  });
  cachedBinId = data.metadata.id;
  return cachedBinId;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const binId = await ensureBinId();
      const data = await jbFetch(`/b/${binId}/latest`);
      return res.status(200).json(data.record);
    }

    if (req.method === 'PUT') {
      const binId = await ensureBinId();
      await jbFetch(`/b/${binId}`, {
        method: 'PUT',
        body: JSON.stringify(req.body),
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
