import json,collections,re
it=json.load(open('.cache/inventory.json'))
rows=open('.cache/Translations0.txt',encoding='utf-8-sig').read().splitlines()
en={r.split(';')[0].strip().lower() for r in rows[1:]}
def base(n):
    n=re.sub(r'\.\d{3}$','',n.strip()); return re.sub(r'\.(l|r)$','',n).strip().lower()
g=[i for i in it if i['type'] in('MESH','CURVE') and i['triangles']>0 and not re.search(r'\.([a-km-qs-z]{1,2}\d*[lr]?)(\.\d{3})?$',i['name'])]
lay=collections.Counter(); tri=collections.Counter(); multi=collections.Counter()
for i in g:
    tops=sorted({c for c in i['collections'] if re.match(r'\d:',c)})
    multi[len(tops)]+=1; k=tops[0] if tops else 'none'; lay[k]+=1; tri[k]+=i['triangles']
for k in sorted(lay): print(k,lay[k],tri[k])
hit=sum(base(i['name']) in en for i in g)
print('geometry',len(g),'tris',sum(tri.values()),'match',f'{hit/len(g):.1%}','top-collections per object',dict(multi))
print('none sample',[(i['name'],i['collections'][:3]) for i in g if not any(re.match(r'\d:',c) for c in i['collections'])][:8])
for col in ['Internal ear','Bony labyrinth','Cochlea','Urinary system']:
    print(col,sorted({base(i['name']) for i in g if col in i['collections']}))
print('renal/kidney',sorted({base(i['name']) for i in g if re.search('kidney|renal',i['name'],re.I)}))
