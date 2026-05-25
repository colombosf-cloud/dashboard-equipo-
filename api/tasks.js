const WORKSPACE_IDS = {
  EBDS:    '90132956682',
  Sibila:  '90132956656',
  ZoWeAre: '90132956693',
  BHU:     '90132956644',
  Tivenos: '90131113078'
};

const STATUS_MAP = {
  'planeado':'PLANEANDO','planeando':'PLANEANDO','backlog':'PLANEANDO',
  'redaccion':'REDACCIÓN','redacción':'REDACCIÓN',
  'diseño':'DISEÑO','diseno':'DISEÑO',
  'validar':'VALIDAR','validacion':'VALIDAR',
  'rechazado':'RECHAZADO',
  'espera externa':'ESPERA EXT.','espera externo':'ESPERA EXT.',
  'hecho':'HECHO','done':'HECHO'
};

function normStatus(s) {
  return STATUS_MAP[(s || '').toLowerCase()] || 'PLANEANDO';
}

async function fetchWorkspace(brand, wsId, token) {
  // Primer y último día del mes actual en millisegundos
  const now = new Date();
  const mesStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const mesEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

  const url = `https://api.clickup.com/api/v2/team/${wsId}/task?order_by=updated&reverse=true&subtasks=true&include_closed=true&date_updated_gt=${mesStart}&date_updated_lt=${mesEnd}&page=0`;
  
  const res = await fetch(url, {
    headers: { Authorization: token }
  });
  if (!res.ok) throw new Error(`ClickUp error ${res.status} para ${brand}`);
  const data = await res.json();
  return (data.tasks || [])
    .filter(t => !t.name.startsWith('🤖'))
    .map(t => ({
      id: t.id,
      name: t.name,
      brand,
      status: t.status?.status || 'backlog',
      statusUI: normStatus(t.status?.status || 'backlog'),
      list: t.list?.name || '',
      assignees: (t.assignees || []).map(a => String(a.id)),
      due: t.due_date ? parseInt(t.due_date) : null,
      priority: t.priority?.priority || null,
      parent: t.parent || null,
      url: t.url
    }));
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate'); // cache 2 min

  const token = process.env.CLICKUP_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'CLICKUP_TOKEN no configurado en Vercel' });
  }

  try {
    const results = await Promise.all(
      Object.entries(WORKSPACE_IDS).map(([brand, wsId]) =>
        fetchWorkspace(brand, wsId, token)
      )
    );
    const tasks = results.flat();
    res.status(200).json({
      tasks,
      fetchedAt: new Date().toISOString(),
      total: tasks.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
