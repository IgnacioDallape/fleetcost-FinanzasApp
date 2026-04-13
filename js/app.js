const TODAY = '2026-04-13';
const fmt = v => '$\u00a0' + Math.round(v).toLocaleString('es-AR');
const fmtDate = d => { if(!d) return ''; const p = d.split('-'); return p[2]+'/'+p[1]+'/'+p[0].slice(2); };
const diffDays = d => Math.ceil((new Date(d) - new Date(TODAY)) / 86400000);

function defaultData() {
  return {
    disponible: 3800000,
    cobros: [
      {id:1,nombre:'25 de Mayo 16-2',monto:350000,fecha:'2026-03-29',cobrado:false,notas:''},
      {id:2,nombre:'SAMA',monto:437360,fecha:'2026-03-31',cobrado:false,notas:''},
      {id:3,nombre:'Chia Orrego',monto:420000,fecha:'2026-04-05',cobrado:false,notas:''},
      {id:4,nombre:'MAREF',monto:1210000,fecha:'2026-04-09',cobrado:false,notas:''},
      {id:5,nombre:'MYA',monto:2757815,fecha:'2026-04-10',cobrado:false,notas:''},
      {id:6,nombre:'San Máximo',monto:3666542,fecha:'2026-04-11',cobrado:false,notas:''},
      {id:7,nombre:'Chia Orrego',monto:250000,fecha:'2026-04-13',cobrado:false,notas:''},
      {id:8,nombre:'San Máximo',monto:3683710,fecha:'2026-04-13',cobrado:false,notas:''}
    ],
    pagos: [
      {id:1,nombre:'Anticipo ganancias',monto:1120000,fecha:'2026-04-10',pagado:false,cat:'Impuesto/AFIP',notas:'Lo antes posible'},
      {id:2,nombre:'Alq Vivian',monto:900000,fecha:'2026-04-10',pagado:false,cat:'Alquiler',notas:'Plazo máx 10'},
      {id:3,nombre:'Tarjeta',monto:2500000,fecha:'2026-04-10',pagado:false,cat:'Tarjeta',notas:'Plazo máx 10'},
      {id:4,nombre:'Mentoría',monto:1704000,fecha:'2026-04-10',pagado:false,cat:'Otro',notas:'Plazo máx 10'},
      {id:5,nombre:'Planes AFIP',monto:936832,fecha:'2026-04-09',pagado:false,cat:'Impuesto/AFIP',notas:''},
      {id:6,nombre:'Cheques San Juan y Solis',monto:600000,fecha:'2026-04-10',pagado:false,cat:'Proveedor',notas:'359390+359407'},
      {id:7,nombre:'Alquiler Ramiro',monto:990000,fecha:'2026-04-15',pagado:false,cat:'Alquiler',notas:'Plazo máx 15'}
    ]
  };
}

let data = (() => { try { const d = localStorage.getItem('flujo_v1'); return d ? JSON.parse(d) : defaultData(); } catch(e) { return defaultData(); } })();
function save() { localStorage.setItem('flujo_v1', JSON.stringify(data)); updateTopbar(); }

function updateTopbar() {
  document.getElementById('top-saldo').textContent = fmt(data.disponible);
  const fs = document.getElementById('flota-saldo');
  if(fs) fs.textContent = fmt(data.disponible);
}

let chartFlujo = null, chartCats = null;
function navigate(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  el.classList.add('active');
  if(page === 'dashboard') renderDashboard();
  if(page === 'cobros') renderCobros();
  if(page === 'pagos') renderPagos();
  if(page === 'flujo') renderFlujo();
  if(page === 'flota') { fcInitFlota(); updateTopbar(); }
  if(page === 'ia') initIA();
  if(page === 'config') { document.getElementById('conf-saldo').value = data.disponible; }
}

function toggleForm(id) {
  const el = document.getElementById(id);
  el.classList.toggle('open');
}

function calcFlujo() {
  const events = [{fecha: TODAY, concepto: 'Saldo inicial', tipo: 'inicio', monto: data.disponible}];
  data.cobros.filter(c => !c.cobrado).forEach(c => events.push({fecha:c.fecha, concepto:c.nombre, tipo:'cobro', monto:c.monto}));
  data.pagos.filter(p => !p.pagado).forEach(p => events.push({fecha:p.fecha, concepto:p.nombre, tipo:'pago', monto:-p.monto}));
  events.sort((a,b) => a.fecha.localeCompare(b.fecha));
  let saldo = 0;
  return events.map(e => { saldo += e.monto; return {...e, saldo}; });
}

function renderDashboard() {
  const now = new Date();
  document.getElementById('dash-date').textContent = now.toLocaleDateString('es-AR', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  const flujo = calcFlujo();
  const totalCobros = data.cobros.filter(c=>!c.cobrado).reduce((a,c)=>a+c.monto,0);
  const totalPagos = data.pagos.filter(p=>!p.pagado).reduce((a,p)=>a+p.monto,0);
  const saldoFinal = flujo.length ? flujo[flujo.length-1].saldo : data.disponible;
  const minSaldo = Math.min(...flujo.map(f=>f.saldo));
  document.getElementById('dash-metrics').innerHTML = `
    <div class="metric-card green"><div class="metric-label">Disponible hoy</div><div class="metric-value green">${fmt(data.disponible)}</div><div class="metric-sub">en banco + efectivo</div></div>
    <div class="metric-card blue"><div class="metric-label">Cobros pendientes</div><div class="metric-value blue">${fmt(totalCobros)}</div><div class="metric-sub">${data.cobros.filter(c=>!c.cobrado).length} cobros</div></div>
    <div class="metric-card red"><div class="metric-label">Pagos pendientes</div><div class="metric-value red">${fmt(totalPagos)}</div><div class="metric-sub">${data.pagos.filter(p=>!p.pagado).length} obligaciones</div></div>
    <div class="metric-card ${saldoFinal>=0?'green':'red'}"><div class="metric-label">Saldo proyectado</div><div class="metric-value ${saldoFinal>=0?'green':'red'}">${fmt(saldoFinal)}</div><div class="metric-sub">mínimo ${fmt(minSaldo)}</div></div>
  `;
  let alerts = '';
  const vencidos = data.pagos.filter(p=>!p.pagado && p.fecha <= TODAY);
  if(vencidos.length) alerts += `<div class="alert danger"><span class="alert-icon">⚠</span> ${vencidos.length} pago(s) vencido(s): ${vencidos.map(v=>v.nombre).join(', ')} — total ${fmt(vencidos.reduce((a,p)=>a+p.monto,0))}</div>`;
  if(minSaldo < 0) alerts += `<div class="alert danger"><span class="alert-icon">⚠</span> Saldo negativo proyectado. Mínimo: ${fmt(minSaldo)}.</div>`;
  const proximos7 = data.pagos.filter(p=>!p.pagado && p.fecha > TODAY && diffDays(p.fecha) <= 7);
  if(proximos7.length) alerts += `<div class="alert warning"><span class="alert-icon">◎</span> ${proximos7.length} pago(s) en los próximos 7 días por ${fmt(proximos7.reduce((a,p)=>a+p.monto,0))}</div>`;
  if(!alerts) alerts = `<div class="alert success"><span class="alert-icon">✓</span> Sin alertas críticas.</div>`;
  document.getElementById('dash-alerts').innerHTML = alerts;
  if(chartFlujo) { chartFlujo.destroy(); chartFlujo = null; }
  const labels = flujo.map(f => fmtDate(f.fecha));
  const saldos = flujo.map(f => f.saldo);
  chartFlujo = new Chart(document.getElementById('chart-flujo'), {
    type:'bar', data:{labels, datasets:[{label:'Saldo',data:saldos,backgroundColor:saldos.map(s=>s>=0?'rgba(26,107,58,0.75)':'rgba(192,57,43,0.75)'),borderRadius:4,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>fmt(ctx.raw)},backgroundColor:'#ffffff',titleColor:'#5a5650',bodyColor:'#1a1814',borderColor:'rgba(0,0,0,0.1)',borderWidth:1}},
    scales:{x:{ticks:{color:'#9a9690',font:{size:10,family:'DM Mono'},autoSkip:false,maxRotation:45},grid:{color:'rgba(0,0,0,0.04)'},border:{color:'rgba(0,0,0,0.07)'}},y:{ticks:{color:'#9a9690',font:{size:10,family:'DM Mono'},callback:v=>'$'+(v/1000000).toFixed(1)+'M'},grid:{color:'rgba(0,0,0,0.04)'},border:{color:'rgba(0,0,0,0.07)'}}}}
  });
  if(chartCats) { chartCats.destroy(); chartCats = null; }
  const catMap = {};
  data.pagos.filter(p=>!p.pagado).forEach(p => { catMap[p.cat] = (catMap[p.cat]||0) + p.monto; });
  const catLabels = Object.keys(catMap);
  const catColors = ['rgba(26,107,58,0.8)','rgba(26,95,168,0.8)','rgba(192,57,43,0.8)','rgba(183,96,10,0.8)','rgba(120,70,180,0.8)','rgba(20,140,100,0.8)','rgba(160,80,40,0.8)'];
  chartCats = new Chart(document.getElementById('chart-cats'), {
    type:'doughnut', data:{labels:catLabels,datasets:[{data:catLabels.map(k=>catMap[k]),backgroundColor:catColors.slice(0,catLabels.length),borderWidth:2,borderColor:'#ffffff',hoverOffset:4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'right',labels:{color:'#5a5650',font:{size:11,family:'DM Sans'},boxWidth:10,padding:10}},tooltip:{callbacks:{label:ctx=>ctx.label+': '+fmt(ctx.raw)},backgroundColor:'#ffffff',titleColor:'#5a5650',bodyColor:'#1a1814',borderColor:'rgba(0,0,0,0.1)',borderWidth:1}},cutout:'65%'}
  });
  const ups = data.pagos.filter(p=>!p.pagado).sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(0,6);
  document.getElementById('dash-upcoming').innerHTML = ups.length ? ups.map(p => {
    const d = diffDays(p.fecha);
    const badge = d < 0 ? `<span class="badge badge-red">Vencido</span>` : d === 0 ? `<span class="badge badge-red">Hoy</span>` : d <= 3 ? `<span class="badge badge-amber">${d}d</span>` : `<span class="badge badge-gray">${d}d</span>`;
    return `<tr><td>${p.nombre}<br><span style="color:var(--text3);font-size:11px">${p.cat}</span></td><td>${fmtDate(p.fecha)}</td><td class="mono">${fmt(p.monto)}</td><td>${badge}</td></tr>`;
  }).join('') : `<tr><td colspan="4" class="empty"><div class="empty-icon">✓</div>Sin pagos pendientes</td></tr>`;
  updateNavBadge();
}

function updateNavBadge() {
  const urgentes = data.pagos.filter(p=>!p.pagado && diffDays(p.fecha) <= 3).length;
  const nav = document.getElementById('nav-pagos');
  const existing = nav.querySelector('.nav-badge');
  if(existing) existing.remove();
  if(urgentes > 0) nav.innerHTML += `<span class="nav-badge">${urgentes}</span>`;
}

function renderCobros() {
  const sorted = [...data.cobros].sort((a,b)=>a.fecha.localeCompare(b.fecha));
  document.getElementById('cobros-tbody').innerHTML = sorted.length ? sorted.map(c => `
    <tr class="${c.cobrado?'paid':''}">
      <td>${c.nombre}${c.notas?`<br><span style="color:var(--text3);font-size:11px">${c.notas}</span>`:''}</td>
      <td>${fmtDate(c.fecha)}</td><td class="mono">${fmt(c.monto)}</td>
      <td>${c.cobrado ? '<span class="badge badge-green">Cobrado</span>' : '<span class="badge badge-blue">Pendiente</span>'}</td>
      <td><div style="display:flex;gap:6px"><button class="btn btn-sm ${c.cobrado?'':'btn-success'}" onclick="toggleCobro(${c.id})">${c.cobrado?'Deshacer':'✓ Cobrado'}</button><button class="btn btn-sm btn-icon btn-danger" onclick="delCobro(${c.id})">✕</button></div></td>
    </tr>`).join('') : `<tr><td colspan="5" class="empty"><div class="empty-icon">↓</div>No hay cobros cargados</td></tr>`;
}

function addCobro() {
  const n = document.getElementById('c-nombre').value.trim();
  const m = parseFloat(document.getElementById('c-monto').value);
  const f = document.getElementById('c-fecha').value;
  if(!n||!m||!f) return alert('Completá nombre, monto y fecha');
  data.cobros.push({id:Date.now(), nombre:n, monto:m, fecha:f, cobrado:false, notas:document.getElementById('c-notas').value});
  save(); renderCobros(); toggleForm('form-cobro');
  ['c-nombre','c-monto','c-fecha','c-notas'].forEach(id => document.getElementById(id).value='');
}

function toggleCobro(id) {
  const c = data.cobros.find(x=>x.id===id); if(!c) return;
  c.cobrado = !c.cobrado; data.disponible += c.cobrado ? c.monto : -c.monto;
  save(); renderCobros();
}

function delCobro(id) {
  if(!confirm('¿Eliminar este cobro?')) return;
  data.cobros = data.cobros.filter(x=>x.id!==id); save(); renderCobros();
}

function renderPagos() {
  const sorted = [...data.pagos].sort((a,b)=>a.fecha.localeCompare(b.fecha));
  document.getElementById('pagos-tbody').innerHTML = sorted.length ? sorted.map(p => {
    const d = diffDays(p.fecha);
    const badge = p.pagado ? '<span class="badge badge-green">Pagado</span>' : d < 0 ? '<span class="badge badge-red">Vencido</span>' : d <= 3 ? `<span class="badge badge-amber">${d}d</span>` : `<span class="badge badge-gray">${d}d</span>`;
    return `<tr class="${p.pagado?'paid':''}">
      <td>${p.nombre}${p.notas?`<br><span style="color:var(--text3);font-size:11px">${p.notas}</span>`:''}</td>
      <td><span class="badge badge-gray" style="font-size:10px">${p.cat}</span></td>
      <td>${fmtDate(p.fecha)}</td><td class="mono">${fmt(p.monto)}</td><td>${badge}</td>
      <td><div style="display:flex;gap:6px"><button class="btn btn-sm ${p.pagado?'':'btn-success'}" onclick="togglePago(${p.id})">${p.pagado?'Deshacer':'✓ Pagado'}</button><button class="btn btn-sm btn-icon btn-danger" onclick="delPago(${p.id})">✕</button></div></td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" class="empty"><div class="empty-icon">↑</div>No hay pagos cargados</td></tr>`;
}

function addPago() {
  const n = document.getElementById('p-nombre').value.trim();
  const m = parseFloat(document.getElementById('p-monto').value);
  const f = document.getElementById('p-fecha').value;
  if(!n||!m||!f) return alert('Completá nombre, monto y fecha');
  data.pagos.push({id:Date.now(), nombre:n, monto:m, fecha:f, pagado:false, cat:document.getElementById('p-cat').value, notas:document.getElementById('p-notas').value});
  save(); renderPagos(); toggleForm('form-pago');
  ['p-nombre','p-monto','p-fecha','p-notas'].forEach(id => document.getElementById(id).value='');
}

function togglePago(id) {
  const p = data.pagos.find(x=>x.id===id); if(!p) return;
  p.pagado = !p.pagado; data.disponible += p.pagado ? -p.monto : p.monto;
  save(); renderPagos();
}

function delPago(id) {
  if(!confirm('¿Eliminar este pago?')) return;
  data.pagos = data.pagos.filter(x=>x.id!==id); save(); renderPagos();
}

function renderFlujo() {
  const flujo = calcFlujo();
  const totalIn = data.disponible + data.cobros.filter(c=>!c.cobrado).reduce((a,c)=>a+c.monto,0);
  const totalOut = data.pagos.filter(p=>!p.pagado).reduce((a,p)=>a+p.monto,0);
  const saldoFinal = flujo.length ? flujo[flujo.length-1].saldo : data.disponible;
  document.getElementById('flujo-metrics').innerHTML = `
    <div class="metric-card green"><div class="metric-label">Total ingresos</div><div class="metric-value green">${fmt(totalIn)}</div></div>
    <div class="metric-card red"><div class="metric-label">Total egresos</div><div class="metric-value red">${fmt(totalOut)}</div></div>
    <div class="metric-card ${saldoFinal>=0?'green':'red'}"><div class="metric-label">Resultado neto</div><div class="metric-value ${saldoFinal>=0?'green':'red'}">${fmt(saldoFinal)}</div></div>
  `;
  document.getElementById('flujo-tbody').innerHTML = flujo.map(f => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:12px;color:var(--text3)">${fmtDate(f.fecha)}</td>
      <td>${f.concepto}</td>
      <td>${f.tipo==='cobro'?'<span class="badge badge-green">Cobro</span>':f.tipo==='pago'?'<span class="badge badge-red">Pago</span>':'<span class="badge badge-blue">Inicial</span>'}</td>
      <td class="${f.monto>=0?'flujo-pos':'flujo-neg'}">${f.monto>0?'+':''}${fmt(f.monto)}</td>
      <td class="${f.saldo>=0?'flujo-saldo-pos':'flujo-saldo-neg'}">${fmt(f.saldo)}</td>
    </tr>`).join('');
}

let aiHistory = [];
let iaInited = false;
function initIA() {
  if(iaInited) return; iaInited = true;
  const flujo = calcFlujo();
  const minSaldo = Math.min(...flujo.map(f=>f.saldo));
  const totalPagos = data.pagos.filter(p=>!p.pagado).reduce((a,p)=>a+p.monto,0);
  addBotMsg(`Hola Ignacio. Tenés <strong style="color:var(--accent)">${fmt(data.disponible)}</strong> disponibles hoy y <strong style="color:var(--red)">${fmt(totalPagos)}</strong> en pagos pendientes. El saldo proyectado mínimo es <strong style="color:${minSaldo<0?'var(--red)':'var(--accent)}'}">${fmt(minSaldo)}</strong>. ¿En qué te ayudo?`);
}
function addBotMsg(text) { aiHistory.push({role:'assistant', text}); renderMsgs(); }
function renderMsgs() {
  document.getElementById('ai-messages').innerHTML = aiHistory.map(m=>`<div class="ai-msg ${m.role==='assistant'?'bot':'user'}">${m.text}</div>`).join('');
  const el = document.getElementById('ai-messages'); el.scrollTop = el.scrollHeight;
}
async function askQuick(q) { document.getElementById('ai-input').value = q; await sendAI(); }
async function sendAI() {
  const input = document.getElementById('ai-input');
  const q = input.value.trim(); if(!q) return;
  input.value = ''; aiHistory.push({role:'user', text: q}); renderMsgs();
  addBotMsg('<em style="color:var(--text3)">Analizando tu situación...</em>');
  const flujo = calcFlujo();
  const systemPrompt = `Sos un asesor financiero de confianza para Ignacio, empresario de Mendoza, Argentina. Hablale de vos a vos, en español rioplatense. Sé directo, concreto y útil. No uses listas largas, respondé en 2-4 oraciones máximo salvo que te pidan un análisis detallado.\n\nDATOS ACTUALES (${TODAY}):\n- Disponible hoy: $${data.disponible.toLocaleString('es-AR')}\n- Cobros pendientes: ${data.cobros.filter(c=>!c.cobrado).map(c=>`${c.nombre} $${c.monto.toLocaleString('es-AR')} el ${c.fecha}`).join(' | ')}\n- Pagos pendientes: ${data.pagos.filter(p=>!p.pagado).map(p=>`${p.nombre} (${p.cat}) $${p.monto.toLocaleString('es-AR')} vence ${p.fecha}`).join(' | ')}\n- Flujo proyectado: ${flujo.map(f=>`${f.fecha}: ${f.concepto} → saldo $${Math.round(f.saldo).toLocaleString('es-AR')}`).join(' | ')}`;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({model:'claude-sonnet-4-20250514', max_tokens:1000, system:systemPrompt, messages:aiHistory.filter(m=>m.text&&!m.text.includes('Analizando')).map(m=>({role:m.role==='bot'||m.role==='assistant'?'assistant':'user', content:m.text.replace(/<[^>]+>/g,'')}))})});
    const d = await res.json();
    const reply = d.content?.map(c=>c.text||'').join('') || 'No pude obtener respuesta.';
    aiHistory[aiHistory.length-1] = {role:'assistant', text: reply};
  } catch(e) { aiHistory[aiHistory.length-1] = {role:'assistant', text:'Error al conectar.'}; }
  renderMsgs();
}

function saveSaldo() {
  const v = parseFloat(document.getElementById('conf-saldo').value);
  if(isNaN(v)) return alert('Ingresá un número válido');
  data.disponible = v; save(); alert('Saldo actualizado a ' + fmt(v));
}
function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'flujo-'+TODAY+'.json'; a.click();
}
function resetData() {
  if(!confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
  localStorage.removeItem('flujo_v1'); location.reload();
}

updateTopbar();
renderDashboard();