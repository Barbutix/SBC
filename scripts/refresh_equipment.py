#!/usr/bin/env python3
"""Collect public shop prices. Standard library only; keep last good data on failure."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import unicodedata
from itertools import zip_longest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SHOPS = [
    ('olies', 'Olie’s Darts', 'https://www.olies-darts.com/'),
    ('pleinebull', 'Pleine Bull', 'https://pleinebull.fr/'),
    ('dartshopper', 'Dartshopper', 'https://www.dartshopper.fr/'),
]


class Node:
    def __init__(self, tag='', attrs=(), parent=None):
        self.tag, self.attrs, self.parent = tag, dict(attrs), parent
        self.children = []

    def text(self):
        return ' '.join(c.text() if isinstance(c, Node) else c for c in self.children)

    def find(self, test):
        for child in self.children:
            if isinstance(child, Node):
                if test(child):
                    yield child
                yield from child.find(test)

    def has(self, name):
        return name in self.attrs.get('class', '').split()


class Document(HTMLParser):
    VOID = {'img', 'br', 'meta', 'link', 'input', 'hr', 'source', 'wbr', 'area', 'base', 'embed', 'param', 'col', 'track'}

    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = self.current = Node()
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        child = Node(tag, attrs, self.current)
        self.current.children.append(child)
        if tag not in self.VOID:
            self.current = child

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        node = self.current
        while node.parent is not None:
            if node.tag == tag:
                self.current = node.parent
                return
            node = node.parent

    def handle_data(self, text):
        self.current.children.append(text)


def fetch(url):
    request = Request(url, headers={'User-Agent': 'SBC-Equipment-Scout/1.0 (+https://barbutix.github.io/SBC/)', 'Accept-Language': 'fr-FR,fr;q=0.9'})
    with urlopen(request, timeout=30) as response:
        return response.read(8_000_000).decode('utf-8')


def cents(value):
    try:
        amount = Decimal(str(value).replace('\u202f', '').replace('\xa0', '').replace(' ', '').replace(',', '.'))
        result = amount * 100
        if not amount.is_finite() or result != result.to_integral_value() or result <= 0:
            return None
        return int(result)
    except (InvalidOperation, ValueError):
        return None


def money(text):
    match = re.search(r'(\d[\d\s\u202f\xa0]*[,.]\d{2})\s*€', text)
    return cents(match[1]) if match else None


def product(name, url, image, price, previous=None, **extra):
    if not name or not price or not url.startswith('https://') or not image.startswith('https://'):
        return None
    result = dict(name=name.strip(), kind='Matériel de fléchettes', url=url, image=image,
                  priceCents=price, priceCurrency='EUR', priceSource=url, **extra)
    if previous and previous > price:
        result['previousPriceCents'] = previous
        result['kind'] = 'Promotion'
    return result


def parse_olies(source):
    products = []
    for card in Document(source).root.find(lambda n: n.tag == 'article' and n.has('product-miniature')):
        title = next(card.find(lambda n: n.tag == 'h2'), None)
        link = next(title.find(lambda n: n.tag == 'a'), None) if title else None
        price = next(card.find(lambda n: n.has('price') and n.attrs.get('aria-label') == 'Prix'), None)
        image = next(card.find(lambda n: n.tag == 'img'), None)
        # Never infer TTC from an HT amount (the source can expose both).
        if not link or not price or not image or 'TTC' not in price.text():
            continue
        if re.search(r'jongler|monocycle|diabolo|massue', title.text(), re.I):
            continue
        previous = next(card.find(lambda n: n.attrs.get('aria-label') == 'Prix de base'), None)
        item = product(title.text(), link.attrs.get('href', ''), image.attrs.get('data-src') or image.attrs.get('src', ''),
                       money(price.text()), money(previous.text()) if previous else None, priceTaxIncluded=True)
        if item:
            products.append(item)
    return products


def parse_shopify(source):
    products = []
    for row in json.loads(source)['products']:
        variants = [v for v in row.get('variants', []) if v.get('available') and cents(v.get('price'))]
        if not variants or not row.get('images'):
            continue
        variant = min(variants, key=lambda v: cents(v['price']))
        title = row['title']
        if variant.get('title') not in (None, 'Default Title'):
            title += ' — ' + variant['title']
        url = 'https://pleinebull.fr/products/' + row['handle'] + '?variant=' + str(variant['id'])
        image = (variant.get('featured_image') or {}).get('src') or row['images'][0]['src']
        # https://pleinebull.fr/policies/terms-of-sale: all displayed EUR prices include tax.
        item = product(title, url, image, cents(variant['price']), cents(variant.get('compare_at_price')), priceTaxIncluded=True)
        if item:
            products.append(item)
    return products


def parse_dartshopper(source):
    products = []
    decoder = json.JSONDecoder()
    for script in Document(source).root.find(lambda n: n.tag == 'script'):
        raw = script.text()
        if '.push(' not in raw or 'TWProduct' not in raw:
            continue
        try:
            payload = decoder.raw_decode(raw.split('.push(', 1)[1])[0][1]
        except (ValueError, IndexError, TypeError):
            continue
        if not isinstance(payload, str):
            continue
        for match in re.finditer(r'\{\s*"__typename"\s*:\s*"TWProduct"', payload):
            try:
                row = decoder.raw_decode(payload[match.start():])[0]
            except ValueError:
                continue
            if row.get('stockStatus') != 'inStock':
                continue
            regular = row.get('priceInclTax') or {}
            sale = row.get('salePriceInclTax') or {}
            if regular.get('currencyCode') != 'EUR':
                continue
            old = cents(regular.get('amount'))
            discounted = cents(sale.get('amount')) if sale.get('currencyCode') == 'EUR' else None
            item = product(row.get('title'), row.get('url', ''), row.get('image', ''),
                           discounted if discounted and old and discounted < old else old, old, priceTaxIncluded=True)
            if item:
                products.append(item)
    return products


def parse_campaign(source, now):
    """Only publish a dated, currently valid basket offer found in the page."""
    main = next(Document(source).root.find(lambda n: n.tag == 'main'), None)
    if not main:
        return None
    text = ' '.join(main.text().split())
    period = re.search(r'Du (\d{1,2}) au (\d{1,2}) novembre', text, re.I)
    year = re.search(r'Black Friday Fléchettes (20\d{2})', text, re.I)
    tiers = re.findall(r'-\s*(\d+)\s*€\s+dès\s+(\d+)\s*€', text)
    if not period or not year or not tiers or 'Sans code' not in text:
        return None
    try:
        tz = ZoneInfo('Europe/Paris')
        start = datetime(int(year[1]), 11, int(period[1]), tzinfo=tz)
        end = datetime(int(year[1]), 11, int(period[2]), 23, 59, 59, tzinfo=tz)
    except ValueError:
        return None
    if not start <= now <= end:
        return None
    description = ' · '.join(f'{discount} € de remise dès {threshold} €' for discount, threshold in tiers)
    return dict(text=f'Black Friday : {description} d’achat. Remise automatique au panier, non cumulable avec les autres codes.',
                url='https://pleinebull.fr/pages/black-friday', startsAt=start.isoformat(), endsAt=end.isoformat())


def select(items, limit=10):
    result, seen = [], set()
    for item in items:
        if item and item['url'] not in seen:
            seen.add(item['url'])
            result.append(item)
    return result[:limit]


FAMILIES = ('cible', 'flechettes', 'pack', 'promo')
FAMILY_URLS = {
    'olies': {
        'cible': ['https://www.olies-darts.com/54-cibles-de-flechettes-pointe-acier', 'https://www.olies-darts.com/290-cible-electronique-connectee'],
        'flechettes': ['https://www.olies-darts.com/37-flechettes-pointe-acier', 'https://www.olies-darts.com/38-flechettes-pointe-nylon'],
        'pack': ['https://www.olies-darts.com/315-pack-cible-et-armoire'],
        'promo': ['https://www.olies-darts.com/promotions']},
    'pleinebull': {
        'cible': ['https://pleinebull.fr/collections/cibles-sisal', 'https://pleinebull.fr/collections/cibles-electroniques'],
        'flechettes': ['https://pleinebull.fr/collections/flechettes-acier-steeltip', 'https://pleinebull.fr/collections/flechettes-plastique-softtip'],
        'pack': ['https://pleinebull.fr/collections/packs-kits-flechettes'],
        'promo': ['https://pleinebull.fr/collections/soldes-flechettes-promos']},
    'dartshopper': {
        'cible': ['https://www.dartshopper.fr/cibles/'],
        'flechettes': ['https://www.dartshopper.fr/pointe-acier/', 'https://www.dartshopper.fr/pointe-plastique/'],
        'pack': ['https://www.dartshopper.fr/sets/'],
        'promo': ['https://www.dartshopper.fr/vente/']}}


def family(item, hint=None):
    raw = item.get('name', '')
    name = ''.join(c for c in unicodedata.normalize('NFD', raw.lower()) if not unicodedata.combining(c))
    pack = bool(re.search(r'\b(?:pack|kit|bundle|dartset|offre groupee|ensemble)\b|\+|\bcoffret\b.*\bcible\b|\bset cible\b', name))
    # A pack of flights is a pack, never a complete set of darts.
    accessory = bool(re.search(r'\b(?:ailettes?|tiges?|shafts?|flights?|pointes?|surround|tour de cible|tours de cible|support|trepied|holder|eclairage|plasma|polaris|corona|tapis|armoires?|protection|scorage|scoring|compteur)\b', name))
    if pack or hint == 'pack':
        return 'pack'
    # "Fléchettes pointe acier" denotes full darts, despite the word "pointe".
    if hint == 'flechettes' and not re.match(r'^(?:pointes?|tiges?|ailettes?|shafts?|flights?|etuis?)\b', name):
        return 'flechettes'
    if re.match(r'^flechettes?\b', name) and not re.match(r'^flechettes?.*\b(?:ailettes?|tiges?)\b', name):
        return 'flechettes'
    if accessory:
        return 'accessoires'
    if re.search(r'\bcible\b|\bdartboard\b', name):
        return 'cible'
    return hint if hint in ('cible', 'flechettes') else 'accessoires'


def discounted(item):
    return isinstance(item.get('previousPriceCents'), int) and item['previousPriceCents'] > item['priceCents']


def collect_families(shop_id, now, previous, getter=fetch):
    checked = now.isoformat(timespec='seconds')
    families, errors, dates = {}, {}, {}
    promotion, warning = None, None
    if shop_id == 'pleinebull':
        try:
            promotion = parse_campaign(getter('https://pleinebull.fr/pages/black-friday'), now)
        except Exception:
            promotion = previous.get('promotion')
            if promotion and datetime.fromisoformat(promotion['endsAt']) < now:
                promotion = None
            warning = 'Offre panier non revérifiée : consulte les conditions du vendeur.'
    rate_limited = False
    successes = 0
    for category in FAMILIES:
        groups, failures = [], []
        for url in FAMILY_URLS[shop_id][category]:
            try:
                if rate_limited:
                    raise ValueError('rate limit: retaining last catalog')
                endpoint = url + '/products.json?limit=40' if shop_id == 'pleinebull' else url
                source = getter(endpoint)
                parser = {'olies': parse_olies, 'pleinebull': parse_shopify, 'dartshopper': parse_dartshopper}[shop_id]
                parsed = parser(source)
                group = []
                for item in parsed:
                    item['family'] = family(item, category if category != 'promo' else None)
                    item['priceCheckedAt'] = checked
                    if category == 'promo' or item['family'] == category:
                        group.append(item)
                if category != 'promo' and not group:
                    raise ValueError('No valid items in category')
                groups.append(group)
            except Exception as error:
                if isinstance(error, HTTPError) and error.code == 429:
                    rate_limited = True
                failures.append(type(error).__name__)
        items = select(item for chunk in zip_longest(*groups) for item in chunk if item)
        if groups:
            successes += 1
            families[category], dates[category] = items, checked
            if failures:
                errors[category] = 'Une partie de la sélection est indisponible.'
        else:
            old = previous.get('families', {}).get(category)
            if old is None:
                old = [dict(item, family=family(item)) for item in previous.get('products', []) if (discounted(item) if category == 'promo' else family(item) == category)]
            families[category] = old[:10]
            dates[category] = previous.get('familyUpdatedAt', {}).get(category) or previous.get('updatedAt')
            errors[category] = 'Collecte indisponible : dernier relevé conservé.'
    # PROMO is a real price reduction, or an explicitly conditional basket offer.
    families['promo'] = select([p for p in families['promo'] if discounted(p)] + [p for category in FAMILIES[:-1] for p in families[category] if discounted(p)])
    promo_kind = 'article'
    if not families['promo'] and promotion:
        families['promo'] = select(p for category in FAMILIES[:-1] for p in families[category])
        promo_kind = 'basket'
    return dict(families=families, familyErrors=errors, familyUpdatedAt=dates,
                familyUrls={key: urls[0] for key, urls in FAMILY_URLS[shop_id].items()},
                products=families['promo'] or families['cible'] or families['flechettes'] or families['pack'],
                updatedAt=min((date for date in dates.values() if date), default=previous.get('updatedAt')),
                promotion=promotion, promoKind=promo_kind, warning=warning, error=None if successes else 'Boutique indisponible.'), successes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'site/equipment.json')
    args = parser.parse_args()
    previous = json.loads(args.output.read_text()) if args.output.exists() else {}
    now = datetime.now(timezone.utc)
    old = {shop['id']: shop for shop in previous.get('shops', [])}
    shops, successes = [], 0
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {sid: executor.submit(collect_families, sid, now, old.get(sid, {})) for sid, _, _ in SHOPS}
        for sid, name, url in SHOPS:
            result, count = futures[sid].result()
            successes += int(count > 0)
            shops.append(dict(id=sid, name=name, url=url, **result))
    data = dict(schemaVersion=2, attemptedAt=now.isoformat(timespec='seconds'), shops=shops)
    args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    # Also update the immediate/offline fallback from the same checked catalog.
    (args.output.parent / 'products.js').write_text('// Dernier catalogue collecté ; equipment.json est rechargé à l’ouverture et toutes les 30 minutes.\nconst equipmentShops = ' + json.dumps(data['shops'], ensure_ascii=False, indent=2) + ';\n')
    print(f'{successes}/3 boutiques actualisées')
    if successes == 0:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
