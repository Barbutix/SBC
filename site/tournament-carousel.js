(function (global) {
  'use strict';
  const ORIGIN = {latitude:47.7329, longitude:2.2885};
  const RADII = ['50','100','150','200','300','500','all'];
  const RANGE_KEY = 'sbc-tournament-radius-v1';
  const normalizeRadius = value => RADII.includes(String(value)) ? String(value) : '100';
  const REFRESH = 30 * 60 * 1000;
  const KEY = 'sbc-local-tournaments-v1';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function https(value) {try {return new URL(value).protocol === 'https:';} catch {return false;}}
  function day(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const part = type => parts.find(p => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function validDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
  }
  function distance(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180) return Infinity;
    const rad = Math.PI/180;
    const a = Math.sin((latitude-ORIGIN.latitude)*rad/2)**2 + Math.cos(ORIGIN.latitude*rad)*Math.cos(latitude*rad)*Math.sin((longitude-ORIGIN.longitude)*rad/2)**2;
    return 2 * 6371.0088 * Math.asin(Math.sqrt(Math.min(1,a)));
  }
  // Local discovery always includes both target types, regardless of the news filter.
  function select(events, today = day(), radius = '100', limit = 10) {
    radius = normalizeRadius(radius);
    const seen = new Set();
    return events.filter(event => {
      if (!event || !validDate(event.date) || !validDate(event.endDate || event.date) || (event.endDate || event.date) < event.date || (event.endDate || event.date) < today ||
          !['published','verified'].includes(event.status) || typeof event.name !== 'string' || !event.name.trim() || !https(event.url) || typeof event.source !== 'string' ||
          !Number.isFinite(distance(event.latitude,event.longitude)) || (event.countryCode && event.countryCode !== 'FR') || (radius === 'all' ? event.countryCode !== 'FR' : distance(event.latitude,event.longitude)>Number(radius))) return false;
      const key = event.date + '|' + event.url.replace(/\/$/,'');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(event => ({...event,distanceKm:distance(event.latitude,event.longitude)}))
      .sort((a,b) => a.date.localeCompare(b.date) || a.distanceKm-b.distanceKm || a.name.localeCompare(b.name,'fr')).slice(0,limit);
  }
  function valid(data) {return data?.schemaVersion === 1 && Array.isArray(data.events) && data.events.length <= 5000;}
  function formatLabel(value) {
    return ({'Acier':'Traditionnelles · pointe acier','Soft-tip':'Électroniques · pointe plastique','Acier + Soft-tip':'Acier et électroniques'})[value] || 'Type de cible à confirmer';
  }
  function dateLabel(value) {return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Paris'}).format(new Date(value+'T12:00:00+01:00'));}
  function renderCard(event, index, count) {
    const checked = typeof event.checkedAt === 'string' ? event.checkedAt.slice(0,10) : '';
    const poster = https(event.image) ? `<img class="nearby-poster" src="${escape(event.image)}" alt="Affiche : ${escape(event.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : '';
    return `<article class="nearby-slide" role="group" aria-roledescription="diapositive" aria-label="${index+1} sur ${count}" ${index?'hidden':''}>
      <div class="nearby-visual">${poster}<div class="nearby-date-visual" ${poster?'hidden':''}><span>${escape(event.date.slice(8))}</span><span>${escape(new Intl.DateTimeFormat('fr-FR',{month:'short',timeZone:'Europe/Paris'}).format(new Date(event.date+'T12:00:00Z')))}</span><span>${escape(event.date.slice(0,4))}</span></div></div>
      <div class="nearby-content"><div class="nearby-tags"><span>${escape(formatLabel(event.format))}</span><span>≈ ${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(event.distanceKm)} km</span></div>
      <h4>${escape(event.name)}</h4><p class="nearby-date"><time datetime="${escape(event.date)}">${escape(dateLabel(event.date))}</time>${event.endDate && event.endDate !== event.date ? ` – ${escape(dateLabel(event.endDate))}` : ''}</p>
      <p class="nearby-place">${escape(event.location || 'Lieu sur l’annonce')}</p>${event.details?`<p class="nearby-details">${escape(event.details)}</p>`:''}
      <p class="nearby-access">${escape(event.access || 'Conditions sur l’annonce')}</p>
      <div class="nearby-source"><span>Source : ${escape(event.source)}${validDate(checked)?` · relevé le ${escape(checked.split('-').reverse().join('/'))}`:''}</span><a href="${escape(event.url)}" target="_blank" rel="noopener noreferrer">Voir l’annonce</a></div></div>
    </article>`;
  }
  function mount(root, options = {}) {
    const doc = root.ownerDocument;
    const now = options.now || Date.now;
    const get = options.fetch || global.fetch.bind(global);
    const setTimer = options.setTimer || setTimeout;
    const clearTimer = options.clearTimer || clearTimeout;
    const reduced = global.matchMedia('(prefers-reduced-motion: reduce)');
    const slidesRoot = root.querySelector('[data-nearby-slides]');
    const status = root.querySelector('[data-nearby-status]');
    const controls = root.querySelector('[data-nearby-controls]');
    const count = root.querySelector('[data-nearby-count]');
    const pause = root.querySelector('[data-nearby-pause]');
    const radiusControl = root.querySelector('[data-nearby-radius]');
    const heading = root.querySelector('#nearby-title');
    let radius = '100', total = 0;
    let data = null, rows = [], controller = null;
    let timer, inFlight, stopped = false, lastAttempt = -Infinity, pending = false, offline = false;
    let activeUrl, userPaused = reduced.matches;
    let inViewport = !('IntersectionObserver' in global);
    const listeners = [], slideListeners = [];
    let storage;
    try {storage = options.storage || global.localStorage; radius = normalizeRadius(storage?.getItem(RANGE_KEY));} catch { /* Storage optional. */ }
    if(radiusControl) radiusControl.value = radius;
    function listen(target, type, callback, list = listeners) {target.addEventListener(type,callback);list.push(()=>target.removeEventListener(type,callback));}
    function report() {
      const area = radius === 'all' ? 'France entière' : `${radius} km à vol d’oiseau autour de Viglain`;
      status.textContent = `${rows.length}${total>rows.length?` sur ${total}`:''} annonce${total===1?'':'s'} à venir · acier et électroniques · ${area}.`;
      if(heading)heading.textContent = radius === 'all' ? 'Les tournois en France' : 'Les tournois autour de Viglain';
      if(data && data.coverage !== 'FR' && (radius === 'all' || Number(radius)>100))status.textContent += ' Catalogue national en attente d’actualisation.';
      if (data?.sourceErrors?.length) status.textContent += ' Source indisponible : dernier relevé conservé.';
      if (offline) status.textContent += ' Actualisation indisponible.';
      const dates = rows.map(event => Date.parse(event.checkedAt)).filter(Number.isFinite);
      if (dates.length && now()-Math.min(...dates)>2*86400000) status.textContent += ' Certaines annonces sont anciennes : confirme auprès de l’organisateur.';
    }
    function redraw(force = false, reset = false) {
      const matches = select(data?.events || [],day(new Date(now())),radius,5000);
      total = matches.length;
      const selected = matches.slice(0,10);
      // Do not remove a link while someone is using it with the keyboard.
      if (!force && root.contains(doc.activeElement)) {pending = true; return;}
      pending = false;
      if (JSON.stringify(selected) === JSON.stringify(rows) && controller) {report();return;}
      if (controller) {const state=controller.state();userPaused=state.userPaused;activeUrl=reset ? null : rows[state.index]?.url;controller.destroy();}
      slideListeners.splice(0).forEach(remove=>remove());
      rows = selected;
      slidesRoot.innerHTML = rows.length ? rows.map((event,index)=>renderCard(event,index,rows.length)).join('') : '<p class="nearby-empty">Aucune annonce à venir disponible dans ce rayon pour cette sélection. La recherche ci-dessous reste accessible.</p>';
      controls.hidden = rows.length<2;
      const slides = [...slidesRoot.querySelectorAll('.nearby-slide')];
      controller = global.SBCProductCarousel.createController({count:rows.length,paused:userPaused,
        initialIndex:Math.max(0,rows.findIndex(event=>event.url===activeUrl)),setTimer,clearTimer,
        onChange(state) {
          slides.forEach((slide,i)=>{slide.hidden=i!==state.index;});
          count.textContent = rows.length ? `${state.index+1} / ${rows.length}` : '';
          pause.textContent = state.userPaused ? 'Lecture' : 'Pause';
          pause.setAttribute('aria-pressed',String(state.userPaused));
          pause.setAttribute('aria-label',state.userPaused?'Lancer le défilement des tournois':'Mettre en pause le défilement des tournois');
        }});
      controller.hold('document',doc.hidden);
      controller.hold('hover',root.matches(':hover'));
      controller.hold('viewport',!inViewport);
      slidesRoot.querySelectorAll('img').forEach(image => {
        const fallback=()=>{image.hidden=true;image.nextElementSibling.hidden=false;};
        listen(image,'error',fallback,slideListeners);
        if(image.complete && !image.naturalWidth)fallback();
      });
      report();
    }
    async function refresh() {
      if(stopped || inFlight)return inFlight;
      lastAttempt=now();
      const abort=new AbortController();
      const timeout=setTimer(()=>abort.abort(),20000);
      inFlight=(async()=>{
        try {
          const response=await get('./local-tournaments.json',{cache:'no-store',signal:abort.signal});
          if(!response.ok)throw Error('Listing unavailable');
          const next=await response.json();
          if(!valid(next))throw Error('Invalid listing');
          if(stopped)return;
          data=next;offline=false;redraw();
          try {storage?.setItem(KEY,JSON.stringify(data));}catch{/* Offline cache optional. */}
        }catch{
          if(!stopped){offline=true;redraw();}
        }finally{clearTimer(timeout);inFlight=null;}
      })();
      return inFlight;
    }
    function schedule() {clearTimer(timer);timer=setTimer(()=>{if(!doc.hidden)refresh();if(!stopped)schedule();},REFRESH);}
    function resume() {controller?.hold('document',doc.hidden);if(!doc.hidden){redraw();if(now()-lastAttempt>=REFRESH){refresh();schedule();}}}
    if(radiusControl)listen(radiusControl,'change',()=>{radius=normalizeRadius(radiusControl.value);try{storage?.setItem(RANGE_KEY,radius);}catch{}redraw(true,true);});
    listen(root.querySelector('[data-nearby-previous]'),'click',()=>controller?.previous());
    listen(root.querySelector('[data-nearby-next]'),'click',()=>controller?.next());
    listen(pause,'click',()=>controller?.toggle());
    listen(root,'mouseenter',()=>controller?.hold('hover',true));
    listen(root,'mouseleave',()=>controller?.hold('hover',false));
    listen(root,'focusin',()=>controller?.hold('focus',true));
    listen(root,'focusout',event=>{if(!root.contains(event.relatedTarget)){controller?.hold('focus',false);if(pending)queueMicrotask(()=>{if(!stopped)redraw();});}});
    listen(doc,'visibilitychange',resume);
    listen(global,'pageshow',resume);
    listen(global,'online',()=>refresh());
    listen(reduced,'change',event=>{if(event.matches)controller?.pause();});
    if('IntersectionObserver' in global){
      const observer=new global.IntersectionObserver(entries=>{inViewport=entries[0].isIntersecting;controller?.hold('viewport',!inViewport);},{threshold:.15});
      observer.observe(root);listeners.push(()=>observer.disconnect());
    }
    try {const saved=JSON.parse(storage?.getItem(KEY)||'null');if(valid(saved))data=saved;}catch{/* No cached announcements. */}
    redraw();refresh();schedule();
    return {refresh,
      // Keep compatibility with app.js: its global discipline filter must not hide local tournaments.
      setFormats(){},
      destroy(){stopped=true;clearTimer(timer);controller?.destroy();listeners.concat(slideListeners).forEach(remove=>remove());}};
  }
  global.SBCTournamentCarousel={mount,select,distance,validDate,renderCard,formatLabel,day,normalizeRadius,interval:REFRESH};
})(typeof window==='undefined'?globalThis:window);
