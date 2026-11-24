(function (global) {
  'use strict';

  const DELAY = 5000;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function renderPrice(product) {
    if (!Number.isInteger(product.priceCents) || product.priceCents < 0 || product.priceCurrency !== 'EUR') {
      return '<div class="product-price-block"><span class="product-price-unavailable">Prix à consulter chez le vendeur</span></div>';
    }
    const format = value => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(value/100);
    const previous = Number.isInteger(product.previousPriceCents) && product.previousPriceCents > product.priceCents
      ? `<del class="product-old-price" aria-label="Ancien prix affiché : ${escape(format(product.previousPriceCents))}">${escape(format(product.previousPriceCents))}</del>` : '';
    const timestamp = Date.parse(product.priceCheckedAt || '');
    const checked = Number.isFinite(timestamp) ? new Intl.DateTimeFormat('fr-FR', {dateStyle:'short',timeStyle:'short',timeZone:'Europe/Paris'}).format(timestamp) : '';
    return `<div class="product-price-block"><div class="product-price-row"><strong class="product-price">${escape(format(product.priceCents))}</strong>${previous}</div><small class="product-price-note">${product.priceTaxIncluded === true ? 'TTC · ' : ''}${checked ? `Relevé le ${escape(checked)} · ` : ''}Hors livraison</small></div>`;
  }

  // A fresh five-second delay starts after navigation or any temporary pause.
  function createController({count, onChange, setTimer = setTimeout, clearTimer = clearTimeout, paused = false, initialIndex = 0}) {
    let index = Math.max(0, Math.min(initialIndex, count - 1));
    let userPaused = paused;
    let timer = null;
    let destroyed = false;
    const holds = new Set();
    const state = () => ({index, userPaused, playing: !destroyed && !userPaused && !holds.size && count > 1});
    const clear = () => { if (timer !== null) clearTimer(timer); timer = null; };
    function schedule() {
      clear();
      if (state().playing) timer = setTimer(() => {timer = null; move(1);}, DELAY);
    }
    function notify() { onChange(state()); }
    function move(delta) {
      if (destroyed || count < 1) return;
      index = (index + delta + count) % count;
      notify();
      schedule();
    }
    function hold(reason, value) {
      if (destroyed) return;
      if (value) holds.add(reason); else holds.delete(reason);
      notify();
      schedule();
    }
    notify();
    schedule();
    return {
      next: () => move(1),
      previous: () => move(-1),
      toggle() {if (destroyed) return; userPaused = !userPaused; notify(); schedule();},
      pause() {if (destroyed) return; userPaused = true; notify(); schedule();},
      hold,
      state,
      destroy() {destroyed = true; clear();}
    };
  }

  function mount(root, shops, saved = {}) {
    const reducedMotion = global.matchMedia('(prefers-reduced-motion: reduce)');
    root.innerHTML = shops.map(shop => `<section class="shop-carousel" role="region" aria-roledescription="carrousel" aria-labelledby="shop-${escape(shop.id)}">
      <header class="shop-carousel-header"><div><span class="product-kind">${escape(shop.selectionLabel || 'SÉLECTION BOUTIQUE')} · ${shop.products.length} ARTICLE${shop.products.length===1?'':'S'}</span><h3 id="shop-${escape(shop.id)}">${escape(shop.name)}</h3></div><a href="${escape(shop.url)}" target="_blank" rel="noopener noreferrer" aria-label="Visiter la boutique ${escape(shop.name)}">Boutique ↗</a></header>
      ${shop.promotion && Date.parse(shop.promotion.endsAt) > Date.now() ? `<p class="shop-promotion"><a href="${escape(shop.promotion.url)}" target="_blank" rel="noopener noreferrer">${escape(shop.promotion.text)} ↗</a></p>` : ''}
      ${shop.selectionNote ? `<p class="product-category-note">${escape(shop.selectionNote)}</p>` : ''}
      <div class="product-slides" aria-live="off">${!shop.products.length ? `<p class="product-family-empty">Aucun article de cette famille disponible dans le dernier relevé. <a href="${escape(shop.url)}" target="_blank" rel="noopener noreferrer">Consulter la rubrique du vendeur</a></p>` : ''}${shop.products.map((product,index) => `<article class="product-slide" role="group" aria-roledescription="diapositive" aria-label="${index+1} sur ${shop.products.length}" ${index?'hidden':''}>
        <a class="product-visual" href="${escape(product.url)}" target="_blank" rel="noopener noreferrer" aria-label="Voir ${escape(product.name)} chez ${escape(shop.name)}"><img src="${escape(product.image)}" alt="${escape(product.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="product-image-fallback" hidden>Photo indisponible</span></a>
        <div class="product-content"><span class="product-kind">${escape(product.kind)}</span><h4>${escape(product.name)}</h4>${renderPrice(product)}<a class="product-link" href="${escape(product.url)}" target="_blank" rel="noopener noreferrer">Voir l’article <span>↗</span></a></div>
      </article>`).join('')}</div>
      <div class="carousel-controls" ${shop.products.length<2?'hidden':''}><button type="button" data-carousel="previous" aria-label="Article précédent chez ${escape(shop.name)}">←</button><button type="button" data-carousel="pause" class="carousel-pause" aria-pressed="false">Pause</button><span class="carousel-count" aria-label="Article affiché">1 / ${shop.products.length}</span><button type="button" data-carousel="next" aria-label="Article suivant chez ${escape(shop.name)}">→</button></div>
    </section>`).join('');

    const cleanups = [];
    const controllers = [];
    root.querySelectorAll('.shop-carousel').forEach((card, shopIndex) => {
      const slides = [...card.querySelectorAll('.product-slide')];
      const pause = card.querySelector('[data-carousel="pause"]');
      const counter = card.querySelector('.carousel-count');
      const controller = createController({
        count: slides.length,
        paused: saved[shops[shopIndex].id]?.userPaused ?? reducedMotion.matches,
        initialIndex: Math.max(0, shops[shopIndex].products.findIndex(product => product.url === saved[shops[shopIndex].id]?.url)),
        onChange({index,userPaused}) {
          slides.forEach((slide,i) => { slide.hidden = i !== index; });
          counter.textContent = `${slides.length?index+1:0} / ${slides.length}`;
          pause.textContent = userPaused ? 'Lecture' : 'Pause';
          pause.setAttribute('aria-pressed', String(userPaused));
          pause.setAttribute('aria-label', `${userPaused?'Lancer':'Mettre en pause'} le défilement chez ${shops[shopIndex].name}`);
        }
      });
      controllers.push(controller);
      if (card.matches(':hover')) controller.hold('hover',true);
      function listen(target, event, callback) {
        target.addEventListener(event, callback);
        cleanups.push(() => target.removeEventListener(event, callback));
      }
      listen(card.querySelector('[data-carousel="previous"]'),'click',controller.previous);
      listen(card.querySelector('[data-carousel="next"]'),'click',controller.next);
      listen(pause,'click',controller.toggle);
      listen(card,'mouseenter',() => controller.hold('hover',true));
      listen(card,'mouseleave',() => controller.hold('hover',false));
      listen(card,'focusin',() => controller.hold('focus',true));
      listen(card,'focusout',event => {
        if (!card.contains(event.relatedTarget)) controller.hold('focus',false);
      });
      const visibility = () => controller.hold('document',document.hidden);
      listen(document,'visibilitychange',visibility);
      visibility();
      listen(reducedMotion,'change',event => {if (event.matches) controller.pause();});
      if ('IntersectionObserver' in global) {
        controller.hold('viewport',true);
        const observer = new IntersectionObserver(entries => {
          controller.hold('viewport',!entries[0].isIntersecting);
        },{threshold:0.15});
        observer.observe(card);
        cleanups.push(() => observer.disconnect());
      }
      card.querySelectorAll('.product-visual img').forEach(image => {
        const fallback = () => {image.hidden = true; image.nextElementSibling.hidden = false;};
        listen(image,'error',fallback);
        if (image.complete && !image.naturalWidth) fallback();
      });
      cleanups.push(() => controller.destroy());
    });
    return {
      snapshot() {return Object.fromEntries(shops.map((shop,i) => {const state = controllers[i].state(); return [shop.id,{userPaused:state.userPaused,url:shop.products[state.index]?.url}];}));},
      destroy() {cleanups.forEach(cleanup => cleanup());}
    };
  }

  global.SBCProductCarousel = {mount, createController, renderPrice, delay: DELAY};
})(typeof window === 'undefined' ? globalThis : window);
