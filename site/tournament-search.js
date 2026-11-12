(function (global) {
  'use strict';

  const departments = {
    '01':'Ain','02':'Aisne','03':'Allier','04':'Alpes-de-Haute-Provence','05':'Hautes-Alpes',
    '06':'Alpes-Maritimes','07':'Ardèche','08':'Ardennes','09':'Ariège','10':'Aube',
    '11':'Aude','12':'Aveyron','13':'Bouches-du-Rhône','14':'Calvados','15':'Cantal',
    '16':'Charente','17':'Charente-Maritime','18':'Cher','19':'Corrèze','2A':'Corse-du-Sud',
    '2B':'Haute-Corse','21':"Côte-d'Or",'22':"Côtes-d'Armor",'23':'Creuse','24':'Dordogne',
    '25':'Doubs','26':'Drôme','27':'Eure','28':'Eure-et-Loir','29':'Finistère',
    '30':'Gard','31':'Haute-Garonne','32':'Gers','33':'Gironde','34':'Hérault',
    '35':'Ille-et-Vilaine','36':'Indre','37':'Indre-et-Loire','38':'Isère','39':'Jura',
    '40':'Landes','41':'Loir-et-Cher','42':'Loire','43':'Haute-Loire','44':'Loire-Atlantique',
    '45':'Loiret','46':'Lot','47':'Lot-et-Garonne','48':'Lozère','49':'Maine-et-Loire',
    '50':'Manche','51':'Marne','52':'Haute-Marne','53':'Mayenne','54':'Meurthe-et-Moselle',
    '55':'Meuse','56':'Morbihan','57':'Moselle','58':'Nièvre','59':'Nord',
    '60':'Oise','61':'Orne','62':'Pas-de-Calais','63':'Puy-de-Dôme','64':'Pyrénées-Atlantiques',
    '65':'Hautes-Pyrénées','66':'Pyrénées-Orientales','67':'Bas-Rhin','68':'Haut-Rhin','69':'Rhône',
    '70':'Haute-Saône','71':'Saône-et-Loire','72':'Sarthe','73':'Savoie','74':'Haute-Savoie',
    '75':'Paris','76':'Seine-Maritime','77':'Seine-et-Marne','78':'Yvelines','79':'Deux-Sèvres',
    '80':'Somme','81':'Tarn','82':'Tarn-et-Garonne','83':'Var','84':'Vaucluse',
    '85':'Vendée','86':'Vienne','87':'Haute-Vienne','88':'Vosges','89':'Yonne',
    '90':'Territoire de Belfort','91':'Essonne','92':'Hauts-de-Seine','93':'Seine-Saint-Denis',
    '94':'Val-de-Marne','95':"Val-d'Oise",'971':'Guadeloupe','972':'Martinique',
    '973':'Guyane','974':'La Réunion','976':'Mayotte'
  };

  const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);

  function buildLinks(place, keywords) {
    const entered = clean(place);
    const code = entered.toUpperCase().replace(/\s/g, '').padStart(2, '0');
    const location = departments[code] || entered || 'France';
    const query = `${clean(keywords) || 'tournoi'} fléchettes ${location}`;
    const link = (base, text) => {
      const url = new URL(base);
      url.searchParams.set('q', text);
      return url.href;
    };
    return {
      query,
      posts: link('https://www.facebook.com/search/posts/', query),
      events: link('https://www.facebook.com/search/events/', query),
      indexed: link('https://www.google.com/search', `site:facebook.com ${query}`),
      web: link('https://www.google.com/search', query)
    };
  }

  function mount(root) {
    const place = root.querySelector('#department-search');
    const keywords = root.querySelector('#tournament-keywords');
    const preview = root.querySelector('#tournament-query');
    const copy = root.querySelector('#copy-tournament-query');
    const suggestions = root.querySelector('#tournament-places');
    Object.entries(departments).sort(([a], [b]) => a.localeCompare(b, 'fr')).forEach(([code, name]) => {
      const option = root.ownerDocument.createElement('option');
      option.value = name;
      option.label = `${code} · ${name}`;
      suggestions.append(option);
    });
    function update() {
      const links = buildLinks(place.value, keywords.value);
      preview.textContent = links.query;
      copy.textContent = 'Copier la recherche';
      root.querySelectorAll('[data-tournament-search]').forEach(anchor => {
        anchor.href = links[anchor.dataset.tournamentSearch];
      });
    }
    place.addEventListener('input', update);
    keywords.addEventListener('input', update);
    copy.addEventListener('click', async () => {
      try {
        await root.ownerDocument.defaultView.navigator.clipboard.writeText(buildLinks(place.value, keywords.value).query);
        copy.textContent = 'Recherche copiée';
      } catch {
        copy.textContent = 'Sélectionne et copie le texte ci-dessus';
      }
    });
    root.querySelectorAll('[data-tournament-place]').forEach(button => {
      button.addEventListener('click', () => {
        place.value = button.dataset.tournamentPlace;
        update();
      });
    });
    update();
    return { update };
  }

  global.SBCTournamentSearch = { buildLinks, mount };
})(typeof window !== 'undefined' ? window : globalThis);
