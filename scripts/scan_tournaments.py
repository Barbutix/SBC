#!/usr/bin/env python3
import json,re,urllib.request
from datetime import date,datetime,timezone
from html.parser import HTMLParser
from pathlib import Path
SOURCES=[('DartsHub','https://compet.dartshub.fr/'),('DartsMap','https://dartsmap.fr/'),('Ti an Darts','https://tiandarts.fr/tournois-flechettes-electros/'),('Calendrier°','https://calendrier.tournois-apps.com/'),('Dartzen','https://dartzen.com/tournois-flechettes-a-venir-france/'),('Phoenix France','https://phoenixfrancecompetition.fr/calendriers/')]
OUT=Path('site/event-candidates.json')
class LD(HTMLParser):
 def __init__(self): super().__init__(); self.on=False; self.cur=''; self.items=[]
 def handle_starttag(self,t,a):
  if t=='script' and dict(a).get('type','').lower()=='application/ld+json': self.on=True; self.cur=''
 def handle_data(self,d):
  if self.on:self.cur+=d
 def handle_endtag(self,t):
  if t=='script' and self.on:self.items.append(self.cur); self.on=False
def walk(x):
 if isinstance(x,list):
  for y in x: yield from walk(y)
 elif isinstance(x,dict):
  typ=x.get('@type',[]); typ=typ if isinstance(typ,list) else [typ]
  if 'Event' in typ: yield x
  for k in ('@graph','itemListElement'): yield from walk(x.get(k,[]))
def clean(x): return re.sub(r'\s+',' ',str(x or '')).strip()
def main():
 old=json.loads(OUT.read_text()) if OUT.exists() else {'events':[]}; events={e.get('url'):e for e in old.get('events',[])}; errors=[]
 for name,url in SOURCES:
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'SBC-Tournament-Scout/1.0'})
   with urllib.request.urlopen(req,timeout=20) as r: html=r.read(2500000).decode(r.headers.get_content_charset() or 'utf-8','replace')
   p=LD(); p.feed(html)
   for raw in p.items:
    try: data=json.loads(raw)
    except Exception: continue
    for e in walk(data):
     d=clean(e.get('startDate'))[:10]
     try: date.fromisoformat(d)
     except Exception: continue
     if d<date.today().isoformat(): continue
     loc=e.get('location') or {}; addr=loc.get('address',{}) if isinstance(loc,dict) else {}; link=clean(e.get('url')) or url
     events.setdefault(link,{'name':clean(e.get('name')) or 'Tournoi de fléchettes','date':d,'city':clean(addr.get('addressLocality')) if isinstance(addr,dict) else clean(loc),'department':'','format':'Acier + Soft-tip','url':link,'source':name,'status':'pending'})
  except Exception as ex: errors.append({'source':name,'error':str(ex)[:180]})
 OUT.parent.mkdir(exist_ok=True); OUT.write_text(json.dumps({'updatedAt':datetime.now(timezone.utc).isoformat(),'events':sorted(events.values(),key=lambda e:e.get('date','')),'sourceErrors':errors},ensure_ascii=False,indent=2)+'')
 print('Événements candidats:',len(events),'sources en erreur:',len(errors))
if __name__=='__main__': main()
