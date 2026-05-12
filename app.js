const state={meta:null,week:[],program:[],abstracts:[],participants:[],sponsors:[]};
let countryChartInstance=null;
const $=id=>document.getElementById(id); const norm=s=>(s||'').toString().toLowerCase();
async function load(){for(const k of Object.keys(state)){state[k]=await fetch(`data/${k}.json`).then(r=>r.json())}renderAll()}
function renderAll(){
 $('eventTitle').textContent=state.meta.title; $('eventSub').textContent=`${state.meta.subtitle} • ${state.meta.location} • ${state.meta.dates}`;
 $('overview').innerHTML=[['Program items',state.program.length],['Poster abstracts',state.abstracts.length],['Participants',state.participants.length],['Countries',[...new Set(state.participants.map(p=>p.country).filter(Boolean))].length]].map(x=>`<div class="card"><h3>${x[1]}</h3><p>${x[0]}</p></div>`).join('');
 $('week').innerHTML=state.week.map(w=>`<div class="daybox"><div><b>${w.day}</b><br><span class="muted">${w.date}</span></div><div><b>${w.what}</b><p>${w.morning_afternoon||''}</p><span class="badge">${w.evening||'Course program'}</span></div></div>`).join('');
 initFilters(); renderProgram(); renderAbstracts(); renderParticipants(); renderCountryChart(); renderSponsors();
}
function initFilters(){
 $('dayFilter').innerHTML='<option value="">All days</option>'+[...new Set(state.program.map(x=>x.day).filter(Boolean))].map(x=>`<option>${x}</option>`).join('');
 $('categoryFilter').innerHTML='<option value="">All categories</option>'+[...new Set(state.abstracts.map(x=>x.category).filter(Boolean))].sort().map(x=>`<option>${x}</option>`).join('');
 $('countryFilter').innerHTML='<option value="">All countries</option>'+[...new Set(state.participants.map(x=>x.country).filter(Boolean))].sort().map(x=>`<option>${x}</option>`).join('');
 ['programSearch','dayFilter'].forEach(id=>$(id).addEventListener('input',renderProgram));
 ['abstractSearch','categoryFilter'].forEach(id=>$(id).addEventListener('input',renderAbstracts));
 ['participantSearch','countryFilter'].forEach(id=>$(id).addEventListener('input',renderParticipants));
 $('closeModal').onclick=()=>{$('modal').style.display='none'}; $('modal').onclick=e=>{if(e.target.id==='modal') $('modal').style.display='none'};
}
function renderProgram(){const q=norm($('programSearch').value), d=$('dayFilter').value; let data=state.program.filter(x=>(!d||x.day===d)&&norm(Object.values(x).join(' ')).includes(q));
 let html='', cur=''; data.forEach(e=>{if(e.day!==cur){cur=e.day; html+=`<h3>${cur} <span class="muted">${e.date||''}</span></h3>`} html+=`<div class="event"><div class="time">${e.time||''}</div><h3>${e.session_type||e.topic||'Session'}</h3><p>${e.topic||''}</p><p class="muted">${e.speakers||''}</p></div>`}); $('programList').innerHTML=html||'<p>No matching sessions.</p>';}
function renderAbstracts(){const q=norm($('abstractSearch').value), c=$('categoryFilter').value; let data=state.abstracts.filter(a=>(!c||a.category===c)&&norm([a.title,a.authors,a.category,a.abstract_text].join(' ')).includes(q)); $('abstractCount').textContent=`${data.length} abstracts shown`; $('abstractList').innerHTML=data.map(a=>`<div class="card abstract-card" onclick="openAbstract('${a.id}')"><span class="badge">${a.type}</span><span class="badge">${a.category}</span><h3>${a.number}. ${a.title}</h3><p class="muted">${a.authors||''}</p></div>`).join('')||'<p>No matching abstracts.</p>';}
function openAbstract(id){const a=state.abstracts.find(x=>x.id===id); $('modalContent').innerHTML=`<span class="badge">${a.category}</span><h2>${a.title}</h2><p class="muted">${a.authors||''}</p><div class="abstract-text">${escapeHtml(a.abstract_text)}</div><a class="download" href="${a.file}" target="_blank">Open original file</a>`; $('modal').style.display='block'}
function renderParticipants(){const q=norm($('participantSearch').value), c=$('countryFilter').value; let data=state.participants.filter(p=>(!c||p.country===c)&&norm([p.name,p.country,p.role].join(' ')).includes(q)); $('participantList').innerHTML=data.map(p=>`<div class="person"><h3>${p.name}</h3><p class="muted">${p.country||''}</p><span class="badge">${p.role}</span></div>`).join('')||'<p>No matching participants.</p>';}

function renderCountryChart(){
 const canvas=$('countryChart');
 if(!canvas || typeof Chart==='undefined') return;
 const counts={};
 state.participants.forEach(p=>{
  const country=(p.country||'Unknown').trim()||'Unknown';
  counts[country]=(counts[country]||0)+1;
 });
 const labels=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||a.localeCompare(b));
 const values=labels.map(x=>counts[x]);
 if(countryChartInstance) countryChartInstance.destroy();
 countryChartInstance=new Chart(canvas,{
  type:'pie',
  data:{labels:labels,datasets:[{data:values}]},
  options:{
   responsive:true,
   maintainAspectRatio:false,
   plugins:{
    legend:{position:'bottom'},
    tooltip:{callbacks:{label:function(ctx){const total=values.reduce((a,b)=>a+b,0); const value=ctx.parsed; const pct=total?((value/total)*100).toFixed(1):0; return `${ctx.label}: ${value} participant${value===1?'':'s'} (${pct}%)`;}}}
   }
  }
 });
 const summary=$('countrySummary');
 if(summary){
  summary.innerHTML=labels.map(country=>`<span class="country-pill"><b>${country}</b> ${counts[country]}</span>`).join('');
 }
}

function renderSponsors(){ $('sponsorList').innerHTML=state.sponsors.map(s=>`<div class="sponsor"><img src="${s.logo}" alt="${s.name}"><h3>${s.name}</h3><span class="badge">${s.level}</span></div>`).join('')||'<p>Sponsor logos can be added in assets/logos.</p>';}
function escapeHtml(s){return (s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
load();