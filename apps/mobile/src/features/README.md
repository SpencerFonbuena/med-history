# features/

Data-owning domains. Each `features/{feature}/` answers **"what data does this feature own?"**
in one sentence (e.g. `profiles` owns medical profiles, `history` owns visits/notes/prescriptions,
`medications` owns the searchable drug catalog). See `mobile.md §3` and `frontend.md §2`.

Allowed folders inside a feature (no others):

```
components/     containers/     context/     hooks/
repositories/   schemas/        utils/
services/coordinators/   services/providers/
```

There is **no `api/`** — this app has no backend. Data access goes through `repositories/`,
which call `packages/core` (SQLite) or device APIs (FileSystem, SecureStore, StoreKit).
