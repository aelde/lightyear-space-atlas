import { landmarks, learningNotes } from './landmarks.js?v=3';

const $ = (selector) => document.querySelector(selector);
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const cleanThai = (value) => value.replace(/\. /g, ' ').replace(/\.$/, '');
const crops = {oort:[24,300],interstellar:[352,300],centauri:[684,300],barnard:[24,574],luhman:[352,574],sirius:[684,574],vega:[24,906],pleiades:[352,906],orion:[684,906],sagittarius:[24,1189],lmc:[352,1189],andromeda:[684,1189]};
const wideAssets = {centauri:'proxima-wide.jpg',barnard:'proxima-wide.jpg',luhman:'luhman-wide.jpg',sirius:'sirius-wide.jpg',vega:'vega-wide.jpg',pleiades:'pleiades-wide.jpg',orion:'orion-wide.jpg',sagittarius:'sagittarius-wide.jpg',lmc:'lmc-wide.jpg',andromeda:'andromeda-wide.jpg'};

function illustration(id) {
  if (wideAssets[id]) return `<img class="card-photo" src="./assets/${wideAssets[id]}" alt="" loading="lazy" decoding="async">`;
  const [x,y] = crops[id];
  return `<div class="atlas-art" style="--crop-x:${-x / 318 * 100}%;--crop-y:${-y / 175 * 100}%"><img src="./assets/landmarks-poster.png" width="1024" height="1536" alt="" loading="lazy" decoding="async"></div>`;
}

let activeFilter = 'all';
let selectedId = 'centauri';
const grid = $('#landmark-grid');
const resultsStatus = document.createElement('p');
resultsStatus.className = 'visually-hidden';
resultsStatus.setAttribute('role','status');
resultsStatus.setAttribute('aria-live','polite');
grid.before(resultsStatus);
const selectedCollection = () => landmarks.filter(item => activeFilter === 'all' || item.chapter === activeFilter);

function sceneMarkup(id) {
  if (wideAssets[id]) return `<img src="./assets/${wideAssets[id]}" alt="" decoding="async">`;
  if (id === 'oort') return '<div class="oort-model"><b class="sun"></b><i></i><i></i><i></i><i></i><i></i><span>SUN</span></div>';
  if (id === 'interstellar') return '<div class="void-model">2—3<span>LIGHT-YEARS OF QUIET</span></div>';
  return `<div class="specimen-illustration">${illustration(id)}</div>`;
}

export function selectExhibit(id, announce = true) {
  const item = landmarks.find(entry => entry.id === id);
  if (!item) return;
  selectedId = id;
  const collection = selectedCollection();
  const filteredIndex = collection.findIndex(entry => entry.id === id);
  const globalIndex = landmarks.indexOf(item);
  $('#exhibit-scene').innerHTML = sceneMarkup(id);
  $('#exhibit-stage').style.setProperty('--scene-color',item.color);
  $('#exhibit-index').textContent = `${String(globalIndex+1).padStart(2,'0')} / 12`;
  $('#exhibit-kicker').textContent = item.kicker;
  $('#exhibit-name').textContent = item.name;
  $('#exhibit-thai').textContent = item.thaiName;
  $('#exhibit-distance').textContent = item.distanceLabel.replace('ประมาณ ','').replace(' ปีแสง','');
  $('#exhibit-description').textContent = cleanThai(item.description.split('. ')[0]);
  $('#exhibit-detail').dataset.open = id;
  $('#exhibit-caption').textContent = id === 'oort' ? 'แผนภาพของบริเวณที่คาดว่ามีอยู่ · ยังไม่เห็นโดยตรง' : id === 'barnard' ? 'ภาพจำลองชนิดดาวแคระแดง · ไม่ตามมาตราส่วน' : 'ภาพจำลอง · สี ขนาด และระยะห่างไม่ตามจริง';
  $('#exhibit-prev').disabled = filteredIndex <= 0;
  $('#exhibit-next').disabled = filteredIndex === collection.length-1;
  document.querySelectorAll('.rail-stop').forEach(button => {
    const selected = button.dataset.select === id;
    button.classList.toggle('is-selected',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
  if (announce) resultsStatus.textContent = `${item.name} ${item.distanceLabel}`;
  if (announce) document.dispatchEvent(new CustomEvent('exhibitselect', {detail:id}));
}

function renderCollection(filter = 'all') {
  activeFilter = filter;
  const collection = selectedCollection();
  grid.innerHTML = collection.map(item => {
    const index = landmarks.indexOf(item) + 1;
    return `<button class="rail-stop" type="button" data-select="${item.id}" aria-pressed="false" aria-label="สำรวจ ${escapeHtml(item.name)} ${escapeHtml(item.distanceLabel)}"><span class="rail-number">${String(index).padStart(2,'0')}</span><strong>${escapeHtml(item.name)}</strong><span class="rail-distance">${escapeHtml(item.distanceLabel.replace('ประมาณ ',''))}</span></button>`;
  }).join('');
  document.querySelectorAll('.filter-button').forEach(button => {
    const active = button.dataset.filter === activeFilter;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  if (!collection.some(item => item.id === selectedId)) selectedId = collection[0].id;
  selectExhibit(selectedId,false);
  resultsStatus.textContent = `แสดง ${collection.length} จุดหมาย ${filter === 'near' ? 'ในช่วง 1–10 ปีแสง' : filter === 'far' ? 'ที่ไกลออกไป' : 'ทั้งหมด'}`;
}
document.querySelectorAll('.filter-button').forEach(button => button.addEventListener('click',() => renderCollection(button.dataset.filter)));
grid.addEventListener('click',event => {const button = event.target.closest('[data-select]');if(button)selectExhibit(button.dataset.select);});
function stepExhibit(offset) {const items=selectedCollection();const index=items.findIndex(item=>item.id===selectedId);const next=items[index+offset];if(next)selectExhibit(next.id);}
$('#exhibit-prev').addEventListener('click',()=>stepExhibit(-1));
$('#exhibit-next').addEventListener('click',()=>stepExhibit(1));
$('#exhibit-stage').addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();stepExhibit(1);}else if(event.key==='ArrowLeft'){event.preventDefault();stepExhibit(-1);}});
renderCollection();

$('#learning-grid').innerHTML = learningNotes.map((note,index) => `<article class="learning-item reveal"><span class="learning-index">0${index+1} / ${['DISTANCE','DIRECTION','IMAGINATION'][index]}</span><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(cleanThai(note.text))}</p>${note.sources.map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)} ↗</a>`).join('')}</article>`).join('');
$('#source-list').innerHTML = landmarks.map(item => `<a href="${escapeHtml(item.sources[0].url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)}<span>${item.sources[0].title.startsWith('ESO') ? 'ESO' : 'NASA'} ↗</span></a>`).join('');

function renderRadiusChips(radius) {
  const nearby = landmarks.filter(item => item.chapter === 'near' && item.category !== 'region' && item.distance <= radius);
  $('#radius-chips').innerHTML = nearby.map(item => `<button class="radius-chip" type="button" data-open="${item.id}">${escapeHtml(item.id === 'centauri' ? 'Proxima / Alpha Centauri' : item.name)} ↗</button>`).join('');
}
document.addEventListener('radiuschange',event=>renderRadiusChips(event.detail));
renderRadiusChips(Number($('#radius-slider').value));

const dialog = $('#landmark-dialog');
let dialogItemIndex = 0;
let lastFocus = null;
function renderDetail(index) {
  dialogItemIndex = index;
  const item = landmarks[index];
  $('#dialog-art').innerHTML = illustration(item.id);
  $('#dialog-kicker').textContent = item.kicker;
  $('#dialog-name').textContent = item.name;
  $('#dialog-thai').textContent = item.thaiName;
  $('#dialog-distance').textContent = item.distanceLabel;
  $('#dialog-description').textContent = cleanThai(item.description);
  $('#dialog-fact').textContent = cleanThai(item.fact);
  $('#dialog-sources').innerHTML = item.sources.map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)} ↗</a>`).join('');
  $('#dialog-index').textContent = `${String(index+1).padStart(2,'0')} / 12`;
  $('#dialog-prev').disabled = index === 0;
  $('#dialog-next').disabled = index === landmarks.length-1;
  dialog.scrollTop = 0;
}
export function openDetail(id) {
  const index = landmarks.findIndex(item => item.id === id);
  if (index < 0) return;
  lastFocus = document.activeElement;
  renderDetail(index);
  dialog.showModal();
  document.body.classList.add('dialog-open');
  $('#dialog-close').focus({preventScroll:true});
}
document.addEventListener('click', event => {
  const opener = event.target.closest('[data-open]');
  if (opener) openDetail(opener.dataset.open);
});
$('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click',event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {document.body.classList.remove('dialog-open');lastFocus?.focus({preventScroll:true});});
$('#dialog-prev').addEventListener('click',() => {if(dialogItemIndex>0){renderDetail(dialogItemIndex-1);$('#dialog-name').focus({preventScroll:true});}});
$('#dialog-next').addEventListener('click',() => {if(dialogItemIndex<landmarks.length-1){renderDetail(dialogItemIndex+1);$('#dialog-name').focus({preventScroll:true});}});

const menuButton = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function closeMenu(){mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','เปิดเมนู');}
menuButton.addEventListener('click', () => {const open=mobileNav.hidden;mobileNav.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'ปิดเมนู':'เปิดเมนู');});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {if(event.key==='Escape')closeMenu();});
window.addEventListener('resize',()=>{if(window.innerWidth>640)closeMenu();},{passive:true});

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}}),{threshold:.1});
  document.documentElement.classList.add('js');
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
}
const header = $('#site-header');
const updateHeader=()=>header.classList.toggle('is-scrolled',window.scrollY>30);
window.addEventListener('scroll',updateHeader,{passive:true});
updateHeader();
if ('IntersectionObserver' in window) {
  const navObserver=new IntersectionObserver(entries => {entries.forEach(entry => {if(entry.isIntersecting){document.querySelectorAll('.desktop-nav a').forEach(link=>{if(link.hash === `#${entry.target.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}});},{rootMargin:'-25% 0px -50% 0px',threshold:0});
  ['distance','landmarks','understand'].forEach(id=>navObserver.observe(document.getElementById(id)));
}
