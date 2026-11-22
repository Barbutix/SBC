(function (global) {
  'use strict';
  const INTERVAL = 30 * 60 * 1000;
  const STORAGE = 'sbc-equipment-v1';
  const hosts = {olies:'www.olies-darts.com',pleinebull:'pleinebull.fr',dartshopper:'www.dartshopper.fr'};
  function https(value, host) {
    try {const url = new URL(value); return url.protocol === 'https:' && (!host || url.hostname === host);} catch {return false;}
  }
  function valid(data) {
    return data?.schemaVersion === 1 && Array.isArray(data.shops) && data.shops.length === 3 &&
      new Set(data.shops.map(shop => shop.id)).size === 3 && data.shops.every(shop =>
        hosts[shop.id] && typeof shop.name === 'string' && https(shop.url, hosts[shop.id]) &&
        Number.isFinite(Date.parse(shop.updatedAt)) && Array.isArray(shop.products) && shop.products.length === 10 &&
        new Set(shop.products.map(product => product.url)).size === 10 &&
        (!shop.promotion || (typeof shop.promotion.text === 'string' && https(shop.promotion.url, hosts[shop.id]) && Number.isFinite(Date.parse(shop.promotion.endsAt)))) &&
        shop.products.every(product => typeof product.name === 'string' && product.name.length &&
          https(product.url, hosts[shop.id]) && https(product.image) && product.priceCurrency === 'EUR' &&
          Number.isInteger(product.priceCents) && product.priceCents > 0 && Number.isFinite(Date.parse(product.priceCheckedAt))));
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
    try {
      const cached = JSON.parse(storage?.getItem(STORAGE) || 'null');
      if (valid(cached) && cached.shops.every(shop => Date.parse(shop.updatedAt) >= Date.parse(fallback.find(s => s.id === shop.id)?.updatedAt || 0))) shops = cached.shops;
    } catch { /* Immediate bundled fallback */ }
    let carousel = mount(root, shops);
    let timer, timeout, inFlight = null, lastAttempt = -Infinity, stopped = false, pending = null;
    let offline = false;
    const listeners = [];
    function report() {
      const dates = shops.map(shop => Date.parse(shop.updatedAt)).filter(Number.isFinite);
      const oldest = dates.length ? Math.min(...dates) : NaN;
      const format = value => new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Paris'}).format(value);
      status.textContent = dates.length ? `Relevés boutiques : ${shops.map(shop => `${shop.name} ${format(Date.parse(shop.updatedAt))}`).join(' · ')}.` : 'Prix issus du dernier catalogue enregistré.';
      if (offline) status.textContent += ' Connexion indisponible : dernier catalogue conservé.';
      else if (shops.some(shop => shop.error)) status.textContent += ' Une boutique est indisponible ; son dernier relevé est conservé.';
      else if (now() - oldest > 2 * INTERVAL) status.textContent += ' Relevé ancien : collecte en attente.';
      if (shops.some(shop => shop.warning)) status.textContent += ' Certaines offres panier n’ont pas pu être vérifiées.';
    }
    // A new catalog must not remove a keyboard-focused link or reset a manual pause.
    function apply(data) {
      if (root.contains(doc.activeElement)) {pending = data; return;}
      pending = null;
      const next = data.shops.map(shop => Date.parse(shop.updatedAt) < Date.parse(shops.find(s => s.id === shop.id)?.updatedAt || 0) ? shops.find(s => s.id === shop.id) : shop);
      if (JSON.stringify(next) !== JSON.stringify(shops)) {
        const state = carousel.snapshot?.() || {};
        carousel.destroy();
        shops = next;
        carousel = mount(root, shops, state);
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
          try {storage?.setItem(STORAGE, JSON.stringify({schemaVersion:1, shops}));} catch { /* Storage full */ }
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
    function resume() {if (!doc.hidden && now() - lastAttempt >= INTERVAL) {refresh(); schedule();}}
    function listen(target, event, callback) {target.addEventListener(event, callback); listeners.push(() => target.removeEventListener(event, callback));}
    listen(doc, 'visibilitychange', resume);
    listen(global, 'pageshow', resume);
    listen(global, 'online', () => {refresh(); schedule();});
    listen(root, 'focusout', event => {if (pending && !root.contains(event.relatedTarget)) queueMicrotask(() => {if (!stopped && pending) apply(pending);});});
    report();
    refresh();
    schedule();
    return {refresh, destroy() {stopped = true; clearTimer(timer); clearTimer(timeout); listeners.forEach(remove => remove()); carousel.destroy();}};
  }
  global.SBCProductRefresh = {start, valid, interval:INTERVAL};
})(typeof window === 'undefined' ? globalThis : window);
