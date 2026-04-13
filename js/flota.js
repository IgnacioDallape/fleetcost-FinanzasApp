const FC_COLORS=['#3B7DD8','#D4820A','#2BB89A','#E05A2B','#8B5CF6'];
function fcFmtN(n){ return Math.round(n).toLocaleString('es-AR'); }
function fcFmtM(n){ return '$ '+fcFmtN(n); }

let _fcTotalKmG=0;

function fcCalcular(){
  const km=parseFloat(document.getElementById('km').value)||0;
  const rubros=[
    {nombre:'Seguro',          val:parseFloat(document.getElementById('seguro').value)||0},
    {nombre:'Patente/Impuest.',val:parseFloat(document.getElementById('patente').value)||0},
    {nombre:'Mantenimiento',   val:parseFloat(document.getElementById('manto').value)||0},
    {nombre:'Aceite',          val:parseFloat(document.getElementById('aceite').value)||0},
    {nombre:'Cubiertas',       val:parseFloat(document.getElementById('cubiertas').value)||0},
  ];
  const total=rubros.reduce((s,r)=>s+r.val,0);
  const anual=total*12;
  const indKm=km>0?total/km:null;
  const max=Math.max(...rubros.map(r=>r.val),1);

  document.getElementById('r-mensual').textContent=fcFmtN(total);
  document.getElementById('r-mensual-sub').textContent=
    total>0?`${rubros.filter(r=>r.val>0).length} rubros activos · anual ${fcFmtM(anual)}`
           :'ingresá los valores para calcular';
  document.getElementById('r-anual').textContent=fcFmtM(anual);
  if(indKm!==null){
    document.getElementById('r-km').textContent=fcFmtM(indKm);
    document.getElementById('r-km-sub').textContent=fcFmtN(km)+' km / mes';
  } else {
    document.getElementById('r-km').textContent='—';
    document.getElementById('r-km-sub').textContent='ingresá los km';
  }

  document.getElementById('r-total-rubros').textContent=fcFmtM(total);
  document.getElementById('breakdown-list').innerHTML=rubros.map((r,i)=>{
    const pct=total>0?Math.round(r.val/total*100):0;
    const w=Math.round(r.val/max*100);
    return `<div class="b-row">
      <div class="b-pip" style="background:${FC_COLORS[i]};"></div>
      <div class="b-name">${r.nombre}</div>
      <div class="b-bar-wrap"><div class="b-bar-fill" style="width:${w}%;background:${FC_COLORS[i]};opacity:.7;"></div></div>
      <div class="b-pct">${pct}%</div>
      <div class="b-amt">${fcFmtM(r.val)}</div>
    </div>`;
  }).join('');

  const choferKm=parseFloat(document.getElementById('chofer-km').value)||0;
  const precioL=parseFloat(document.getElementById('precio-litro').value)||0;
  const rend=parseFloat(document.getElementById('rendimiento').value)||0;
  const combustKm=rend>0?precioL/rend:0;

  document.getElementById('r-chofer').textContent=choferKm>0?fcFmtM(choferKm):'—';
  document.getElementById('r-chofer-sub').textContent=choferKm>0?'por km recorrido':'ingresá la tarifa';
  document.getElementById('r-combustible').textContent=combustKm>0?fcFmtM(combustKm):'—';
  document.getElementById('r-combustible-sub').textContent=combustKm>0?rend.toFixed(1)+' km / litro':'ingresá precio y rendimiento';

  const totalKm=(indKm||0)+choferKm+combustKm;
  _fcTotalKmG=totalKm;
  if(km>0&&totalKm>0){
    document.getElementById('r-total-km').textContent=fcFmtN(totalKm);
    document.getElementById('r-total-rows').innerHTML=[
      {label:'Costos indirectos / km',val:indKm,color:'#3B7DD8'},
      {label:'Chofer / km',val:choferKm,color:'#2BB89A'},
      {label:'Combustible / km',val:combustKm,color:'#D4820A'},
    ].map(row=>`<div class="t-row">
      <span class="t-row-label" style="color:${row.color};"><span class="t-pip" style="background:${row.color};"></span>${row.label}</span>
      <span class="t-row-val">${row.val>0?fcFmtM(row.val):'—'}</span>
    </div>`).join('');
  } else {
    document.getElementById('r-total-km').textContent='—';
    document.getElementById('r-total-rows').innerHTML=
      '<div class="t-row"><span class="t-row-label" style="color:var(--muted);"><span class="t-pip" style="background:var(--muted);"></span>Completá todos los datos para ver el total</span></div>';
  }
  fcCalcularViaje();
}

function fcCalcularViaje(){
  const facturado  = parseFloat(document.getElementById('v-facturado').value)||0;
  const vkm        = parseFloat(document.getElementById('v-km').value)||0;
  const peajes     = parseFloat(document.getElementById('v-peajes').value)||0;
  const litros     = parseFloat(document.getElementById('v-litros').value)||0;
  const choferPago = parseFloat(document.getElementById('v-chofer-pago').value)||0;
  const precioL    = parseFloat(document.getElementById('precio-litro').value)||0;
  const rendTeo    = parseFloat(document.getElementById('rendimiento').value)||0;

  const elA = document.getElementById('trip-result-a');
  const elB = document.getElementById('trip-result-b');

  if(facturado===0 && vkm===0 && peajes===0 && litros===0){
    elA.innerHTML=`<div class="trip-empty">
      <svg viewBox="0 0 24 24" style="width:26px;height:26px;stroke:var(--muted);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      <div>completá los datos<br>del viaje</div>
    </div>`;
    elB.innerHTML='';
    return;
  }

  const costoKm    = _fcTotalKmG;
  const costoViaje = costoKm * vkm + peajes + choferPago;
  const ganancia   = facturado - costoViaje;
  const margen     = facturado > 0 ? ganancia/facturado*100 : 0;
  const isPos      = ganancia >= 0;

  // Consumo cada 100 km
  const consumoReal = (litros > 0 && vkm > 0) ? (litros / vkm * 100) : null;
  const consumoTeo  = rendTeo > 0 ? (100 / rendTeo) : null;
  const diff        = (consumoReal !== null && consumoTeo !== null) ? consumoReal - consumoTeo : null;
  const isAlto      = diff !== null && diff > consumoTeo * 0.1;
  const costoLitros = litros > 0 ? litros * precioL : null;

  elA.innerHTML=`
    <div class="gh-card ${isPos?'pos':'neg'}">
      <div class="gh-tag">${isPos?'ganancia neta':'pérdida neta'}</div>
      <div class="gh-value">${isPos?'':'- '}${fcFmtM(Math.abs(ganancia))}</div>
      <div class="gh-sub">margen ${margen.toFixed(1)}% · sobre ${fcFmtM(facturado)} facturado</div>
    </div>
    <div class="trip-metrics">
      <div class="tm-card">
        <div class="tm-tag">Costo total del viaje</div>
        <div class="tm-val">${fcFmtM(costoViaje)}</div>
        <div class="tm-sub">${vkm>0?vkm.toLocaleString('es-AR')+' km recorridos':'sin km'}</div>
      </div>
      <div class="tm-card">
        <div class="tm-tag">Costo operativo / km</div>
        <div class="tm-val">${costoKm>0?fcFmtM(costoKm):'—'}</div>
        <div class="tm-sub">todos los rubros incluidos</div>
      </div>
    </div>
  `;

  elB.innerHTML=`
    <div style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;">Desglose de costos del viaje</div>
    <div class="trip-desglose">
      <div class="td-head"><span>Concepto</span><span>Monto</span></div>
      <div class="td-row">
        <span class="td-label"><span class="td-pip" style="background:#3B7DD8;"></span>Costo operativo (km)</span>
        <span class="td-val">${fcFmtM(costoKm*vkm)}</span>
      </div>
      <div class="td-row">
        <span class="td-label"><span class="td-pip" style="background:#2BB89A;"></span>Chofer (real)</span>
        <span class="td-val">${choferPago>0?fcFmtM(choferPago):'—'}</span>
      </div>
      <div class="td-row">
        <span class="td-label"><span class="td-pip" style="background:#2BB89A;"></span>Peajes</span>
        <span class="td-val">${fcFmtM(peajes)}</span>
      </div>
      <div class="td-total">
        <span class="td-total-label">Total costos</span>
        <span class="td-total-val">${fcFmtM(costoViaje)}</span>
      </div>
    </div>
    <div style="margin-top:12px;padding:12px 14px;border-radius:var(--r-sm);background:${isPos?'#2BB89A10':'#E05A2B10'};border:1px solid ${isPos?'#2BB89A25':'#E05A2B25'};">
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:${isPos?'var(--green)':'#E05A2B'};letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;">resultado</div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted2);">${fcFmtM(facturado)} facturado − ${fcFmtM(costoViaje)} costos</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:${isPos?'var(--green)':'#E05A2B'};">${isPos?'':'−'}${fcFmtM(Math.abs(ganancia))}</span>
      </div>
    </div>
    ${consumoReal !== null ? `
    <div style="margin-top:12px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--amber);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">
        <span>Control de combustible</span>
        ${diff !== null ? `<span class="cons-badge ${isAlto?'alto':'ok'}">${isAlto?'consumo elevado':'consumo normal'}</span>` : ''}
      </div>
      <div class="trip-metrics">
        <div class="tm-card">
          <div class="tm-tag">Consumo real</div>
          <div class="tm-val ${diff===null?'':isAlto?'alto':'ok'}">${consumoReal.toFixed(1)} L</div>
          <div class="tm-sub">cada 100 km</div>
        </div>
        <div class="tm-card">
          <div class="tm-tag">Consumo esperado</div>
          <div class="tm-val">${consumoTeo !== null ? consumoTeo.toFixed(1)+' L' : '—'}</div>
          <div class="tm-sub">cada 100 km</div>
        </div>
        ${costoLitros !== null ? `
        <div class="tm-card">
          <div class="tm-tag">Costo combustible</div>
          <div class="tm-val">${fcFmtM(costoLitros)}</div>
          <div class="tm-sub">${litros} L × ${fcFmtM(precioL)}</div>
        </div>` : ''}
        ${diff !== null ? `
        <div class="tm-card">
          <div class="tm-tag">Diferencia</div>
          <div class="tm-val ${isAlto?'alto':'ok'}">${diff>0?'+':''}${diff.toFixed(1)} L</div>
          <div class="tm-sub">${diff>0?'más de lo esperado':diff<0?'menos de lo esperado':'exacto'}</div>
          ${diff>0.05 && precioL>0 ? `<div style="margin-top:8px;padding:6px 8px;border-radius:6px;background:#E05A2B10;border:1px solid #E05A2B20;font-family:'JetBrains Mono',monospace;font-size:10px;color:#E05A2B;">costo extra: ${fcFmtM((diff/100)*vkm*precioL)}</div>` : ''}
        </div>` : ''}
      </div>
    </div>` : ''}
  `;
}

// ── TABS ──────────────────────────────────────────────
function fcSwitchTab(tab){
  document.getElementById('panel-calculadora').style.display = tab==='calculadora' ? '' : 'none';
  document.getElementById('panel-historial').style.display   = tab==='historial'   ? '' : 'none';
  document.getElementById('tab-calculadora').classList.toggle('active', tab==='calculadora');
  document.getElementById('tab-historial').classList.toggle('active',   tab==='historial');
  if(tab==='historial') fcRenderHistorial();
}

// ── GUARDAR VIAJE ──────────────────────────────────────
let fcViajesGuardados = [];

function fcGuardarViaje(){
  const facturado  = parseFloat(document.getElementById('v-facturado').value)||0;
  const vkm        = parseFloat(document.getElementById('v-km').value)||0;
  const peajes     = parseFloat(document.getElementById('v-peajes').value)||0;
  const litros     = parseFloat(document.getElementById('v-litros').value)||0;
  const choferPago = parseFloat(document.getElementById('v-chofer-pago').value)||0;
  const desc       = document.getElementById('v-desc').value.trim() || 'Viaje sin descripción';
  const precioL    = parseFloat(document.getElementById('precio-litro').value)||0;
  const rendTeo    = parseFloat(document.getElementById('rendimiento').value)||0;

  if(facturado === 0 && vkm === 0){
    const t = document.getElementById('save-toast');
    t.textContent = '⚠ Ingresá al menos el monto y los km';
    t.style.display='block';
    t.style.background='#D4820A15';
    t.style.borderColor='#D4820A35';
    t.style.color='var(--amber)';
    setTimeout(()=>{t.style.display='none';}, 2800);
    return;
  }

  const costoViaje = _fcTotalKmG * vkm + peajes + choferPago;
  const ganancia   = facturado - costoViaje;
  const margen     = facturado > 0 ? ganancia/facturado*100 : 0;
  const consumoReal = (litros>0 && vkm>0) ? litros/vkm*100 : null;
  const consumoTeo  = rendTeo > 0 ? 100/rendTeo : null;

  const viaje = {
    id: Date.now(),
    fecha: new Date().toLocaleString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}),
    desc, facturado, vkm, peajes, litros, choferPago,
    costoViaje, ganancia, margen, consumoReal, consumoTeo, precioL
  };

  fcViajesGuardados.unshift(viaje);

  // Update counter badge
  document.getElementById('tab-count').textContent = fcViajesGuardados.length;

  // Show toast
  const t = document.getElementById('save-toast');
  t.innerHTML = '✓ Viaje guardado &nbsp;·&nbsp; <span style="cursor:pointer;text-decoration:underline" onclick="fcRegistrarCobro(fcViajesGuardados[0]);document.getElementById(\'save-toast\').style.display=\'none\'">Registrar como cobro en Flujo →</span>';
  t.style.display='block';
  t.style.background='#2BB89A15';
  t.style.borderColor='#2BB89A30';
  t.style.color='var(--green)';
  t.style.cursor='pointer';
  t.onclick = ()=>{ fcSwitchTab('historial'); t.style.display='none'; };
  setTimeout(()=>{ t.style.display='none'; t.onclick=null; }, 4000);
}

// ── RENDER HISTORIAL ──────────────────────────────────
function fcRenderHistorial(){
  const empty = document.getElementById('hist-empty');
  const list  = document.getElementById('hist-list');
  const sumEl = document.getElementById('hist-summary');

  if(fcViajesGuardados.length === 0){
    empty.style.display='flex';
    list.innerHTML='';
    sumEl.style.display='none';
    return;
  }

  empty.style.display='none';
  sumEl.style.display='grid';

  list.innerHTML = fcViajesGuardados.map((v,i)=>{
    const isPos = v.ganancia >= 0;
    const n = fcViajesGuardados.length - i;
    return `
    <div class="hist-card">
      <div class="hist-card-head">
        <div class="hist-card-left">
          <span class="hist-num">#${n}</span>
          <span class="hist-desc">${v.desc}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="hist-date">${v.fecha}</span>
          <span class="hist-badge ${isPos?'pos':'neg'}">${isPos?'+':''}${fcFmtM(Math.round(v.ganancia))}</span>
        </div>
      </div>
      <div class="hist-card-body">
        <div class="hc-stat">
          <div class="hc-label">Facturado</div>
          <div class="hc-val">${fcFmtM(v.facturado)}</div>
        </div>
        <div class="hc-stat">
          <div class="hc-label">Costo total</div>
          <div class="hc-val">${fcFmtM(v.costoViaje)}</div>
        </div>
        <div class="hc-stat">
          <div class="hc-label">Ganancia</div>
          <div class="hc-val ${isPos?'green':'red'}">${fcFmtM(v.ganancia)}</div>
        </div>
        <div class="hc-stat">
          <div class="hc-label">Margen</div>
          <div class="hc-val ${isPos?'green':'red'}">${v.margen.toFixed(1)}%</div>
        </div>
        <div class="hc-stat">
          <div class="hc-label">Km</div>
          <div class="hc-val">${v.vkm.toLocaleString('es-AR')}</div>
        </div>
        ${v.consumoReal !== null ? `
        <div class="hc-stat">
          <div class="hc-label">Consumo real</div>
          <div class="hc-val">${v.consumoReal.toFixed(1)} L/100km</div>
        </div>` : ''}
        ${v.choferPago > 0 ? `
        <div class="hc-stat">
          <div class="hc-label">Pago chofer</div>
          <div class="hc-val">${fcFmtM(v.choferPago)}</div>
        </div>` : ''}
      </div>
    </div>`;
  }).join('');

  // Summary stats
  const totalFact  = fcViajesGuardados.reduce((s,v)=>s+v.facturado, 0);
  const totalGan   = fcViajesGuardados.reduce((s,v)=>s+v.ganancia, 0);
  const totalKm    = fcViajesGuardados.reduce((s,v)=>s+v.vkm, 0);
  const avgMargen  = fcViajesGuardados.reduce((s,v)=>s+v.margen, 0) / fcViajesGuardados.length;
  const isGanPos   = totalGan >= 0;

  document.getElementById('hs-count').textContent    = fcViajesGuardados.length;
  document.getElementById('hs-facturado').textContent = fcFmtM(totalFact);
  document.getElementById('hs-ganancia').textContent  = fcFmtM(totalGan);
  document.getElementById('hs-ganancia').className    = 'hs-value'+(isGanPos?' green':'');
  document.getElementById('hs-margen').textContent    = avgMargen.toFixed(1)+'%';
  document.getElementById('hs-km').textContent        = totalKm.toLocaleString('es-AR')+' km';
}

function fcLimpiarHistorial(){
  if(fcViajesGuardados.length === 0) return;
  if(!confirm('¿Eliminar todos los viajes guardados?')) return;
  fcViajesGuardados = [];
  document.getElementById('tab-count').textContent = '0';
  fcRenderHistorial();
}

function fcInitFlota() {
  fcCalcular();
  fcRenderHistorial();
}


function fcRegistrarCobro(viaje) {
  const fecha = new Date().toISOString().split('T')[0];
  data.cobros.push({id:Date.now(), nombre:'Flete: '+viaje.desc, monto:viaje.facturado, fecha:fecha, cobrado:false, notas:'FleetCost · '+viaje.vkm+' km · margen '+viaje.margen.toFixed(1)+'%'});
  save();
  alert('Cobro registrado en Flujo: '+viaje.desc+' — '+fcFmtM(viaje.facturado));
}
function fcInitFlota() {
  fcCalcular();
  fcRenderHistorial();
}