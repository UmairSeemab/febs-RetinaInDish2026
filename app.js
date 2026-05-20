const state={meta:null,week:[],program:[],abstracts:[],participants:[],speakers:[],sponsors:[]};
const $=id=>document.getElementById(id); const norm=s=>(s||'').toString().toLowerCase();
let countryChart=null;
let speakerCountryChart=null;
async function load(){for(const k of Object.keys(state)){state[k]=await fetch(`data/${k}.json`).then(r=>r.json())}renderAll()}
function renderAll(){
 $('eventTitle').textContent=state.meta.title; $('eventSub').textContent=`${state.meta.subtitle} • ${state.meta.location} • ${state.meta.dates}`;
 const allCountries=new Set([...state.participants.map(p=>p.country).filter(Boolean),...state.speakers.map(p=>p.country).filter(Boolean)]);
 $('overview').innerHTML=[['Program items',state.program.length],['Poster abstracts',state.abstracts.length],['Speakers',state.speakers.length],['Participants',state.participants.length],['Countries',allCountries.size]].map(x=>`<div class="card"><h3>${x[1]}</h3><p>${x[0]}</p></div>`).join('');
 $('week').innerHTML=state.week.map(w=>`<div class="daybox"><div><b>${w.day}</b><br><span class="muted">${w.date}</span></div><div><b>${w.what}</b><p>${w.morning_afternoon||''}</p><span class="badge">${w.evening||'Course program'}</span></div></div>`).join('');
 initFilters(); renderProgram(); renderSpeakers(); renderSpeakerCountryChart(); renderAbstracts(); renderParticipants(); renderCountryChart(); renderSponsors();
}
function initFilters(){
 $('dayFilter').innerHTML='<option value="">All days</option>'+[...new Set(state.program.map(x=>x.day).filter(Boolean))].map(x=>`<option>${x}</option>`).join('');
 $('categoryFilter').innerHTML='<option value="">All categories</option>'+[...new Set(state.abstracts.map(x=>x.category).filter(Boolean))].sort().map(x=>`<option>${x}</option>`).join('');
 $('abstractDayFilter').innerHTML='<option value="">All presentation days</option>'+[...new Set(state.abstracts.map(x=>x.day).filter(Boolean))].sort().map(x=>`<option>${x}</option>`).join('');
 $('countryFilter').innerHTML='<option value="">All countries</option>'+[...new Set(state.participants.map(x=>x.country).filter(Boolean))].sort().map(x=>`<option>${x}</option>`).join('');
 $('speakerCountryFilter').innerHTML='<option value="">All countries</option>'+[...new Set(state.speakers.map(x=>x.country).filter(Boolean))].sort().map(x=>`<option>${x}</option>`).join('');
 ['programSearch','dayFilter'].forEach(id=>$(id).addEventListener('input',renderProgram));
 ['speakerSearch','speakerCountryFilter'].forEach(id=>$(id).addEventListener('input',()=>{renderSpeakers();renderSpeakerCountryChart()}));
 ['abstractSearch','categoryFilter','abstractDayFilter'].forEach(id=>$(id).addEventListener('input',renderAbstracts));
 ['participantSearch','countryFilter'].forEach(id=>$(id).addEventListener('input',()=>{renderParticipants();renderCountryChart()}));
 $('closeModal').onclick=()=>{$('modal').style.display='none'}; $('modal').onclick=e=>{if(e.target.id==='modal') $('modal').style.display='none'};
}
function renderProgram(){const q=norm($('programSearch').value), d=$('dayFilter').value; let data=state.program.filter(x=>(!d||x.day===d)&&norm(Object.values(x).join(' ')).includes(q)); let html='', cur=''; data.forEach(e=>{if(e.day!==cur){cur=e.day; html+=`<h3>${cur} <span class="muted">${e.date||''}</span></h3>`} html+=`<div class="event"><div class="time">${e.time||''}</div><h3>${e.session_type||e.topic||'Session'}</h3><p>${e.topic||''}</p><p class="muted">${e.speakers||''}</p></div>`}); $('programList').innerHTML=html||'<p>No matching sessions.</p>';}
function renderSpeakers(){const q=norm($('speakerSearch').value), c=$('speakerCountryFilter').value; let data=state.speakers.filter(p=>(!c||p.country===c)&&norm([p.name,p.country,p.role,p.profile_url].join(' ')).includes(q)); $('speakerList').innerHTML=data.map(p=>{const name=p.profile_url?`<a class="speaker-link" href="${p.profile_url}" target="_blank" rel="noopener noreferrer">${p.name}</a>`:p.name;return `<div class="person speaker-card"><h3>${name}</h3><p class="muted">${p.country||''}</p><span class="badge">${p.role||'Speaker'}</span>${p.profile_url?'<span class="profile-hint">Open profile ↗</span>':''}</div>`}).join('')||'<p>No matching speakers.</p>';}
function renderSpeakerCountryChart(){const q=norm($('speakerSearch').value), c=$('speakerCountryFilter').value; let data=state.speakers.filter(p=>(!c||p.country===c)&&norm([p.name,p.country,p.role].join(' ')).includes(q)); const counts={}; data.forEach(p=>{const country=p.country||'Unknown';counts[country]=(counts[country]||0)+1}); const labels=Object.keys(counts).sort(); const values=labels.map(x=>counts[x]); const ctx=$('speakerCountryChart'); if(ctx&&window.Chart){if(speakerCountryChart) speakerCountryChart.destroy(); speakerCountryChart=new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data:values}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}})} const summary=$('speakerCountrySummary'); if(summary){summary.innerHTML=labels.map(label=>`<span class="country-pill">${label}: ${counts[label]}</span>`).join('');}}

function renderAbstracts(){
 const q=norm($('abstractSearch').value), c=$('categoryFilter').value, d=$('abstractDayFilter').value;
 let data=state.abstracts.filter(a=>(!c||a.category===c)&&(!d||a.day===d)&&norm([a.title,a.presenter,a.affiliation,a.authors,a.category,a.day,a.abstract_text].join(' ')).includes(q));
 $('abstractCount').textContent=`${data.length} abstracts shown`;
 const topicCounts={}; const dayCounts={};
 data.forEach(a=>{topicCounts[a.category]=(topicCounts[a.category]||0)+1; dayCounts[a.day]=(dayCounts[a.day]||0)+1});
 $('abstractSummary').innerHTML=`<div class="summary-line"><b>Topics:</b> ${Object.keys(topicCounts).sort().map(k=>`<span class="filter-pill">${k}: ${topicCounts[k]}</span>`).join('')}</div><div class="summary-line"><b>Days:</b> ${Object.keys(dayCounts).sort().map(k=>`<span class="filter-pill">${k}: ${dayCounts[k]}</span>`).join('')}</div>`;
 $('abstractList').innerHTML=data.map(a=>`<article class="card abstract-card" onclick="openAbstract('${a.id}')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') openAbstract('${a.id}')"><div class="abstract-top"><span class="badge day-badge">${a.day||'Day TBC'}</span><span class="badge category-badge">${a.category||'Uncategorised'}</span></div><h3>${a.title}</h3><div class="presenter-block"><p><b>Presenter:</b> ${a.presenter||'Not listed'}</p><p class="muted"><b>Affiliation:</b> ${a.affiliation||'Not listed'}</p></div><p class="open-hint">Open full abstract PDF ↗</p></article>`).join('')||'<p>No matching abstracts.</p>';
}
function openAbstract(id){
 const a=state.abstracts.find(x=>x.id===id);
 if(a&&a.file){window.open(a.file,'_blank','noopener,noreferrer');}
}
function renderParticipants(){const q=norm($('participantSearch').value), c=$('countryFilter').value; let data=state.participants.filter(p=>(!c||p.country===c)&&norm([p.name,p.country,p.role].join(' ')).includes(q)); $('participantList').innerHTML=data.map(p=>`<div class="person"><h3>${p.name}</h3><p class="muted">${p.country||''}</p><span class="badge">${p.role}</span></div>`).join('')||'<p>No matching participants.</p>';}
function renderCountryChart(){const q=norm($('participantSearch').value), c=$('countryFilter').value; let data=state.participants.filter(p=>(!c||p.country===c)&&norm([p.name,p.country,p.role].join(' ')).includes(q)); const counts={}; data.forEach(p=>{const country=p.country||'Unknown';counts[country]=(counts[country]||0)+1}); const labels=Object.keys(counts).sort(); const values=labels.map(x=>counts[x]); const ctx=$('countryChart'); if(ctx&&window.Chart){if(countryChart) countryChart.destroy(); countryChart=new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data:values}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}})} $('countrySummary').innerHTML=labels.map(label=>`<span class="country-pill">${label}: ${counts[label]}</span>`).join('');}
function renderSponsors(){ $('sponsorList').innerHTML=state.sponsors.map(s=>`<div class="sponsor"><img src="${s.logo}" alt="${s.name}"><h3>${s.name}</h3><span class="badge">${s.level}</span></div>`).join('')||'<p>Sponsor logos can be added in assets/logos.</p>';}
function escapeHtml(s){return (s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
load();
