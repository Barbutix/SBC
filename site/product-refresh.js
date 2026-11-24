(function (global) {
  'use strict';
  const INTERVAL = 30 * 60 * 1000;
  const STORAGE = 'sbc-equipment-v2';
  const FAMILY_KEY = 'sbc-equipment-family-v1';
  const FAMILIES = {cible:'CIBLE',flechettes:'FLÉCHETTES',pack:'PACK',promo:'PROMO'};
  const hosts = {olies:'www.olies-darts.com',pleinebull:'pleinebull.fr',dartshopper:'www.dartshopper.fr'};
  function https(value, host) {
    try {const url = new URL(value); return url.protocol === 'https:' && (!host || url.hostname === host);} catch {return false;}
  }
  function valid(data) {
    const productValid = (product, host) => product && typeof product.name === 'string' && product.name.length &&
      https(product.url,host) && https(product.image) && product.priceCurrency === 'EUR' &&
      Number.isInteger(product.priceCents) && product.priceCents>0 && Number.isFinite(Date.parse(product.priceCheckedAt));
    const listValid = (items, host) => Array.isArray(items) && items.length<=10 && new Set(items.map(item=>item?.url)).size===items.length && items.every(item=>productValid(item,host));
    return [1,2].includes(data?.schemaVersion) && Array.isArray(data.shops) && data.shops.length === 3 &&
      new Set(data.shops.map(shop => shop.id)).size === 3 && data.shops.every(shop =>
        hosts[shop.id] && typeof shop.name === 'string' && https(shop.url, hosts[shop.id]) &&
        (Number.isFinite(Date.parse(shop.updatedAt)) || !shop.products?.length) && listValid(shop.products,hosts[shop.id]) &&
        (data.schemaVersion===1 || (shop.families && Object.keys(FAMILIES).every(key=>listValid(shop.families[key],hosts[shop.id])))) &&
        (!shop.promotion || (typeof shop.promotion.text === 'string' && https(shop.promotion.url, hosts[shop.id]) && Number.isFinite(Date.parse(shop.promotion.endsAt)))) &&
        (!shop.familyUrls || Object.values(shop.familyUrls).every(url=>https(url,hosts[shop.id]))));
  }
  function classify(product) {
    if(['cible','flechettes','pack','accessoires'].includes(product.family))return product.family;
    const name=product.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(/\b(pack|kit|bundle|dartset|ensemble)\b|\+|coffret.*cible|set cible/.test(name))return 'pack';
    if(/^flechettes?\b/.test(name))return 'flechettes';
    if(/ailettes?|tiges?|shaft|flight|surround|tour de cible|support|trepied|eclairage|plasma|polaris|corona|tapis|armoire|protection|scorage|compteur/.test(name))return 'accessoires';
    return /\bcible\b|dartboard/.test(name)?'cible':'accessoires';
  }
  function activePromotion(shop, time=Date.now()) {
    return shop.promotion && Date.parse(shop.promotion.endsAt)>=time && (!shop.promotion.startsAt || Date.parse(shop.promotion.startsAt)<=time);
  }
  function selectFamily(shops, family, time=Date.now()) {
    return shops.map(shop=>{
      const sale=product=>Number.isInteger(product.previousPriceCents)&&product.previousPriceCents>product.priceCents;
      const basket=activePromotion(shop,time)&&shop.promoKind==='basket';
      const selected=shop.families?.[family] || shop.products.filter(product=>family==='promo'?sale(product):classify(product)===family);
      const products=(family==='promo'&&!basket?selected.filter(sale):selected).slice(0,10);
      const dates=products.map(product=>Date.parse(product.priceCheckedAt)).filter(Number.isFinite);
      return {...shop,products,selectionLabel:FAMILIES[family],
        url:shop.familyUrls?.[family]||shop.url,
        promotion:activePromotion(shop,time)?shop.promotion:null,
        updatedAt:dates.length?new Date(Math.min(...dates)).toISOString():shop.familyUpdatedAt?.[family]||shop.updatedAt,
        error:shop.familyErrors?.[family]||shop.error,
        selectionNote:family==='promo'&&basket?'Remise selon le montant du panier : consulte les conditions ci-dessus.':shop.familyErrors?.[family]||''};
    });
  }
  function mergeShop(previous, next) {
    if(!previous)return next;
    const stamp=value=>Number.isFinite(Date.parse(value))?Date.parse(value):-Infinity;
    if(!previous.families||!next.families)return stamp(next.updatedAt)<stamp(previous.updatedAt)?previous:next;
    const merged={...next,families:{...next.families},familyUpdatedAt:{...next.familyUpdatedAt}};
    for(const family of Object.keys(FAMILIES)){
      const checked=shop=>shop.familyUpdatedAt?.[family]||shop.families[family]?.[0]?.priceCheckedAt||shop.updatedAt;
      if(stamp(checked(next))<stamp(checked(previous))){
        merged.families[family]=previous.families[family];
        merged.familyUpdatedAt[family]=checked(previous);
      }
    }
    return merged;
  }
  function start(root, fallback, status, options = {}) {
    const doc = options.document || document;
    const now = options.now || Date.now;
    const get = options.fetch || global.fetch.bind(global);
    const setTimer = options.setTimer || setTimeout;
    const clearTimer = options.clearTimer || clearTimeout;
    const mount = options.mount || global.SBCProductCarousel.mount;
    let storage;
    try {storage = options.storage || global.localStorage;} catch { /* Private browsing */ }
    let shops = fallback;
    let family = 'promo';
    try {const saved=storage?.getItem(FAMILY_KEY);if(Object.hasOwn(FAMILIES,saved))family=saved;}catch{}
    const states = {};
    try {
      const cached = JSON.parse(storage?.getItem(STORAGE) || 'null');
      if(valid(cached))shops=cached.shops.map(shop=>mergeShop(fallback.find(old=>old.id===shop.id),shop));
    } catch { /* Immediate bundled fallback */ }
    let renderedKey = JSON.stringify(selectFamily(shops,family,now()));
    let carousel = mount(root, selectFamily(shops,family,now()));
    let timer, timeout, inFlight = null, lastAttempt = -Infinity, stopped = false, pending = null;
    let offline = false;
    const listeners = [];
    function report() {
      const selected = selectFamily(shops,family,now());
      if(JSON.stringify(selected)!==renderedKey && !root.contains(doc.activeElement))render(carousel.snapshot?.()||{});
      const dates = selected.map(shop => Date.parse(shop.updatedAt)).filter(Number.isFinite);
      const oldest = dates.length ? Math.min(...dates) : NaN;
      const format = value => new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Paris'}).format(value);
      status.textContent = `${FAMILIES[family]} · ${selected.map(shop=>`${shop.name} : ${shop.products.length} article${shop.products.length===1?'':'s'}`).join(' · ')}. `;
      status.textContent += dates.length ? `Relevés : ${selected.map(shop => `${shop.name} ${Number.isFinite(Date.parse(shop.updatedAt))?format(Date.parse(shop.updatedAt)):'indisponible'}`).join(' · ')}.` : 'Prix issus du dernier catalogue enregistré.';
      if (offline) status.textContent += ' Connexion indisponible : dernier catalogue conservé.';
      else if (selected.some(shop => shop.error)) status.textContent += ' Sélection partiellement indisponible ; les derniers relevés disponibles sont conservés.';
      else if (now() - oldest > 2 * INTERVAL) status.textContent += ' Relevé ancien : collecte en attente.';
      if (shops.some(shop => shop.warning)) status.textContent += ' Certaines offres panier n’ont pas pu être vérifiées.';
    }
    function render(previous, switching = false) {
      const saved={...((switching?states[family]:previous)||previous||{})};
      for(const id of Object.keys(previous||{}))if(saved[id])saved[id]={...saved[id],userPaused:previous[id].userPaused};
      carousel.destroy();
      const selected=selectFamily(shops,family,now());
      renderedKey=JSON.stringify(selected);
      carousel=mount(root,selected,saved);
    }
    // A new catalog must not remove a keyboard-focused link or reset a manual pause.
    function apply(data) {
      if (root.contains(doc.activeElement)) {pending = data; return;}
      pending = null;
      const next = data.shops.map(shop=>mergeShop(shops.find(old=>old.id===shop.id),shop));
      if (JSON.stringify(next) !== JSON.stringify(shops)) {
        const state = carousel.snapshot?.() || {};
        states[family]=state;
        shops = next;
        render(state);
      }
      report();
    }
    async function refresh() {
      if (stopped || inFlight) return inFlight;
      lastAttempt = now();
      const controller = new AbortController();
      timeout = setTimer(() => controller.abort(), 20000);
      inFlight = (async () => {
        try {
          const response = await get('./equipment.json', {cache:'no-store', signal:controller.signal});
          if (!response.ok) throw new Error('Catalog unavailable');
          const data = await response.json();
          if (!valid(data)) throw new Error('Invalid catalog');
          if (stopped) return;
          offline = false;
          apply(data);
          try {storage?.setItem(STORAGE, JSON.stringify({schemaVersion:data.schemaVersion, shops}));} catch { /* Storage full */ }
        } catch {
          if (!stopped) {offline = true; report();}
        } finally {
          clearTimer(timeout);
          inFlight = null;
        }
      })();
      return inFlight;
    }
    function schedule() {
      clearTimer(timer);
      timer = setTimer(async () => {if (!doc.hidden) await refresh(); if (!stopped) schedule();}, INTERVAL);
    }
    function resume() {if(!doc.hidden){report();if(now()-lastAttempt>=INTERVAL){refresh();schedule();}}}
    function listen(target, event, callback) {target.addEventListener(event, callback); listeners.push(() => target.removeEventListener(event, callback));}
    listen(doc, 'visibilitychange', resume);
    listen(global, 'pageshow', resume);
    listen(global, 'online', () => {refresh(); schedule();});
    listen(root, 'focusout', event => {if(!root.contains(event.relatedTarget))queueMicrotask(()=>{if(!stopped){if(pending)apply(pending);else report();}});});
    report();
    refresh();
    schedule();
    return {refresh,getFamily:()=>family,
      setFamily(value) {
        if(!Object.hasOwn(FAMILIES,value)||value===family)return;
        const previous=carousel.snapshot?.()||{};
        states[family]=previous;family=value;
        try{storage?.setItem(FAMILY_KEY,family);}catch{}
        if(pending){shops=pending.shops.map(shop=>mergeShop(shops.find(old=>old.id===shop.id),shop));pending=null;}
        render(previous,true);report();
      },
      destroy() {stopped = true; clearTimer(timer); clearTimer(timeout); listeners.forEach(remove => remove()); carousel.destroy();}};
  }
  global.SBCProductRefresh = {start,valid,classify,selectFamily,activePromotion,mergeShop,families:FAMILIES,interval:INTERVAL};
})(typeof window === 'undefined' ? globalThis : window);
