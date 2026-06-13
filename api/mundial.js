const BASE = 'https://api.jsonbin.io/v3';

async function jbFetch(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': process.env.JSONBIN_MASTER_KEY,
      ...(opts.headers || {}),
    },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => String(r.status));
    throw new Error(`JSONBin ${r.status}: ${text}`);
  }
  return r.json();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const masterKey = process.env.JSONBIN_MASTER_KEY;
  if (!masterKey) {
    return res.status(503).json({ error: 'JSONBIN_MASTER_KEY no configurado en Vercel' });
  }

  const binId = process.env.JSONBIN_BIN_ID;

  try {
    if (req.method === 'GET') {
      if (!binId) {
        const data = await jbFetch('/b', {
          method: 'POST',
          headers: { 'X-Bin-Name': 'mundial2026-prode', 'X-Private': 'true' },
          body: JSON.stringify({ scores: {}, lastSaved: '', version: 1 }),
        });
        const newId = data.metadata.id;
        return res.status(200).json({
          scores: {},
          lastSaved: '',
          _setup: `Bin creado. Agrega JSONBIN_BIN_ID=${newId} en Variables de Entorno de Vercel y redeploya.`,
        });
      }
      const data = await jbFetch(`/b/${binId}/latest`);
      return res.status(200).json(data.record);
    }

    if (req.method === 'PUT') {
      if (!binId) {
        return res.status(503).json({ error: 'JSONBIN_BIN_ID no configurado — leé el status bar.' });
      }
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
