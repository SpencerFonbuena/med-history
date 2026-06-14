# Medication dataset

A bundled, offline medication catalog for MedHistory's "add a medication" autocomplete.
When a user searches, these files let the app suggest the real drug, strength, and form and
auto-populate the fields — with no network call.

## Source

Derived from **RxNorm** via the public **RxNav REST API** (`https://rxnav.nlm.nih.gov`),
U.S. National Library of Medicine.

- **RxNorm release:** 01-Jun-2026 (RxNav apiVersion 3.1.353)
- **Generated:** 2026-06-13

RxNorm is produced by the NLM and is free to use. Per NLM's terms, this product uses publicly
available data courtesy of the U.S. National Library of Medicine; it is not endorsed by NLM,
and the data is not a substitute for professional medical judgment. RxNorm itself is in the
public domain; if RxNorm is rebuilt from source UMLS vocabularies, additional source
restrictions can apply — the RxNav `allconcepts` data used here is the freely redistributable
RxNorm layer.

## Files

| File | Entries | Contents |
|------|--------:|----------|
| `medications.json` | 27,258 | Drug products — every strength + form variation (generic + branded) |
| `ingredients.json` | 14,641 | Active-ingredient names (search aliases) |
| `brands.json` | 5,109 | Brand names (search aliases) |

### `medications.json` schema

Array of objects. Optional fields are omitted when empty.

```jsonc
{
  "rxcui": "29046",                       // RxNorm concept id (stable key)
  "name": "lisinopril 10 MG Oral Tablet", // canonical RxNorm name — authoritative display string
  "type": "generic" | "brand",
  "brand": "Prinivil",                    // present only for branded (type: "brand")
  "doseForm": "Oral Tablet",              // one of RxNorm's 126 closed-vocabulary forms
  "quantity": "0.05 ML",                  // leading fill quantity, mostly injectables
  "ingredients": [                        // one entry per active ingredient (combos have several)
    { "name": "lisinopril", "strength": "10 MG" }
  ],
  "strength": "10 MG",                    // ingredient strengths joined with " / " for convenience
  "lowConfidence": true                   // present (true) only when heuristic parsing was uncertain
}
```

**`name` is always the source of truth.** The split-out fields (`doseForm`, `ingredients`,
`strength`, `quantity`) are parsed from `name` and are best-effort. ~5% of entries — complex
injectables, pens, and inhalers (e.g. Ozempic, Humalog) — are flagged `lowConfidence`; their
`name` is still correct, so the UI can always fall back to displaying it verbatim.

## Regenerating

The raw inputs are pulled live from RxNav, so regeneration needs network access:

```sh
mkdir -p /tmp/rxnav && cd /tmp/rxnav
for tty in SCD SBD BN IN DF; do
  curl -s "https://rxnav.nlm.nih.gov/REST/allconcepts.json?tty=$tty" -o "raw_${tty}.json"
done
python3 transform.py     # writes medications.json, ingredients.json, brands.json
```

- `SCD` = generic clinical drug (strength + form), `SBD` = branded, `BN` = brand name,
  `IN` = ingredient, `DF` = the closed list of dose forms used to parse names.
- To refresh for a newer RxNorm release, just re-run; bump the dates at the top of this file.

## Notes / future ideas

- **OTC meds** are partially covered (many OTCs exist in RxNorm), but this set was not filtered
  to guarantee OTC completeness. Revisit if users need to log vitamins/supplements heavily.
- **Size:** `medications.json` is ~6.6 MB raw / ~0.5 MB gzipped. For the app, the plan is to
  load it into on-device SQLite on first launch and query from there rather than holding the
  whole array in memory.
