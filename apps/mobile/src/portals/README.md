# portals/

Persona-specific shells that compose features. A portal owns **zero data** — it is pure
composition (see `mobile.md §3`). For MedHistory the personas are thin (it's a single-user,
local app), so portals may stay minimal or unused until a clear persona split emerges.

Allowed folders inside a portal (no others):

```
containers/   components/   hooks/ (UI state only, no data)   utils/
```

Not allowed in a portal: `api/`, `repositories/`, `schemas/`, `services/`, `context/`.
If a portal needs any of those, the logic belongs in a feature.
