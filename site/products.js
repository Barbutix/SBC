// Sélection produits et prix relevés chez les vendeurs le 12 novembre 2026.
const equipmentShops = [
  {
    "id": "olies",
    "name": "Olie’s Darts",
    "url": "https://www.olies-darts.com/",
    "products": [
      {
        "name": "Cible Winmau Blade 6",
        "kind": "Cible de fléchettes",
        "url": "https://www.olies-darts.com/cibles-de-flechettes-pointe-acier/4593-cible-winmau-blade-6.html",
        "image": "https://www.olies-darts.com/13841-home_default/cible-winmau-blade-6.jpg",
        "previousPriceCents": 5413,
        "priceCents": 4330,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.olies-darts.com/"
      },
      {
        "name": "GranBoard 3S bleue",
        "kind": "Cible électronique connectée",
        "url": "https://www.olies-darts.com/cible-electronique-connectee/3994-cible-electronique-connectee-granboard-3s-bleu.html",
        "image": "https://www.olies-darts.com/20203-home_default/cible-electronique-connectee-granboard-3s-bleu.jpg",
        "priceCents": 22400,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.olies-darts.com/"
      },
      {
        "name": "Set cible et anneau PDC bleu",
        "kind": "Cible et protection murale",
        "url": "https://www.olies-darts.com/tour-de-cible/5385-set-cible-et-anneau-de-protection-bleu-pdc.html",
        "image": "https://www.olies-darts.com/15878-home_default/set-cible-et-anneau-de-protection-bleu-pdc.jpg",
        "priceCents": 9079,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.olies-darts.com/"
      },
      {
        "name": "Anneau Winmau PDC Blade 6",
        "kind": "Protection murale",
        "url": "https://www.olies-darts.com/tour-de-cible/4986-anneau-de-protection-winmau-pdc-blade-6.html",
        "image": "https://www.olies-darts.com/14972-home_default/anneau-de-protection-winmau-pdc-blade-6.jpg",
        "priceCents": 3746,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.olies-darts.com/"
      },
      {
        "name": "Gran Eye 2026",
        "kind": "Scorage automatique",
        "url": "https://www.olies-darts.com/systeme-de-scorage/6227-gran-eye-2026-scoreur-automatique.html",
        "image": "https://www.olies-darts.com/18653-home_default/gran-eye-2026-scoreur-automatique.jpg",
        "priceCents": 24917,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.olies-darts.com/"
      },
      {
        "name": "Cible Winmau Blade X",
        "kind": "Cible de fléchettes",
        "url": "https://www.olies-darts.com/cibles-de-flechettes-pointe-acier/6174-cible-winmau-blade-x.html",
        "image": "https://www.olies-darts.com/18378-home_default/cible-winmau-blade-x.jpg",
        "priceCents": 12500,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.olies-darts.com/"
      },
      {
        "name": "Winmau Plasma Ice et tour de cible",
        "kind": "Éclairage et protection",
        "url": "https://www.olies-darts.com/eclairage-cibles/5803-eclairage-plasma-ice-avec-tour-de-cible-bundle-winmau.html",
        "image": "https://www.olies-darts.com/16953-home_default/eclairage-plasma-ice-avec-tour-de-cible-bundle-winmau.jpg",
        "priceCents": 10413,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.olies-darts.com/"
      },
      {
        "name": "Jacques Labre Biko 20 g",
        "kind": "Fléchettes électroniques",
        "url": "https://www.olies-darts.com/jeux-cosmodarts-elek/4881-jacques-labre-dit-biko-elek-en-20g.html",
        "image": "https://www.olies-darts.com/14720-home_default/jacques-labre-dit-biko-elek-en-20g.jpg",
        "priceCents": 4625,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.olies-darts.com/"
      },
      {
        "name": "One80 T-Core TC2 20 g",
        "kind": "Fléchettes électroniques",
        "url": "https://www.olies-darts.com/jeux-one80/6645-t-core-tc2-one80-elek-en-20g.html",
        "image": "https://www.olies-darts.com/20712-home_default/t-core-tc2-one80-elek-en-20g.jpg",
        "priceCents": 2492,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.olies-darts.com/"
      },
      {
        "name": "One80 T-Core TC2 22 g",
        "kind": "Fléchettes acier",
        "url": "https://www.olies-darts.com/jeux-one80/6643-t-core-tc2-one80-en-22g.html",
        "image": "https://www.olies-darts.com/20698-home_default/t-core-tc2-one80-en-22g.jpg",
        "priceCents": 2492,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.olies-darts.com/"
      }
    ]
  },
  {
    "id": "pleine-bull",
    "name": "Pleine Bull",
    "url": "https://pleinebull.fr/",
    "products": [
      {
        "name": "Mission Torus 120° noir",
        "kind": "Éclairage de cible",
        "url": "https://pleinebull.fr/products/eclairage-cible-mission-torus-120deg-noir",
        "image": "https://cdn.shopify.com/s/files/1/0934/1992/9866/files/eclairage-cible-mission-torus-120deg-noir.jpg?v=1793452810",
        "priceCents": 3995,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://pleinebull.fr/products/eclairage-cible-mission-torus-120deg-noir.js"
      },
      {
        "name": "Fléchettes acier Bull's Dirk van Duijvenbode 80 % 24 g",
        "kind": "Fléchettes acier",
        "url": "https://pleinebull.fr/products/flechettes-acier-bulls-dirk-van-duijvenbode-80-24g",
        "image": "https://cdn.shopify.com/s/files/1/0934/1992/9866/files/flechettes-acier-bulls-dirk-van-duijvenbode-80-24g.jpg?v=1793975324",
        "priceCents": 6995,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://pleinebull.fr/products/flechettes-acier-bulls-dirk-van-duijvenbode-80-24g.js"
      },
      {
        "name": "Ailettes fléchettes Robson Plus No.2 Rouge",
        "kind": "Ailettes",
        "url": "https://pleinebull.fr/products/ailettes-robson-plus-rouge-no2",
        "image": "https://cdn.shopify.com/s/files/1/0934/1992/9866/files/ailettes-robson-plus-rouge-no2_78b2d4d2-6b28-4224-b432-fa56850842e2.jpg?v=1793975296",
        "priceCents": 795,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://pleinebull.fr/products/ailettes-robson-plus-rouge-no2.js"
      },
      {
        "name": "Fléchettes soft One80 Night Hunter Velocity 90% Tungstène - 18 g",
        "kind": "Fléchettes électroniques",
        "url": "https://pleinebull.fr/products/flechettes-soft-one80-night-hunter-velocity-90-tungstene-18g",
        "image": "https://cdn.shopify.com/s/files/1/0934/1992/9866/files/flechettes-soft-one80-night-hunter-velocity-90-tungstene-18g.jpg?v=1793696749",
        "priceCents": 4995,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://pleinebull.fr/products/flechettes-soft-one80-night-hunter-velocity-90-tungstene-18g.js"
      },
      {
        "name": "Fléchettes soft Target Buzz 11 90% Noir et jaune – 18g",
        "kind": "Fléchettes électroniques",
        "url": "https://pleinebull.fr/products/flechettes-soft-target-buzz-11-90-tungstene-18g",
        "image": "https://cdn.shopify.com/s/files/1/0934/1992/9866/files/flechettes-soft-target-buzz-11-90-tungstene-18g.jpg?v=1793696727",
        "priceCents": 4695,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://pleinebull.fr/products/flechettes-soft-target-buzz-11-90-tungstene-18g.js"
      },
      {
        "name": "Fléchettes acier Target Buzz SP03 Swiss Point 90% Noir et jaune - 23g",
        "kind": "Fléchettes acier",
        "url": "https://pleinebull.fr/products/flechettes-acier-target-buzz-sp03-swiss-point-90-tungstene-23g",
        "image": "https://cdn.shopify.com/s/files/1/0934/1992/9866/files/flechettes-acier-target-buzz-sp03-swiss-point-90-tungstene-23g.jpg?v=1793696693",
        "priceCents": 4695,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://pleinebull.fr/products/flechettes-acier-target-buzz-sp03-swiss-point-90-tungstene-23g.js"
      },
      {
        "name": "Target K-Flex Neon No.2 Orange fluo – Short 19 mm",
        "kind": "Ensemble tiges et ailettes",
        "url": "https://pleinebull.fr/products/target-k-flex-neon-no2-orange-fluo-short-19-mm",
        "image": "https://cdn.shopify.com/s/files/1/0934/1992/9866/files/target-k-flex-neon-no2-orange-fluo-short-19-mm.jpg?v=1793696633",
        "priceCents": 1095,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://pleinebull.fr/products/target-k-flex-neon-no2-orange-fluo-short-19-mm.js"
      },
      {
        "name": "Pointes acier Bull's CP Smooth 40 mm Argent",
        "kind": "Pointes et accessoires",
        "url": "https://pleinebull.fr/products/pointes-acier-bulls-cp-smooth-40mm-argent",
        "image": "https://cdn.shopify.com/s/files/1/0934/1992/9866/files/pointes-acier-bulls-cp-smooth-40mm-argent.jpg?v=1793382031",
        "priceCents": 995,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://pleinebull.fr/products/pointes-acier-bulls-cp-smooth-40mm-argent.js"
      },
      {
        "name": "Outil pour pointes Bull's CP Points Tool",
        "kind": "Outil et entretien",
        "url": "https://pleinebull.fr/products/outil-pointes-bulls-cp-points-tool",
        "image": "https://cdn.shopify.com/s/files/1/0934/1992/9866/files/outil-pointes-bulls-cp-points-tool.jpg?v=1793380131",
        "priceCents": 595,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://pleinebull.fr/products/outil-pointes-bulls-cp-points-tool.js"
      },
      {
        "name": "Pointes acier Bull's CP Micro Grip 36 mm Noir",
        "kind": "Pointes et accessoires",
        "url": "https://pleinebull.fr/products/pointes-acier-bulls-cp-micro-grip-36mm-noir",
        "image": "https://cdn.shopify.com/s/files/1/0934/1992/9866/files/pointes-acier-bulls-cp-micro-grip-36mm-noir.jpg?v=1793380090",
        "priceCents": 995,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://pleinebull.fr/products/pointes-acier-bulls-cp-micro-grip-36mm-noir.js"
      }
    ]
  },
  {
    "id": "dartshopper",
    "name": "Dartshopper",
    "url": "https://www.dartshopper.fr/",
    "products": [
      {
        "name": "KOTO Royal 580",
        "kind": "Cible électronique",
        "url": "https://www.dartshopper.fr/cible-flechette-electronique-koto-royal-580/",
        "image": "https://images.cdn.europe-west1.gcp.commercetools.com/7c0e4c3f-dc4f-43e6-99b2-3f02d41d5df2/img-lrkuDwg2-zoom.jpg",
        "priceCents": 8495,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.dartshopper.fr/cible-flechette-electronique-koto-royal-580/"
      },
      {
        "name": "Shot One - Cible de Fléchettes Professionnelle",
        "kind": "Cible de fléchettes",
        "url": "https://www.dartshopper.fr/shot-one-cible-de-flechettes-professionnelle/",
        "image": "https://images.cdn.europe-west1.gcp.commercetools.com/7c0e4c3f-dc4f-43e6-99b2-3f02d41d5df2/img-crEL1gYW-zoom.jpg",
        "priceCents": 7995,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.dartshopper.fr/shot-one-cible-de-flechettes-professionnelle/"
      },
      {
        "name": "Winmau Fallon Sherrock 90% - Fléchettes pointe Acier",
        "kind": "Fléchettes acier",
        "url": "https://www.dartshopper.fr/winmau-fallon-sherrock-90-percent-flechettes-pointe-acier/",
        "image": "https://images.cdn.europe-west1.gcp.commercetools.com/7c0e4c3f-dc4f-43e6-99b2-3f02d41d5df2/img-e03PQiec-zoom.jpg",
        "priceCents": 5995,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.dartshopper.fr/winmau-fallon-sherrock-90-percent-flechettes-pointe-acier/"
      },
      {
        "name": "Scolia Flow - Cible de Fléchettes Professionnelle",
        "kind": "Cible de fléchettes",
        "url": "https://www.dartshopper.fr/scolia-flow-cible-de-flechettes-professionnelle/",
        "image": "https://images.cdn.europe-west1.gcp.commercetools.com/7c0e4c3f-dc4f-43e6-99b2-3f02d41d5df2/img-VBZWcbRZ-zoom.jpg",
        "priceCents": 8395,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.dartshopper.fr/scolia-flow-cible-de-flechettes-professionnelle/"
      },
      {
        "name": "Red Dragon Gerwyn Price Ultra Switch Point 90 % - Fléchettes pointe Acier",
        "kind": "Fléchettes acier",
        "url": "https://www.dartshopper.fr/red-dragon-gerwyn-price-ultra-switch-point-90-percent-flechettes-pointe-acier/",
        "image": "https://images.cdn.europe-west1.gcp.commercetools.com/7c0e4c3f-dc4f-43e6-99b2-3f02d41d5df2/img-IdoQUUBH-zoom.jpg",
        "priceCents": 10795,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.dartshopper.fr/red-dragon-gerwyn-price-ultra-switch-point-90-percent-flechettes-pointe-acier/"
      },
      {
        "name": "Red Dragon Gerwyn Price Pro Switch Point 90% - Fléchettes pointe Acier",
        "kind": "Fléchettes acier",
        "url": "https://www.dartshopper.fr/red-dragon-gerwyn-price-pro-switch-point-90-percent-flechettes-pointe-acier/",
        "image": "https://images.cdn.europe-west1.gcp.commercetools.com/7c0e4c3f-dc4f-43e6-99b2-3f02d41d5df2/img-alImRwxP-zoom.jpg",
        "priceCents": 8995,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.dartshopper.fr/red-dragon-gerwyn-price-pro-switch-point-90-percent-flechettes-pointe-acier/"
      },
      {
        "name": "Red Dragon Gerwyn Price ADV Switch Point 90% - Fléchettes pointe Acier",
        "kind": "Fléchettes acier",
        "url": "https://www.dartshopper.fr/red-dragon-gerwyn-price-adv-switch-point-90-percent-flechettes-pointe-acier/",
        "image": "https://images.cdn.europe-west1.gcp.commercetools.com/7c0e4c3f-dc4f-43e6-99b2-3f02d41d5df2/img-FckTQ_Yz-zoom.jpg",
        "priceCents": 5995,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.dartshopper.fr/red-dragon-gerwyn-price-adv-switch-point-90-percent-flechettes-pointe-acier/"
      },
      {
        "name": "Red Dragon Gerwyn Price Core Brass - Fléchettes pointe Acier",
        "kind": "Fléchettes acier",
        "url": "https://www.dartshopper.fr/red-dragon-gerwyn-price-core-brass-flechettes-pointe-acier/",
        "image": "https://images.cdn.europe-west1.gcp.commercetools.com/7c0e4c3f-dc4f-43e6-99b2-3f02d41d5df2/img-sjedgyUg-zoom.jpg",
        "priceCents": 2395,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.dartshopper.fr/red-dragon-gerwyn-price-core-brass-flechettes-pointe-acier/"
      },
      {
        "name": "Red Dragon Gerwyn Price Ultra 90% - Fléchettes pointe Plastique",
        "kind": "Fléchettes électroniques",
        "url": "https://www.dartshopper.fr/red-dragon-gerwyn-price-ultra-90-percent-flechettes-pointe-plastique/",
        "image": "https://images.cdn.europe-west1.gcp.commercetools.com/7c0e4c3f-dc4f-43e6-99b2-3f02d41d5df2/img-8KOw34sN-zoom.jpg",
        "priceCents": 9595,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.dartshopper.fr/red-dragon-gerwyn-price-ultra-90-percent-flechettes-pointe-plastique/"
      },
      {
        "name": "Red Dragon Gerwyn Price ADV 90% - Soft Tip Darts",
        "kind": "Fléchettes électroniques",
        "url": "https://www.dartshopper.fr/red-dragon-gerwyn-price-adv-90-percent-soft-tip-darts/",
        "image": "https://images.cdn.europe-west1.gcp.commercetools.com/7c0e4c3f-dc4f-43e6-99b2-3f02d41d5df2/img-NDj2aPJL-zoom.jpg",
        "priceCents": 5995,
        "priceCurrency": "EUR",
        "priceCheckedAt": "2026-11-12",
        "priceSource": "https://www.dartshopper.fr/red-dragon-gerwyn-price-adv-90-percent-soft-tip-darts/"
      }
    ]
  }
];
