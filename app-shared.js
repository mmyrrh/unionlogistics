// 편집화면(inventory-weekly.html)과 뷰어(team1-view.html, team2-view.html)가 공용으로 쓰는 로직

const WEEKDAYS = ['월','화','수','목','금','토'];

const DEFAULT_MATERIALS = {
  team1: ['P/C(고)','유연탄(러)','하소실리카','불화칼슘','폐촉매','재생연료유','DEG','납석','규석'],
  team2: ['생석회','소석회','U-1','U-2','하소실리카','GEO-CSA','무수석고']
};
const WEIGHT_PER_UNIT = {
  '하소실리카':27, '불화칼슘':20, '폐촉매':30, 'DEG':2, '납석':30, '규석':30,
  '생석회':26, '소석회':26, 'U-1':20
};
const DEFAULT_WEIGHT = 25;
function weightFor(mat){ return WEIGHT_PER_UNIT.hasOwnProperty(mat) ? WEIGHT_PER_UNIT[mat] : DEFAULT_WEIGHT; }

function getMonday(d){
  const nd = new Date(d);
  const day = nd.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nd.setDate(nd.getDate() + diff);
  nd.setHours(0,0,0,0);
  return nd;
}
function fmtDayOnly(d){ return String(d.getDate()).padStart(2,'0'); }
function weekKey(m){
  return `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}-${String(m.getDate()).padStart(2,'0')}`;
}
function weekLabelText(m){
  const end = new Date(m); end.setDate(end.getDate()+5);
  return `${m.getFullYear()}년 ${m.getMonth()+1}월 ${m.getDate()}일 ~ ${end.getMonth()+1}월 ${end.getDate()}일`;
}
function dayDate(monday, idx){ const d = new Date(monday); d.setDate(d.getDate()+idx); return d; }

// 뷰어 기본 주차: 금요일부터 다음 주(월~토)를 표시한다.
// 예) 2026-09-11(금) → 2026-09-14(월) ~ 09-19(토)
function getViewerDefaultMonday(d = new Date()){
  const base = getMonday(d);
  const day = new Date(d).getDay();
  if(day === 5 || day === 6 || day === 0) base.setDate(base.getDate() + 7);
  return base;
}

function shiftWeek(monday, amount){
  const next = new Date(monday);
  next.setDate(next.getDate() + amount * 7);
  return next;
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---- Supabase client ----
// supabase-config.js 와 https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 스크립트를
// 이 파일보다 먼저 <head>/<body>에서 로드해야 합니다.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- materials 테이블 ----
async function fetchMaterials(team){
  const { data, error } = await supabaseClient
    .from('materials').select('id,name,sort_order')
    .eq('team', team).order('sort_order', { ascending: true });
  if(error){ console.error(error); return []; }
  return data || [];
}
async function seedMaterialsIfEmpty(team){
  const list = await fetchMaterials(team);
  if(list.length > 0) return list;
  const defaults = DEFAULT_MATERIALS[team].map((name, idx) => ({ team, name, sort_order: idx }));
  const { error } = await supabaseClient.from('materials').insert(defaults);
  if(error){ console.error(error); }
  return fetchMaterials(team);
}
async function insertMaterial(team, name, sortOrder){
  const { error } = await supabaseClient.from('materials').insert({ team, name, sort_order: sortOrder });
  if(error) console.error(error);
}
async function deleteMaterial(id){
  const { error } = await supabaseClient.from('materials').delete().eq('id', id);
  if(error) console.error(error);
}
async function updateMaterialOrder(id, sortOrder){
  const { error } = await supabaseClient.from('materials').update({ sort_order: sortOrder }).eq('id', id);
  if(error) console.error(error);
}

// ---- entries 테이블 ----
async function fetchEntries(team, week){
  const { data, error } = await supabaseClient
    .from('entries').select('id,material,day_index,amount')
    .eq('team', team).eq('week', week);
  if(error){ console.error(error); return []; }
  return data || [];
}
async function insertEntry(team, week, material, dayIndex, amount){
  const { error } = await supabaseClient.from('entries')
    .insert({ team, week, material, day_index: dayIndex, amount });
  if(error) console.error(error);
}
async function deleteEntry(id){
  const { error } = await supabaseClient.from('entries').delete().eq('id', id);
  if(error) console.error(error);
}

// entries 배열을 { material: { dayIndex: [{id,amount}, ...] } } 형태로 재구성
function groupEntries(rows){
  const grouped = {};
  rows.forEach(r => {
    if(!grouped[r.material]) grouped[r.material] = {};
    if(!grouped[r.material][r.day_index]) grouped[r.material][r.day_index] = [];
    grouped[r.material][r.day_index].push({ id: r.id, amount: r.amount });
  });
  return grouped;
}
function sumForMaterial(grouped, mat){
  const row = grouped[mat];
  if(!row) return 0;
  let total = 0;
  Object.values(row).forEach(arr => arr.forEach(e => total += e.amount));
  return total;
}

// team 하나에 대한 실시간 구독 (entries/materials 변경 시 onChange 호출)
function subscribeTeam(team, onChange){
  const channel = supabaseClient.channel('inv-' + team + '-' + Math.random().toString(36).slice(2));
  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'entries', filter: `team=eq.${team}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'materials', filter: `team=eq.${team}` }, onChange)
    .subscribe();
  return channel;
}
