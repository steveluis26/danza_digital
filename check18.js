

let currentStep = 1;
const totalSteps = 3;
const pads = {};
const UNIDADES = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve'];
const DECENAS = ['','diez','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
const CENTENAS = ['','cien','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];

function numToWordsMX(n){
  n = Math.round(Number(n)||0);
  if(n===0) return 'CERO';
  if(n===100) return 'CIEN';
  if(n<1000){
    let s='';
    if(n>=100){ s+= CENTENAS[Math.floor(n/100)]; n%=100; if(n>0) s+=' '; }
    if(n>=30){ s+= DECENAS[Math.floor(n/10)]; n%=10; if(n>0) s+=' y '+UNIDADES[n]; }
    else if(n>=21 && n<=29){ s+='veinti'+UNIDADES[n-20]; }
    else if(n===20){ s+='veinte'; }
    else if(n>=16 && n<=19){ s+='dieci'+UNIDADES[n-10]; }
    else if(n===15){ s+='quince'; }
    else if(n>=11 && n<=14){ s+='once|doce|trece|catorce'.split('|')[n-11]; }
    else if(n===10){ s+='diez'; }
    else if(n>=1){ s+=UNIDADES[n]; }
    return s.toUpperCase();
  }
  if(n<1000000){
    const miles = Math.floor(n/1000);
    const resto = n%1000;
    let s = (miles===1?'MIL':numToWordsMX(miles)+' MIL');
    if(resto>0) s+=' '+numToWordsMX(resto);
    return s;
  }
  const millones = Math.floor(n/1000000);
  const resto = n%1000000;
  let s = (millones===1?'UN MILLÓN':numToWordsMX(millones)+' MILLONES');
  if(resto>0) s+=' '+numToWordsMX(resto);
  return s;
}

function buildProgress(){
  const bar = document.getElementById('progressBar');
  bar.innerHTML = '';
  for(let i=1;i<=totalSteps;i++){
    const s = document.createElement('span');
    if(i<=currentStep) s.classList.add('done');
    bar.appendChild(s);
  }
}

function showStep(n){
  document.querySelectorAll('.step').forEach(el=>el.classList.remove('active'));
  document.querySelector(`.step[data-step="${n}"]`).classList.add('active');
  document.getElementById('btnBack').style.visibility = n===1 ? 'hidden' : 'visible';
  document.getElementById('btnNext').textContent = n===totalSteps ? 'Generar PDF' : 'Siguiente';
  buildProgress();
  window.scrollTo(0,0);
  if(n===3){ initSignaturePads(); fillPreview(); }
}

document.getElementById('btnBack').addEventListener('click', ()=>{
  if(currentStep>1){ currentStep--; showStep(currentStep); }
});

document.getElementById('btnNext').addEventListener('click', ()=>{
  if(currentStep<totalSteps){
    if(currentStep===2 && !validateStep2()){ return; }
    currentStep++;
    showStep(currentStep);
  } else {
    generatePDF();
  }
});

document.querySelectorAll('input[name="pago"]').forEach(r=>{
  r.addEventListener('change', renderPagoDetalle);
});
// recalcular texto de pago al escribir montos mixtos
document.getElementById('pago_detalle').addEventListener('input', ()=>{
  if(document.querySelector('.step[data-step="3"]')?.classList.contains('active')) fillPreview();
});
// parentesco: mostrar campo libre si elige "Otro"
document.getElementById('t_parent').addEventListener('change', e=>{
  const row = document.getElementById('t_parent_otro_row');
  row.style.display = (e.target.value === '__otro_parent') ? 'flex' : 'none';
  if(typeof fillPreview === 'function' && document.querySelector('.step[data-step="3"]')?.classList.contains('active')) fillPreview();
});

function validateStep2(){
  const req = ['t_nombre','t_parent','t_id_folio','t_calle','t_col','t_cp','fecha_firma','p_insc','p_mens','al_ciclo_anio'];
  const missing = req.filter(id=>!val(id));
  if(val('t_parent')==='__otro_parent' && !val('t_parent_otro')) missing.push('Especifique parentesco');
  if(!radioVal('pago')) missing.push('Forma de pago');
  if(!radioVal('foto')) missing.push('Aut. fotos');
  if(!radioVal('publi')) missing.push('Aut. publicidad');
  if(missing.length){
    showToast('Faltan: '+missing.join(', '));
    return false;
  }
  return true;
}

function initSignaturePads(){
  ['sig1','sig2','sig3','sig4'].forEach(id=>{
    if(pads[id]) return;
    const canvas = document.getElementById(id);
    resizeCanvas(canvas);
    pads[id] = new SignaturePad(canvas, { backgroundColor: 'rgba(255,255,255,1)', penColor: '#1a1a1a' });
  });
  document.querySelectorAll('.sig-clear').forEach(btn=>{
    btn.onclick = () => pads[btn.dataset.clear].clear();
  });
}

function resizeCanvas(canvas){
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext('2d').scale(ratio, ratio);
}

function val(id){ return (document.getElementById(id)?.value || '').trim(); }
function radioVal(name){ const r = document.querySelector(`input[name="${name}"]:checked`); return r ? r.value : ''; }
function orDash(s){ return s && s.length ? s : '—'; }
function money(n){ return n && !isNaN(n) ? '$' + Number(n).toLocaleString('es-MX') : '—'; }
function moneyFull(n){ const v=Number(n)||0; return '$'+v.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); }

const MESES = ['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function fechaPartes(iso){
  if(!iso) return {d:'—',m:'—',a:'—'};
  const [a,mm,dd] = iso.split('-');
  return {d: orDash(parseInt(dd,10).toString()), m: MESES[parseInt(mm,10)]||'—', a: orDash(a)};
}
function fechaDMA(iso){
  if(!iso) return '—';
  const [a,mm,dd] = iso.split('-');
  if(!dd||!mm||!a) return '—';
  return `${parseInt(dd,10)}/${parseInt(mm,10)}/${a}`;
}

function pagoTexto(){
  const p = radioVal('pago');
  if(p === 'Ambas'){
    const e = val('p_efectivo') ? '$' + Number(val('p_efectivo')).toLocaleString('es-MX') : '—';
    const t = val('p_transf') ? '$' + Number(val('p_transf')).toLocaleString('es-MX') : '—';
    return `El Contratante podrá pagar mediante efectivo y transferencia (efectivo: ${e}, transferencia: ${t}).`;
  }
  return p ? `El Contratante pagará mediante ${p}.` : '—';
}

function renderPagoDetalle(){
  const wrap = document.getElementById('pago_detalle');
  const p = radioVal('pago');
  if(p === 'Ambas'){
    wrap.innerHTML = '<div class="row">' +
      '<div><label>Parte en efectivo ($)</label><input type="number" id="p_efectivo" placeholder="0"></div>' +
      '<div><label>Parte en transferencia ($)</label><input type="number" id="p_transf" placeholder="0"></div>' +
      '</div><p style="margin-top:4px;">Suma efectivo + transferencia debe coincidir con inscripción/mensualidad.</p>';
  } else {
    wrap.innerHTML = '';
  }
  if(typeof fillPreview === 'function' && document.querySelector('.step[data-step="3"]')?.classList.contains('active')) fillPreview();
}

function fillPreview(){
  const alNombreFull = [val('al_nombre'), val('al_ap'), val('al_am')].filter(Boolean).join(' ');
  const alNombreOnly = val('al_nombre');
  const insc = val('p_insc'), mens = val('p_mens'), otros = val('p_otros')||0;
  const total = (Number(insc)||0) + (Number(mens)||0) + (Number(otros)||0);
  const fp = fechaPartes(val('fecha_firma'));

  set('p_al_nombre', orDash(alNombreFull));
  set('p_al_nombres_terc', orDash(alNombreOnly));
  set('p_al_nombres_anexo', orDash(alNombreOnly));
  set('p_al_ap', orDash(val('al_ap')));
  set('p_al_ap2', orDash(val('al_ap')));
  set('p_al_am', orDash(val('al_am')));
  set('p_al_am2', orDash(val('al_am')));
  set('p_al_fnac', fechaDMA(val('al_fnac')));
  set('p_al_sexo', orDash(radioVal('sexo')));
  set('p_al_entidad', orDash(val('al_entidad')));
  set('p_al_edad', orDash(val('al_edad')));
  // modalidades desde checkboxes + campo "otra"
  const mods = Array.from(document.querySelectorAll('#al_modalidades input[type=checkbox]:checked')).map(c=>c.value).filter(v=>v!=='__otra');
  if(val('al_mod_otra').trim()) mods.push(val('al_mod_otra').trim());
  const modsStr = mods.length ? mods.join(', ') : '—';
  set('p_modalidades', orDash(modsStr));
  set('p_ciclo', orDash((val('al_ciclo')+' '+val('al_ciclo_anio')).trim()));

  set('p_insc_out', moneyFull(insc));  set('p_insc_out2', money(insc));
  set('p_insc_letra', numToWordsMX(insc)+' PESOS'); set('p_insc_letra2', numToWordsMX(insc)+' PESOS');
  set('p_mens_out', moneyFull(mens));  set('p_mens_out2', money(mens));
  set('p_mens_letra', numToWordsMX(mens)+' PESOS'); set('p_mens_letra2', numToWordsMX(mens)+' PESOS');
  set('p_otros_out', money(otros)); set('p_otros_letra', numToWordsMX(otros)+' PESOS');
  set('p_total_out', money(total)); set('p_total_letra', numToWordsMX(total)+' PESOS');

  set('p_pago', orDash(pagoTexto()));

  set('p_s_dificultad', orDash(val('s_dificultad')));
  set('p_s_tratamiento', orDash(val('s_tratamiento')));
  set('p_s_alergia', orDash(val('s_alergia')));
  set('p_s_diabetes', orDash(val('s_diabetes')));
  set('p_s_servicio', orDash(val('s_servicio')));
  set('p_s_ficha', orDash(val('s_ficha')));
  set('p_s_tel', orDash(val('s_tel')));
  set('p_s_aseg', orDash(val('s_aseg')));
  set('p_s_aseg_tel', orDash(val('s_aseg_tel')));
  set('p_s_poliza', orDash(val('s_poliza')));

  const c1 = [val('c1_nombre'), val('c1_par'), val('c1_tel'), val('c1_cel')].filter(Boolean).join(' · ');
  const c2 = [val('c2_nombre'), val('c2_par'), val('c2_tel'), val('c2_cel')].filter(Boolean).join(' · ');
  const c3 = [val('c3_nombre'), val('c3_par'), val('c3_tel'), val('c3_cel')].filter(Boolean).join(' · ');
  set('p_c1', orDash(c1));
  set('p_c2', orDash(c2));
  set('p_c3', orDash(c3));

  set('p_t_nombre', orDash(val('t_nombre')));
  set('p_t_nombre2', orDash(val('t_nombre')));
  set('p_t_nombre3', orDash(val('t_nombre')));
  set('p_t_nac', orDash(val('t_nac')));
  const parentFinal = val('t_parent')==='__otro_parent' ? val('t_parent_otro') : val('t_parent');
  set('p_t_parent', orDash(parentFinal));
  const idStr = [val('t_id_tipo'), val('t_id_folio')].filter(Boolean).join(' · folio ');
  set('p_t_id', orDash(idStr));
  set('p_t_calle', orDash(val('t_calle')));
  set('p_t_col', orDash(val('t_col')));
  set('p_t_cp', orDash(val('t_cp')));
  set('p_t_ciudad', orDash(val('t_ciudad')));

  set('p_foto', orDash(radioVal('foto')));
  set('p_publi', orDash(radioVal('publi')));
  set('p_fecha_reg', fechaDMA(val('fecha_firma')));
  set('p_dia', fp.d); set('p_mes', fp.m); set('p_anio', fp.a);

  document.getElementById('sig1name').textContent = orDash(val('t_nombre'));
  document.getElementById('sig2name').textContent = orDash(val('t_nombre'));
  document.getElementById('sig4name').textContent = orDash(val('t_nombre'));
}

function set(id, text){
  const el = document.getElementById(id);
  if(el) el.textContent = text;
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3200);
}

function collectData(){
  const cols = [
    // alumno
    'al_nombre','al_ap','al_am','al_fnac','al_entidad','al_edad','al_ciclo',
    // modalidades checkboxes + otra
    'al_mod_otra',
    // salud
    's_dificultad','s_tratamiento','s_alergia','s_diabetes','s_servicio','s_ficha','s_tel','s_aseg','s_aseg_tel','s_poliza',
    // contactos
    'c1_nombre','c1_par','c1_tel','c1_cel','c2_nombre','c2_par','c2_tel','c2_cel','c3_nombre','c3_par','c3_tel','c3_cel',
    // tutor
    't_nombre','t_nac','t_id_tipo','t_id_folio','t_parent','t_parent_otro','t_calle','t_col','t_cp','t_ciudad',
    // costos
    'p_insc','p_mens','p_otros',
    // autorizaciones + firma
    'fecha_firma'
  ];
  const d = {};
  cols.forEach(id => d[id] = val(id));
  // modalidades
  const mods = Array.from(document.querySelectorAll('#al_modalidades input[type=checkbox]:checked')).map(c=>c.value).filter(v=>v!=='__otra');
  if(val('al_mod_otra').trim()) mods.push(val('al_mod_otra').trim());
  d.al_modalidades = mods.join(', ');
  d.sexo = radioVal('sexo');
  d.pago = radioVal('pago');
  if(d.pago === 'Ambas'){
    d.p_efectivo = val('p_efectivo');
    d.p_transf = val('p_transf');
  }
  d.parentesco = (d.t_parent === '__otro_parent') ? val('t_parent_otro') : d.t_parent;
  d.foto = radioVal('foto');
  d.publi = radioVal('publi');
  d.total = (Number(d.p_insc)||0) + (Number(d.p_mens)||0) + (Number(d.p_otros)||0);
  return d;
}

function cicloArchivo(){
  // al_ciclo suele ser "Sep 2026 - Ago 2027" o similar
  const c = val('al_ciclo');
  if(!c) return 'ciclo';
  const nums = (c.match(/\d{4}/g) || []).map(Number);
  if(nums.length >= 2) return `${nums[0]}-${nums[1]}`;
  if(nums.length === 1) return `${nums[0]}`;
  // fallback: tomar ultimos 4 digitos
  const m = c.match(/(\d{4})\s*-\s*\w*\s*(\d{4})/);
  return m ? `${m[1]}-${m[2]}` : 'ciclo';
}

async function generatePDF(){
  const empty = Object.entries(pads).filter(([k,p])=>p.isEmpty());
  if(empty.length){
    showToast('Faltan firmas por capturar (' + empty.length + ')');
    return;
  }
  showToast('Generando PDF, un momento...');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p','pt','a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const M = 36;                       // margen pt (~12.7mm)
  const contentW = pageW - M*2;
  const contentH = pageH - M*2;
  const SCALE = 2;
  const pages = document.querySelectorAll('#printArea .doc-page');

  let pageIdx = -1;
  let cursorY = M;

  function newPage(){
    pageIdx++;
    if(pageIdx>0) pdf.addPage();
    cursorY = M;
  }
  newPage();

  // rasteriza un nodo a contentW; si es mas alto que la pagina, se encoge la imagen
  // (manteniendo proporcion) hasta que quepa entera en una pagina.
  async function renderNode(node){
    const c = await html2canvas(node, { scale: SCALE, backgroundColor:'#ffffff', useCORS:true, logging:false });
    let wPt = c.width * (contentW / c.width);
    let hPt = c.height * (contentW / c.width);
    // garantizar que quepa en la pagina: factor de encogido proporcional
    const maxH = contentH;
    if(hPt > maxH){
      const f = maxH / hPt;
      wPt = wPt * f;
      hPt = maxH;
    }
    if(wPt > contentW){ const f = contentW / wPt; wPt = contentW; hPt = hPt * f; }
    return { dataURL: c.toDataURL('image/png'), wPt, hPt };
  }

  for(const doc of pages){
    if(cursorY > M) newPage();
    const kids = Array.from(doc.children);
    for(const node of kids){
      const img = await renderNode(node);
      if(cursorY + img.hPt > M + contentH + 0.5){
        newPage();
      }
      pdf.addImage(img.dataURL, 'PNG', M, cursorY, img.wPt, img.hPt);
      cursorY += img.hPt + 8;
    }
  }

  const alumno = (val('al_ap')+'_'+val('al_nombre')).replace(/\s+/g,'_') || 'alumno';
  const ciclo = cicloArchivo();
  const fecha = val('fecha_firma') || new Date().toISOString().slice(0,10);
  pdf.save(`Registro_${ciclo}_${alumno}.pdf`);

  const data = collectData();
  const firmas = {};
  ['sig1','sig2','sig3','sig4'].forEach(id=>{ firmas[id] = pads[id].toDataURL('image/png'); });
  const payload = {
    generado: new Date().toISOString(),
    instituto: 'Instituto de Danza Ma. del Carmen Montejo',
    cct: '30PBT0142F',
    alumno: `${val('al_ap')} ${val('al_nombre')}`.trim(),
    datos: data, firmas
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Registro_${ciclo}_${alumno}_${fecha}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);

  showToast('PDF y JSON descargados. Súbelos a la carpeta del alumno en Drive.');
}

buildProgress();
window.addEventListener('resize', ()=>{
  Object.keys(pads).forEach(id=>{
    const canvas = document.getElementById(id);
    const data = pads[id].toData();
    resizeCanvas(canvas);
    pads[id].fromData(data);
  });
});
