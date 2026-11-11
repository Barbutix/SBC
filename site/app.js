const newsSources = [
  {name:'Fédération Française de Darts',format:'Acier',type:'Fédération',description:'Actualités, calendrier, résultats et classements des compétitions françaises.',url:'https://www.ffdarts.fr/'},
  {name:'PDC',format:'Acier',type:'Circuit professionnel',description:'Le circuit professionnel international : grandes compétitions, joueurs, actualités et résultats.',url:'https://www.pdc.tv/news/'},
  {name:'World Darts Federation',format:'Acier',type:'Fédération',description:'Tournois, calendrier et classements du circuit WDF.',url:'https://dartswdf.com/'},
  {name:'International Dart Federation',format:'Soft-tip',type:'Fédération',description:'Compétitions internationales et classements de fléchettes électroniques.',url:'https://www.idfdarts.org/'},
  {name:'Phoenix France Compétition',format:'Soft-tip',type:'Circuit français',description:'Championnats électroniques en France, calendriers et classements par poule.',url:'https://phoenixfrancecompetition.fr/'},
  {name:'DartsNews',format:'Média',type:'Média spécialisé',description:'Veille éditoriale anglophone sur les circuits et les joueurs.',url:'https://dartsnews.com/'}
];

const eventSources = [
  {name:'Calendrier FFD, ligues et comités',format:'Acier',category:'Fédéral / circuit',area:'France · calendrier officiel par club et par date',description:'Opens fédéraux, événements de ligue et de comité, avec le club et la ville hôtes.',url:'https://compet.dartshub.fr/',source:'DartsHub',departmentSearch:true},
  {name:'DartsMap · carte des tournois',format:'Acier + Soft-tip',category:'Club / loisir',area:'France · recherche par région, ville et date',description:'Calendrier collaboratif qui rassemble tournois, clubs et bars; les organisateurs peuvent proposer leurs événements.',url:'https://dartsmap.fr/',source:'DartsMap',departmentSearch:true},
  {name:'Ti an Darts · affiches par mois et département',format:'Soft-tip',category:'Club / loisir',area:'France · affiches classées par département',description:'Relais régulier d’affiches de tournois électroniques, reprises depuis les réseaux Univers Darts.',url:'https://tiandarts.fr/tournois-flechettes-electros/',source:'Ti an Darts',departmentSearch:true,socials:[{name:'Facebook · Univers Darts',url:'https://www.facebook.com/groups/869524631311158/'},{name:'Instagram · Univers Darts',url:'https://www.instagram.com/universdarts/'}]},
  {name:'Calendrier° · filtre par département',format:'Acier + Soft-tip',category:'Club / loisir',area:'France · départements 01 à 95, 2A et 2B',description:'Calendrier communautaire avec filtres par discipline, dates et département; chacun peut y proposer un tournoi.',url:'https://calendrier.tournois-apps.com/',source:'Tournois°',departmentSearch:true},
  {name:'Dartzen · calendrier et propositions de clubs',format:'Acier',category:'Club / loisir',area:'France · événements fédéraux et annonces de clubs',description:'Calendrier national et formulaire pour proposer un tournoi de club à vérifier avant publication.',url:'https://dartzen.com/tournois-flechettes-a-venir-france/',source:'Dartzen'},
  {name:'Championnats Phoenix',format:'Soft-tip',category:'Fédéral / circuit',area:'France · ligues et poules',description:'Calendriers et classements des championnats Phoenix, mis à jour chaque nuit.',url:'https://phoenixfrancecompetition.fr/calendriers/',source:'Phoenix France'},
  {name:'DARTSLIVE OPEN',format:'Soft-tip',category:'Fédéral / circuit',area:'International · étapes par ville',description:'Annonces d’étapes, inscriptions, tableaux et résultats des tournois DARTSLIVE OPEN.',url:'https://www.dartslive-open.jp/',source:'DARTSLIVE'},
  {name:'Tournois de clubs et associations',format:'Acier + Soft-tip',category:'Club / loisir',area:'France · annonces et inscriptions associatives',description:'Inscriptions créées par les associations organisatrices; vérifie que l’annonce concerne bien les fléchettes.',url:'https://www.helloasso.com/',source:'HelloAsso'}
];

const featuredProducts = [
  {name:'Harrows Supergrip 23 g',shop:'Olie’s Darts',kind:'Fléchettes acier · 90 % tungstène',description:'Jeu complet avec tiges, ailettes et mini étui. Barrels de 50 mm.',image:'https://www.olies-darts.com/12191-large_default/supergrip-en-23g.jpg',url:'https://www.olies-darts.com/jeux-harrows/515-supergrip-en-23g.html'},
  {name:'Mission Torus 120°',shop:'Pleine Bull',kind:'Éclairage de cible',description:'Anneau LED 120° pour éclairer la cible et limiter les zones d’ombre.',image:'https://pleinebull.fr/cdn/shop/files/eclairage-cible-mission-torus-120deg-noir.webp?v=1778159145&width=1780',url:'https://pleinebull.fr/products/eclairage-cible-mission-torus-120deg-noir'},
  {name:'KOTO Royal 580',shop:'Dartshopper',kind:'Cible électronique · soft-tip',description:'Jusqu’à 8 joueurs, 36 jeux et 580 variations. Fléchettes à pointe plastique uniquement.',image:'https://images.cdn.europe-west1.gcp.commercetools.com/7c0e4c3f-dc4f-43e6-99b2-3f02d41d5df2/img-lrkuDwg2-zoom.jpg',url:'https://www.dartshopper.fr/cible-flechette-electronique-koto-royal-580/'}
];

let activeNewsFilter = 'Tout';
let activeEventFilter = 'Tous';
let selectedFormats = ['Acier','Soft-tip'];
let pendingInstall;

const formatClass = format => format === 'Soft-tip' ? 'soft' : format === 'Média' ? 'media' : '';
const newsGrid = document.querySelector('#news-grid');
const eventGrid = document.querySelector('#event-grid');
const productGrid = document.querySelector('#product-grid');

function renderNews(){
  const rows = newsSources.filter(item => {
    const formatMatch = item.format === 'Média' || selectedFormats.includes(item.format) || item.format === 'Acier + Soft-tip';
    const filterMatch = activeNewsFilter === 'Tout' || item.format === activeNewsFilter || (activeNewsFilter === 'Média' && item.format === 'Média');
    return formatMatch && filterMatch;
  });
  newsGrid.innerHTML = rows.map(item => `<article class="source-card">
    <div class="source-top"><span class="source-badge ${formatClass(item.format)}">${item.format.toUpperCase()}</span><span class="verify-state">${item.type}</span></div>
    <h3>${item.name}</h3><p>${item.description}</p><a class="source-link" href="${item.url}" target="_blank" rel="noopener">Voir les dernières infos <span>↗</span></a>
  </article>`).join('') || '<div class="no-results">Aucune source dans cette sélection.</div>';
}

function renderEvents(){
  const query = document.querySelector('#department-search').value.trim().toLocaleLowerCase('fr');
  const departmentCode = /^(?:\d{2}|2a|2b|97[1-6])$/.test(query.replace(/\s/g,''));
  const rows = eventSources.filter(item => {
    const formatMatch = item.format === 'Acier + Soft-tip' || selectedFormats.includes(item.format);
    const categoryMatch = activeEventFilter === 'Tous' || item.category === activeEventFilter;
    const queryMatch = !query || (departmentCode && item.departmentSearch) || `${item.area} ${item.description} ${item.name} ${item.source}`.toLocaleLowerCase('fr').includes(query);
    return formatMatch && categoryMatch && queryMatch;
  });
  eventGrid.innerHTML = rows.map(item => `<article class="event-card">
    <div class="event-card-head"><span class="event-type ${item.category === 'Club / loisir' ? 'community' : ''}">${item.category}</span><span class="verify-state">${item.format}</span></div>
    <h3>${item.name}</h3><div class="event-place">${item.area}</div><p class="event-description">${item.description}</p><div class="event-extra"><span>Source : ${item.source}</span><a href="${item.url}" target="_blank" rel="noopener">Consulter ↗</a></div>${item.socials?.length?`<div class="social-links">${item.socials.map(link=>`<a href="${link.url}" target="_blank" rel="noopener">${link.name} ↗</a>`).join('')}</div>`:''}
  </article>`).join('') || '<div class="no-results">Aucune source ne correspond à cette recherche.</div>';
}

function renderProducts(){
  productGrid.innerHTML = featuredProducts.map(item => `<article class="product-card">
    <a class="product-visual" href="${item.url}" target="_blank" rel="noopener" aria-label="Voir ${item.name} chez ${item.shop}"><img src="${item.image}" alt="${item.name}" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true"></a>
    <div class="product-content"><span class="product-kind">${item.kind}</span><h3>${item.name}</h3><p>${item.description}</p><span class="product-shop">${item.shop}</span><a class="product-link" href="${item.url}" target="_blank" rel="noopener">Consulter chez ${item.shop} <span>↗</span></a></div>
  </article>`).join('');
}

function toast(message){
  const node = document.querySelector('#toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(()=>node.classList.remove('show'),2600);
}

renderNews(); renderEvents(); renderProducts();
document.querySelectorAll('#news-filters .pill').forEach(button=>button.addEventListener('click',()=>{
  document.querySelector('#news-filters .active')?.classList.remove('active'); button.classList.add('active'); activeNewsFilter=button.dataset.filter; renderNews();
}));
document.querySelectorAll('#event-filters .pill').forEach(button=>button.addEventListener('click',()=>{
  document.querySelector('#event-filters .active')?.classList.remove('active'); button.classList.add('active'); activeEventFilter=button.dataset.eventFilter; renderEvents();
}));
document.querySelector('#department-search').addEventListener('input',renderEvents);
document.querySelector('#discipline-toggle').addEventListener('click',()=>document.querySelector('#discipline-dialog').showModal());
document.querySelector('#save-disciplines').addEventListener('click',()=>{
  selectedFormats=[...document.querySelectorAll('.discipline-options input:checked')].map(input=>input.value);
  const label=selectedFormats.length===2?'ACIER + SOFT-TIP':selectedFormats[0]?.toUpperCase()||'CHOISIR';
  document.querySelector('#discipline-toggle').innerHTML=`${label} <span>⌄</span>`; renderNews(); renderEvents();
});
document.querySelector('#search-button').addEventListener('click',()=>document.querySelector('#search-dialog').showModal());
document.querySelector('#run-search').addEventListener('click',()=>{
  const term=document.querySelector('#global-search').value.trim();
  if(!term)return;
  document.querySelector('#department-search').value=term; activeEventFilter='Tous'; document.querySelectorAll('#event-filters .pill').forEach(p=>p.classList.toggle('active',p.dataset.eventFilter==='Tous'));
  renderEvents(); document.querySelector('#tournois').scrollIntoView({behavior:'smooth'});
});
document.querySelector('#share-button').addEventListener('click',async()=>{
  try { if(navigator.share) await navigator.share({title:'Sullias Bull Club — Le monde des fléchettes',url:location.href}); else {await navigator.clipboard.writeText(location.href);toast('Lien Sullias Bull Club copié.');} }
  catch { toast('Tu peux partager SBC depuis le menu du navigateur.'); }
});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pendingInstall=event;document.querySelector('#install-button').hidden=false;});
document.querySelector('#install-button').addEventListener('click',async()=>{
  if(!pendingInstall){toast('Dans le menu Chrome, choisis « Ajouter à l’écran d’accueil ».');return;}
  pendingInstall.prompt(); await pendingInstall.userChoice; pendingInstall=null; document.querySelector('#install-button').hidden=true;
});
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
if(window.matchMedia('(display-mode: standalone)').matches) document.querySelector('#install-button').hidden=true;
document.querySelectorAll('.bottom-nav a').forEach(link=>link.addEventListener('click',()=>{
  document.querySelector('.bottom-nav .selected')?.classList.remove('selected'); link.classList.add('selected');
}));
