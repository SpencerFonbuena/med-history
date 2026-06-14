import json, re

def load(tty):
    d = json.load(open(f'raw_{tty}.json'))
    return d['minConceptGroup']['minConcept']

dose_forms = sorted((c['name'] for c in load('DF')), key=len, reverse=True)
brand_re = re.compile(r'\s*\[([^\]]+)\]\s*$')
lead_qty_re = re.compile(r'^(\d+(?:\.\d+)?\s*ML)\s+(.*)$')
digit_re = re.compile(r'\d')

def parse_form(core):
    for df in dose_forms:
        if core == df or core.endswith(' ' + df):
            return df, core[:len(core) - len(df)].strip()
    return None, core

def parse_component(comp):
    m = digit_re.search(comp)
    if not m:
        return {'name': comp.strip(), 'strength': None}
    return {'name': comp[:m.start()].strip(), 'strength': comp[m.start():].strip()}

def parse_drug(name, kind):
    brand = None
    core = name
    m = brand_re.search(core)
    if m:
        brand = m.group(1)
        core = brand_re.sub('', core)
    form, head = parse_form(core)
    qty = None
    qm = lead_qty_re.match(head)
    if qm:
        qty, head = qm.group(1), qm.group(2)
    comps = [parse_component(p) for p in head.split(' / ')] if head else []
    low_conf = form is None or any(not c['name'] for c in comps)
    strengths = [c['strength'] for c in comps if c['strength']]
    return {
        'name': name,
        'type': kind,
        'brand': brand,
        'doseForm': form,
        'quantity': qty,
        'ingredients': comps,
        'strength': ' / '.join(strengths) if strengths else None,
        'lowConfidence': low_conf or None,
    }

products = []
for tty, kind in (('SCD', 'generic'), ('SBD', 'brand')):
    for c in load(tty):
        p = parse_drug(c['name'], kind)
        p['rxcui'] = c['rxcui']
        products.append(p)

# strip None values to keep file lean
def clean(d):
    return {k: v for k, v in d.items() if v is not None}
products = [clean(p) for p in products]
products.sort(key=lambda p: (p['name'].lower(), p['rxcui']))

ingredients = sorted({c['name'] for c in load('IN')}, key=str.lower)
brands = sorted({c['name'] for c in load('BN')}, key=str.lower)

json.dump(products, open('medications.json', 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump(ingredients, open('ingredients.json', 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump(brands, open('brands.json', 'w'), ensure_ascii=False, separators=(',', ':'))

low = sum(1 for p in products if p.get('lowConfidence'))
print(f"products: {len(products)}  (low-confidence parse: {low}, {100*low/len(products):.1f}%)")
print(f"ingredients: {len(ingredients)}")
print(f"brands: {len(brands)}")
print("\n--- sample parsed products ---")
for p in products[:3] + [x for x in products if x['name'].startswith('Lisinopril 10 MG Oral Tablet')][:2]:
    print(json.dumps(clean(p), ensure_ascii=False))
