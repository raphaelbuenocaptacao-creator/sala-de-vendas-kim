const META=window.KIM_META, ROOM=window.KIM_ROOM_MONTH, ROLE=window.KIM_ROLE_MONTH;
const $=id=>document.getElementById(id);
const fmtN=new Intl.NumberFormat('pt-BR');
const fmtPct=v=>new Intl.NumberFormat('pt-BR',{style:'percent',maximumFractionDigits:1}).format(v||0);
const fmtMoney=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v||0);
const fmtCompact=v=>new Intl.NumberFormat('pt-BR',{notation:'compact',style:'currency',currency:'BRL',maximumFractionDigits:2}).format(v||0);
const monthName={'01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun','07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez'};
let charts={};

const CURRENT_TEAM=[
  {group:'G1',role:'closer',name:'MARCOS LEANDRO MUNIZ',label:'MARCOS'},
  {group:'G1',role:'liner',name:'RUTEMBERG CORREIA',label:'BERG (FTB)'},
  {group:'G1',role:'liner',name:'JANAINA SANCHES SANTANA',label:'JANAINA'},
  {group:'G1',role:'liner',name:'ALEX DE MENDES BRITO',label:'ALEX'},
  {group:'G2',role:'closer',name:'LUIS ALVES DO AMARAL NETO',label:'LUIS'},
  {group:'G2',role:'liner',name:'MEG DE LOIOLA LIMA',label:'MEG'},
  {group:'G2',role:'liner',name:'KARINA FONTAN NASCIMENTO',label:'KARINA'},
  {group:'G3',role:'closer',name:'BIANCA SANTOS',label:'BIANCA'},
  {group:'G3',role:'liner',name:'STELLA CHRISTY DIAS',label:'STELLA'},
  {group:'G3',role:'liner',name:'GABRIELLA FURTADO GOMES FIGUEI',label:'GABRIELLA'},
  {group:'G3',role:'liner',name:'FABRICIO LELIS BIGNARDI',label:'FABRICIO (FTB)'},
  {group:'G4',role:'closer',name:'DANIEL MARCOS',label:'DANIEL'},
  {group:'G4',role:'liner',name:'DANIELA',label:'DANIELA'},
  {group:'G4',role:'liner',name:'BIANCA DUARTE',label:'BIANCA'}
];
const MANAGEMENT={
  'KIMBERLY CRISTINA TAVARES':'Gerente de Sala',
  'MARCEL VINICIUS DORADO EUGENI':'Diretor'
};
const ACTIVE_NAMES=new Set(CURRENT_TEAM.map(x=>x.name));
const TEAM_BY_NAME=new Map(CURRENT_TEAM.map(x=>[x.name,x]));

function labelMonth(k){return `${monthName[k.slice(5,7)]}/${k.slice(0,4)}`}
function inRange(m,s,e){return (!s||m>=s)&&(!e||m<=e)}
function staffState(name){if(MANAGEMENT[name])return 'management';return ACTIVE_NAMES.has(name)?'active':'inactive'}
function staffGroup(name){return TEAM_BY_NAME.get(name)?.group||'—'}
function emptyPerson(item){return {name:item.name,registros:0,tours:0,q:0,nq:0,vendas:0,ativos:0,cancel:0,vgv:0,activeVgv:0,conv:0,ticket:0,cancelRate:0,qRate:0}}

function sumRoom(s,e){
  const out={registros:0,tours:0,notour:0,q:0,nq:0,vendas:0,ativos:0,cancel:0,vgv:0,activeVgv:0};
  ROOM.forEach(r=>{if(!inRange(r[0],s,e))return;out.registros+=r[1];out.tours+=r[2];out.notour+=r[3];out.q+=r[4];out.nq+=r[5];out.vendas+=r[6];out.ativos+=r[7];out.cancel+=r[8];out.vgv+=r[9];out.activeVgv+=r[10]});
  out.conv=out.tours?out.vendas/out.tours:0;out.ticket=out.vendas?out.vgv/out.vendas:0;out.cancelRate=out.vendas?out.cancel/out.vendas:0;out.qRate=(out.q+out.nq)?out.q/(out.q+out.nq):0;return out;
}
function roleRanking(role,s,e){
  const m=new Map();
  ROLE.forEach(r=>{if(r[1]!==role||!inRange(r[0],s,e))return;const n=r[2];if(!m.has(n))m.set(n,{name:n,registros:0,tours:0,q:0,nq:0,vendas:0,ativos:0,cancel:0,vgv:0,activeVgv:0});const a=m.get(n);a.registros+=r[3];a.tours+=r[4];a.q+=r[5];a.nq+=r[6];a.vendas+=r[7];a.ativos+=r[8];a.cancel+=r[9];a.vgv+=r[10];a.activeVgv+=r[11]});
  const arr=[...m.values()];arr.forEach(a=>{a.conv=a.tours?a.vendas/a.tours:0;a.ticket=a.vendas?a.vgv/a.vendas:0;a.cancelRate=a.vendas?a.cancel/a.vendas:0;a.qRate=a.registros?a.q/a.registros:0});return arr;
}
function filteredRanking(role,s,e,status){
  let arr=roleRanking(role,s,e).filter(a=>staffState(a.name)!=='management');
  if(status==='active'){
    arr=arr.filter(a=>staffState(a.name)==='active');
    CURRENT_TEAM.filter(x=>x.role===role).forEach(item=>{if(!arr.some(a=>a.name===item.name))arr.push(emptyPerson(item))});
  }else if(status==='inactive'){
    arr=arr.filter(a=>staffState(a.name)==='inactive');
  }
  return arr;
}
function decision(a,benchmark,roomCancel){
  if(a.tours<30)return[a.tours===0?'SEM DADOS':'AMOSTRA BAIXA','low'];
  if(a.conv>=benchmark+.03&&a.cancelRate<=roomCancel)return['ESCALAR','esc'];
  if(a.conv>=benchmark-.02)return['MANTER','man'];
  return['DESENVOLVER','dev'];
}
function monthly(s,e){return ROOM.filter(r=>inRange(r[0],s,e)).map(r=>({key:r[0],label:labelMonth(r[0]),tours:r[2],vendas:r[6],vgv:r[9],active:r[10],conv:r[2]?r[6]/r[2]:0}))}
function makeChart(id,type,data,options){if(charts[id])charts[id].destroy();charts[id]=new Chart($(id),{type,data,options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#cbd5e1'},position:'bottom'}},scales:{x:{ticks:{color:'#94a3b8'},grid:{color:'rgba(148,163,184,.08)'}},y:{ticks:{color:'#94a3b8'},grid:{color:'rgba(148,163,184,.10)'}}},...options}})}

function renderGroups(){
  const groups=['G1','G2','G3','G4'];
  $('groupGrid').innerHTML=groups.map(g=>{
    const members=CURRENT_TEAM.filter(x=>x.group===g);
    const closer=members.find(x=>x.role==='closer');
    const liners=members.filter(x=>x.role==='liner');
    return `<article class="group-card ${g.toLowerCase()}">
      <div class="group-head"><b>${g}</b><span>${closer?closer.label:'—'}</span><small>Closer</small></div>
      <div class="group-members">${liners.map(x=>`<div><strong>${x.label}</strong><span>Liner</span></div>`).join('')}</div>
    </article>`;
  }).join('');
}

function render(){
  const s=$('startMonth').value,e=$('endMonth').value,role=$('role').value,status=$('staffStatus').value,sort=$('sortMetric').value,q=$('search').value.trim().toUpperCase();
  const room=sumRoom(s,e), months=monthly(s,e); let arr=filteredRanking(role,s,e,status);
  const benchmark=arr.reduce((z,a)=>z+a.vendas,0)/(arr.reduce((z,a)=>z+a.tours,0)||1);
  const sorters={vgv:(a,b)=>b.vgv-a.vgv,vendas:(a,b)=>b.vendas-a.vendas,conv:(a,b)=>b.conv-a.conv,active:(a,b)=>b.activeVgv-a.activeVgv,cancelRate:(a,b)=>a.cancelRate-b.cancelRate};
  arr.sort(sorters[sort]); if(q)arr=arr.filter(a=>a.name.includes(q)||(TEAM_BY_NAME.get(a.name)?.label||'').includes(q));
  const statusLabel={active:'ATIVOS',inactive:'INATIVOS',all:'TODOS OPERACIONAIS'}[status];
  $('periodLabel').textContent=`Período: ${labelMonth(s)} a ${labelMonth(e)} • Base emitida em ${META.issued}`;
  $('kpiTours').textContent=fmtN.format(room.tours);$('kpiSales').textContent=fmtN.format(room.vendas);$('kpiVgv').textContent=fmtCompact(room.vgv);$('kpiActiveVgv').textContent=fmtCompact(room.activeVgv);
  $('kpiConv').textContent=fmtPct(room.conv);$('kpiTicket').textContent=fmtMoney(room.ticket);$('kpiCancel').textContent=fmtN.format(room.cancel);$('kpiCancelRate').textContent=`${fmtPct(room.cancelRate)} das vendas`; $('kpiNoTour').textContent=fmtN.format(room.notour);
  $('roleEyebrow').textContent=role==='liner'?'CONSULTORIA':'FECHAMENTO';$('rankingTitle').textContent=`${role==='liner'?'Ranking de Liners':'Ranking de Closers'} — ${statusLabel}`;$('benchmark').textContent=`Benchmark do filtro: ${fmtPct(benchmark)} de conversão`;
  $('rankingBody').innerHTML=arr.map((a,i)=>{const[d,cl]=decision(a,benchmark,room.cancelRate);const st=staffState(a.name);const person=TEAM_BY_NAME.get(a.name);const shown=person?.label||a.name;return `<tr><td class="rank">${i+1}</td><td><b>${shown}</b>${shown!==a.name?`<small class="subname">${a.name}</small>`:''}</td><td>${staffGroup(a.name)}</td><td><span class="status ${st}">${st==='active'?'ATIVO':'INATIVO'}</span></td><td>${fmtN.format(a.tours)}</td><td>${fmtN.format(a.vendas)}</td><td>${fmtMoney(a.vgv)}</td><td>${fmtPct(a.conv)}</td><td>${fmtMoney(a.ticket)}</td><td>${fmtPct(a.cancelRate)}</td><td>${fmtPct(a.qRate)}</td><td><span class="decision ${cl}">${d}</span></td></tr>`}).join('');
  if(!arr.length)$('rankingBody').innerHTML='<tr><td colspan="12" class="empty-row">Nenhum profissional encontrado neste filtro.</td></tr>';
  makeChart('vgvChart','line',{labels:months.map(m=>m.label),datasets:[{label:'VGV bruto',data:months.map(m=>m.vgv),borderWidth:2,tension:.25},{label:'VGV ativo',data:months.map(m=>m.active),borderWidth:2,tension:.25}]},{});
  makeChart('salesChart','bar',{labels:months.map(m=>m.label),datasets:[{label:'Vendas',data:months.map(m=>m.vendas),yAxisID:'y'},{label:'Conversão %',data:months.map(m=>m.conv*100),type:'line',yAxisID:'y1',borderWidth:2,tension:.25}]},{scales:{x:{ticks:{color:'#94a3b8'},grid:{color:'rgba(148,163,184,.08)'}},y:{position:'left',ticks:{color:'#94a3b8'},grid:{color:'rgba(148,163,184,.10)'}},y1:{position:'right',ticks:{color:'#94a3b8',callback:v=>v+'%'},grid:{drawOnChartArea:false}}}});
  const raw=filteredRanking(role,s,e,status), eligible=raw.filter(a=>a.tours>=30).sort((a,b)=>b.conv-a.conv), topVgv=[...raw].sort((a,b)=>b.vgv-a.vgv)[0], best=eligible[0], roleName=role==='liner'?'Liner':'Closer';
  const items=[
    `Filtro atual: <b>${statusLabel}</b>. Kimberly e Marcel não entram em nenhum ranking operacional.`,
    topVgv?`Maior VGV ${roleName} no filtro: <b>${TEAM_BY_NAME.get(topVgv.name)?.label||topVgv.name}</b> — ${fmtMoney(topVgv.vgv)}.`:'',
    best?`Melhor conversão com ≥30 atendimentos: <b>${TEAM_BY_NAME.get(best.name)?.label||best.name}</b> — ${fmtPct(best.conv)}.`:'',
    status==='active'&&role==='liner'?`A equipe ativa de Liners inclui <b>DANIELA (G4)</b>; ela aparece com “SEM DADOS” porque não há registro identificado no relatório KIM deste período.`:'',
    `Os KPIs e gráficos gerais acima continuam representando a <b>sala completa no período</b>; o filtro Ativos/Inativos atua no ranking operacional.`,
    `Conversão geral da sala no período: <b>${fmtPct(room.conv)}</b>, com ticket médio de <b>${fmtMoney(room.ticket)}</b>.`,
    e===META.maxMonth?`O último mês está parcial até <b>${META.partialEnd}</b>.`:''
  ].filter(Boolean);
  $('insights').innerHTML=items.map(x=>`<div class="insight">${x}</div>`).join('');
}
function reset(){ $('startMonth').value=META.minMonth;$('endMonth').value=META.maxMonth;$('staffStatus').value='active';$('search').value='';render()}
['startMonth','endMonth','role','staffStatus','sortMetric','search'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',render));$('reset').addEventListener('click',reset);
$('startMonth').min=META.minMonth;$('startMonth').max=META.maxMonth;$('endMonth').min=META.minMonth;$('endMonth').max=META.maxMonth;renderGroups();reset();
