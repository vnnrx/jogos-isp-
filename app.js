/* Playbook ISP — JSON-driven (no dependencies) */
const state = {
  data: null,
  filtered: [],
  selected: null,
};

const el = (id) => document.getElementById(id);

function chip(label){
  const s = document.createElement('span');
  s.className = 'chip';
  s.textContent = label;
  return s;
}

function renderISP(profile){
  const root = el('ispProfile');
  root.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'grid';

  const addKV = (k, v, mono=false) => {
    const div = document.createElement('div');
    div.className = 'kv';
    div.innerHTML = `<b>${k}:</b> ${mono ? `<span class="mono">${v}</span>` : v}`;
    grid.appendChild(div);
  };

  addKV('ISP', profile.name || '—');
  addKV('Core/DC', profile.core_dc || '—');
  addKV('PTTs', (profile.ptts || []).join(' • ') || '—');
  addKV('DNS', (profile.dns && profile.dns[0]) ? profile.dns[0] : '—', true);
  addKV('DNS', (profile.dns && profile.dns[1]) ? profile.dns[1] : '—', true);
  addKV('Borda', profile.edge_ip || '—', true);

  root.appendChild(grid);
}

function normalizeText(s){
  return (s || "")
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function matchQuery(game, q){
  const query = normalizeText(q).trim();
  if(!query) return true;

  const hay = normalizeText([
    game.id,
    game.name, game.publisher, game.category,
    ...(game.aliases || []),
    ...(game.top_complaints || []),
    ...(game.checks || []),
    ...(game.actions || []),
  ].join(' '));

  // Todos os tokens devem bater (sensação de filtro real)
  const tokens = query.split(/\s+/).filter(Boolean);
  return tokens.every(t => hay.includes(t));
}

function matchSymptom(game, symptom){
  if(!symptom) return true;
  return (game.symptoms_to_verify || []).includes(symptom);
}

function applyFilters(){
  const q = el('q').value.trim();
  const symptom = el('symptom').value;
  state.filtered = (state.data?.games || [])
    .filter(g => matchQuery(g, q))
    .filter(g => matchSymptom(g, symptom));
  renderList();
  el('count').textContent = `${state.filtered.length} jogo(s)`;
}

function renderList(){
  const list = el('list');
  list.innerHTML = '';
  for(const g of state.filtered){
    const card = document.createElement('div');
    card.className = 'item';
    card.tabIndex = 0;
    card.role = 'button';
    card.addEventListener('click', () => selectGame(g.id));
    card.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') selectGame(g.id);
    });

    const head = document.createElement('div');
    head.className = 'item-head';

    const ic = document.createElement('img');
    ic.className = 'item-icon';
    ic.alt = g.name + ' ícone';
    ic.loading = 'lazy';
    ic.src = g.icon || 'assets/valenet.svg';

    const h = document.createElement('h3');
    h.textContent = g.name;

    head.appendChild(ic);
    head.appendChild(h);

    const p = document.createElement('p');
    const complaints = (g.top_complaints || []).slice(0,3).join(' • ') || '—';
    p.textContent = complaints;

    const chips = document.createElement('div');
    chips.className = 'chips';
    chips.appendChild(chip(g.category || '—'));
    if(g.publisher) chips.appendChild(chip(g.publisher));
    if((g.symptoms_to_verify || []).includes('nat')) chips.appendChild(chip('NAT'));
    if((g.symptoms_to_verify || []).includes('packet_loss')) chips.appendChild(chip('Loss'));

    card.appendChild(head);
    card.appendChild(p);
    card.appendChild(chips);
    list.appendChild(card);
  }
}

function selectGame(gameId){
  const g = (state.data.games || []).find(x => x.id === gameId);
  state.selected = g || null;
  renderSelected();
}

function renderSelected(){
  const box = el('selected');
  if(!state.selected){
    box.className = 'selected empty';
    box.innerHTML = '<p>Selecione um jogo na lista para ver detalhes.</p>';
    return;
  }
  const g = state.selected;
  box.className = 'selected';
  const refs = (g.references || []).map(r => `<li><a href="${r.url}" target="_blank" rel="noreferrer">${r.label}</a></li>`).join('');

  box.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;">
      <img src="${g.icon || 'assets/valenet.svg'}" alt="${g.name} ícone" style="width:34px;height:34px;border-radius:12px;border:1px solid rgba(255,255,255,.18);" />
      <h3 style="margin:0;">${g.name}</h3>
    </div>
    <p class="sub">${[g.category, g.publisher].filter(Boolean).join(' • ')}</p>

    <h4>Reclamações mais comuns</h4>
    <ul>${(g.top_complaints || []).map(x => `<li>${x}</li>`).join('')}</ul>

    <h4>Verificações (N2)</h4>
    <ul>${(g.checks || []).map(x => `<li>${x}</li>`).join('')}</ul>

    <h4>Tratativas recomendadas</h4>
    <ul>${(g.actions || []).map(x => `<li>${x}</li>`).join('')}</ul>

    <h4>Escalonar para CGR quando</h4>
    <ul>${(g.escalate_to_cgr_when || []).map(x => `<li>${x}</li>`).join('')}</ul>

    ${refs ? `<h4>Referências</h4><ul>${refs}</ul>` : ''}
  `;
}

function buildTicketSummary(){
  const m = state.data?.meta;
  const isp = m?.isp_profile;
  const g = state.selected;

  const lines = [];
  lines.push(`[PLAYBOOK] Falhas em Jogos Online — ${m?.title || 'ISP'}`);
  lines.push(`Versão: ${m?.version || '—'} | Atualizado: ${m?.updated_at || '—'}`);
  if(isp){
    lines.push(`ISP: ${isp.name || '—'} | Core: ${isp.core_dc || '—'} | PTTs: ${(isp.ptts||[]).join(', ') || '—'}`);
    lines.push(`DNS: ${(isp.dns||[]).join(' | ') || '—'} | Borda: ${isp.edge_ip || '—'}`);
  }
  lines.push('---');
  lines.push('Jogo:');
  lines.push(g ? `- ${g.name}` : '- (não selecionado)');
  lines.push('Cidade/POP:');
  lines.push('- (preencher)');
  lines.push('Data/Hora (início/fim):');
  lines.push('- (preencher)');
  lines.push('Conexão:');
  lines.push('- Cabeado / Wi‑Fi (2.4/5GHz) (preencher)');
  lines.push('Sintoma:');
  lines.push('- Ping alto / Loss / Jitter / Queda / NAT (preencher)');
  lines.push('Evidências anexas:');
  lines.push('- ping (50 pacotes)');
  lines.push('- tracert');
  lines.push('- pathping');
  if(g){
    lines.push('---');
    lines.push('Verificações (N2) sugeridas:');
    for(const c of (g.checks || [])) lines.push(`- ${c}`);
    lines.push('Tratativas sugeridas:');
    for(const a of (g.actions || [])) lines.push(`- ${a}`);
    lines.push('Escalonar para CGR se:');
    for(const e of (g.escalate_to_cgr_when || [])) lines.push(`- ${e}`);
  }
  return lines.join('\n');
}

async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch(_){
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

async function init(){
  const res = await fetch('games.json', { cache: 'no-store' });
  state.data = await res.json();

  // meta
  el('versionPill').textContent = `Versão: ${state.data.meta?.version || '—'}`;
  el('updatedAt').textContent = `Atualizado em ${state.data.meta?.updated_at || '—'}`;

  // isp profile
  renderISP(state.data.meta?.isp_profile || {});

  // initial list
  state.filtered = state.data.games || [];
  el('count').textContent = `${state.filtered.length} jogo(s)`;
  renderList();
  renderSelected();

  // listeners
  el('q').addEventListener('input', applyFilters);
  el('symptom').addEventListener('change', applyFilters);

  el('copySummary').addEventListener('click', async () => {
    const text = buildTicketSummary();
    const ok = await copyToClipboard(text);
    el('copySummary').textContent = ok ? '✅ Copiado!' : '⚠️ Falhou (copie manualmente)';
    setTimeout(() => (el('copySummary').textContent = '📋 Copiar resumo (ticket)'), 1300);
  });
}

init();
