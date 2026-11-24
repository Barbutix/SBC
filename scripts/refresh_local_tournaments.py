#!/usr/bin/env python3
"""French public tournament announcements, for local or nationwide discovery."""
from functools import lru_cache
from datetime import datetime
from html import unescape
import json
import math
from pathlib import Path
import re
import unicodedata
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'site/local-tournaments.json'
EXTRA = ROOT / 'scripts/local-tournaments-reviewed.json'
# Commune centre published by geo.api.gouv.fr (INSEE 45336), not a visitor location.
ORIGIN = {'name': 'Viglain', 'latitude': 47.7329, 'longitude': 2.2885}


def text(value):
    return ' '.join(unescape(re.sub(r'<[^>]*>', ' ', str(value or ''))).split()).strip()


def https(value):
    try:
        return isinstance(value, str) and urlparse(value).scheme == 'https' and bool(urlparse(value).hostname)
    except ValueError:
        return False


def distance(latitude, longitude):
    if isinstance(latitude, bool) or isinstance(longitude, bool) or latitude is None or longitude is None:
        raise ValueError('Missing coordinates')
    latitude, longitude = float(latitude), float(longitude)
    if not math.isfinite(latitude) or not math.isfinite(longitude) or not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise ValueError('Invalid coordinates')
    lat1, lat2 = math.radians(ORIGIN['latitude']), math.radians(latitude)
    dlat = lat2 - lat1
    dlon = math.radians(longitude - ORIGIN['longitude'])
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6371.0088 * math.asin(math.sqrt(min(1, a)))


def iso_date(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        raise ValueError('Invalid date')
    return datetime.strptime(value, '%Y-%m-%d').date()


def select(events, today, radius=100, limit=10):
    result, seen = [], set()
    for event in events:
        try:
            start = iso_date(event['date'])
            end = iso_date(event.get('endDate') or event['date'])
            if end < start or end < today or not text(event.get('name')) or not https(event.get('url')):
                continue
            if event.get('status') in ('cancelled', 'postponed', 'pending', 'rejected'):
                continue
            km = distance(event.get('latitude'), event.get('longitude'))
            if radius is not None and km > radius:
                continue
            # One card per dated announcement, even when the same URL is supplied twice.
            key = (event['date'], event['url'].rstrip('/'))
            if key in seen:
                continue
            seen.add(key)
            row = dict(event, distanceKm=round(km, 1))
            if not https(row.get('image')):
                row['image'] = ''
            result.append(row)
        except (ValueError, KeyError, TypeError):
            continue
    return sorted(result, key=lambda e: (e['date'], e['distanceKm'], e['name']))[:limit]


@lru_cache(maxsize=1)
def france_polygons():
    """Local, attributed region contours include metropolitan France and the DROM."""
    data = json.loads((ROOT / 'scripts/france-regions.geojson').read_text())
    polygons = []
    for feature in data['features']:
        geometry = feature['geometry']
        coordinates = geometry['coordinates']
        for rings in ([coordinates] if geometry['type'] == 'Polygon' else coordinates):
            outer = rings[0]
            bounds = (min(p[0] for p in outer), min(p[1] for p in outer), max(p[0] for p in outer), max(p[1] for p in outer))
            polygons.append((bounds, rings))
    return polygons


def in_ring(x, y, ring):
    inside = False
    previous = ring[-1]
    for current in ring:
        x1, y1 = previous
        x2, y2 = current
        if ((y1 > y) != (y2 > y)) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
        previous = current
    return inside


def in_france(event):
    try:
        distance(event.get('latitude'), event.get('longitude'))  # validate before conversion
        x, y = float(event['longitude']), float(event['latitude'])
        for bounds, rings in france_polygons():
            left, bottom, right, top = bounds
            if left <= x <= right and bottom <= y <= top and in_ring(x, y, rings[0]) and not any(in_ring(x, y, hole) for hole in rings[1:]):
                return True
    except (ValueError, KeyError, TypeError):
        return False
    return False


def get(url):
    request = Request(url, headers={'User-Agent': 'SBC-Tournament-Scout/2.0 (+https://barbutix.github.io/SBC/)'})
    with urlopen(request, timeout=30) as response:
        return response.read(4_000_000).decode('utf-8')


def target_type(value):
    if isinstance(value, list):
        value = ' '.join(str(part) for part in value)
    normalized = ''.join(c for c in unicodedata.normalize('NFD', str(value or '').lower()) if not unicodedata.combining(c))
    steel = bool(re.search(r'\b(?:acier|traditionnel(?:le)?s?|steel(?:[ -]?tip)?)\b', normalized))
    soft = bool(re.search(r'\b(?:electroniques?|electros?|soft(?:[ -]?tip)?|nylon|plastique)\b', normalized))
    if (steel and soft) or normalized.strip() in ('mixte', 'mixed', 'both'):
        return 'Acier + Soft-tip'
    if steel:
        return 'Acier'
    if soft:
        return 'Soft-tip'
    return 'À confirmer'


def dartsmap(getter=get, checked_at=None):
    # Read the same public configuration and listing used by the site's map.
    source = getter('https://dartsmap.fr/')
    match = re.search(r'var\s+dmapConfig\s*=\s*', source)
    if not match:
        raise ValueError('DartsMap public listing configuration unavailable')
    config = json.JSONDecoder().raw_decode(source[match.end():])[0]
    endpoint = config['ajaxUrl']
    if endpoint != 'https://dartsmap.fr/wp-admin/admin-ajax.php':
        raise ValueError('Unexpected DartsMap listing host')
    params = {'action': 'dmap_get_pins', 'nonce': config['nonce'], 'show': 'events'}
    payload = json.loads(getter(endpoint + '?' + urlencode(params)))
    if payload.get('success') is not True or not isinstance(payload.get('data', {}).get('pins'), list):
        raise ValueError('Invalid DartsMap listing response')
    events = []
    for pin in payload['data']['pins']:
        if pin.get('type') != 'event':
            continue
        slug = pin.get('slug') or str(pin.get('id', ''))
        if not slug:
            continue
        url = 'https://dartsmap.fr/?' + urlencode({'fiche': 'event-' + slug})
        kind = target_type(pin.get('dart_type'))
        modalities = ' · '.join(text(x).capitalize() for x in pin.get('modalities', []) if isinstance(x, str))
        events.append(dict(
            id='dartsmap-' + str(pin.get('id')), name=text(pin.get('title')),
            date=pin.get('date_start'), endDate=pin.get('date_end') or pin.get('date_start'),
            latitude=pin.get('lat'), longitude=pin.get('lng'), location=text(pin.get('address')),
            format=kind, details=modalities, image=pin.get('poster_thumb') or pin.get('poster_url') or '',
            url=url, source='DartsMap', sourceKey='dartsmap', checkedAt=checked_at,
            access='Complet' if pin.get('full') else 'Conditions sur l’annonce', status='published'))
    return events


def refresh(previous, reviewed, now, loader=dartsmap):
    errors = []
    try:
        automatic = loader(checked_at=now.isoformat(timespec='seconds'))
        collected_at = now.isoformat(timespec='seconds')
    except Exception as error:
        # Keep actual retrieval dates when the source cannot be reached.
        automatic = [e for e in previous.get('events', []) if e.get('sourceKey') == 'dartsmap']
        collected_at = previous.get('collectedAt')
        errors.append({'source': 'DartsMap', 'error': type(error).__name__})
    french = [dict(event, countryCode='FR') for event in automatic + reviewed if in_france(event)]
    events = select(french, now.date(), radius=None, limit=None)
    return dict(schemaVersion=1, origin=ORIGIN, coverage='FR', radiusKm=None,
                attemptedAt=now.isoformat(timespec='seconds'), collectedAt=collected_at,
                events=events, sourceErrors=errors)


def main():
    now = datetime.now(ZoneInfo('Europe/Paris'))
    previous = json.loads(OUT.read_text()) if OUT.exists() else {}
    reviewed = json.loads(EXTRA.read_text())['events'] if EXTRA.exists() else []
    result = refresh(previous, reviewed, now)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f"{len(result['events'])} annonces à venir en France (rayons filtrés dans l’application)")
    if result['sourceErrors']:
        print('DartsMap indisponible : dernier relevé conservé, dates inchangées.')


if __name__ == '__main__':
    main()
