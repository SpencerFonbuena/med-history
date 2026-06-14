# Entry Attachments — Design Spec

**Date:** 2026-06-14
**Branch:** `feat/entry-attachments`
**Status:** Approved design, pending implementation plan

## Summary

Let users attach images and files (X-ray photos, lab-result PDFs) to **Imaging & Tests**
(`imaging_test`) entries on a local-first Expo/React Native app. All data stays on-device:
attachment binaries live in the app's document directory; metadata lives in SQLite via
`packages/core`.

## Scope

- **Entry types:** `imaging_test` only. (The data layer supports any entry; expanding later is trivial.)
- **Timing:** attach during both **create** and **edit**.
- **Sources:** photo library, camera, and files/documents.
- **Out of scope:** export/import (future — see `docs/product-decisions.md`); attachments on
  other entry types; in-app PDF rendering (documents open in the system viewer).

## What already exists (no work needed)

`packages/core` already ships, in the initial migration (`m1-initial`), and with passing tests:

- `attachments` table: `id`, `entry_id` (FK `ON DELETE CASCADE`), `relative_path`, `mime_type`,
  `original_filename`, `size_bytes`, `created_at`; index `idx_attachments_entry`.
- `attachment.schema.ts`: `Attachment` type + `createAttachmentInput` Zod schema.
- `attachments.repository.ts`: `create`, `listByEntry`, `remove`, exposed as `db.attachments`.

The FK cascade removes attachment **rows** when an entry (or its profile) is deleted. It does
**not** remove the **files** on disk — that is this feature's responsibility (§5).

## Dependencies

Installed via `npx expo install`:

- `expo-file-system` — read/write/delete files in the app sandbox.
- `expo-image-picker` — photo library + camera.
- `expo-document-picker` — files/PDFs from the Files app.
- `expo-sharing` — hand a file to the OS to open/preview (documents).

Image thumbnails and the full-screen viewer use React Native's built-in `Image` (no extra dep).

`app.json` gains the `expo-image-picker` config plugin with camera + photo-library permission
strings. No edits to `android/` or `ios/` native folders.

> SDK 54's `expo-file-system` has a new `File`/`Directory`/`Paths` API (with a `legacy` import
> available). The exact API will be confirmed against the versioned docs during implementation.

## File storage layout

Files are stored in the **document** directory (permanent; not the evictable cache):

```
<documentDir>/attachments/{profileId}/{entryId}/{fileId}.{ext}
```

The DB `relative_path` stores `attachments/{profileId}/{entryId}/{fileId}.{ext}`; the absolute
URI is resolved at read time for display. Profile-scoped nesting makes cleanup O(1): deleting an
entry removes its folder; deleting a profile removes the whole profile folder — no row
enumeration required. Paths are deterministic and reconstructible, which keeps a future
export/import feasible.

## Architecture — new feature `src/features/attachments/`

Follows the project layer map: `container → hook → coordinator → repository → packages/core`,
with device APIs in repositories and pure logic in providers.

### repositories/
- **`attachmentFiles.repository.ts`** — wraps `expo-file-system` + `expo-sharing`:
  - `save(profileId, entryId, fileId, ext, sourceUri) → { relativePath, sizeBytes }` — copies a
    picked file into the layout above (creating directories as needed).
  - `resolveUri(relativePath) → string` — absolute URI for display.
  - `deleteFile(relativePath)`, `deleteEntryDir(profileId, entryId)`,
    `deleteProfileDir(profileId)` — all idempotent (missing path is not an error).
  - `openInSystem(relativePath, mimeType)` — `expo-sharing` preview for documents.
- **`mediaPicker.repository.ts`** — wraps `expo-image-picker` (library + camera) and
  `expo-document-picker`; returns normalized picks `{ uri, mimeType, name, size }`, or `null` on
  cancel. Requests permissions as needed.
- **`attachmentsMeta.repository.ts`** — thin 1:1 delegation to `db.attachments`
  (`create`/`listByEntry`/`remove`), mirroring `entries.repository.ts`.

### services/providers/
- **`attachmentPaths.provider.ts`** — pure helpers (no I/O, fully unit-testable):
  `buildRelativePath`, `extOf(nameOrMime)`, `isImage(mime)`, `isAllowedMime(mime)`
  (images + `application/pdf`).

### services/coordinators/
- **`attachments.coordinator.ts`** — orchestrates files + metadata, returns `Result<T>`:
  - `add(profileId, entryId, pick) → Result<Attachment>` — validate mime; save file; insert row;
    **on row-insert failure, delete the saved file** (no orphans).
  - `listByEntry(entryId) → Result<AttachmentView[]>` — rows mapped to
    `AttachmentView { ...attachment, uri, isImage }`.
  - `remove(attachment) → Result<void>` — delete row, then delete file.
  - `removeForEntry(profileId, entryId) → Result<void>` — delete the entry folder.
  - `removeForProfile(profileId) → Result<void>` — delete the profile folder.
- **`attachments.coordinator.instance.ts`** — wires the concrete repositories (matches the
  existing `*.coordinator.instance.ts` pattern).

### hooks/
- **`useEntryAttachments(entryId)`** — react-query: `useQuery` for `listByEntry` + `useMutation`
  for add/remove, invalidating `attachmentKeys.byEntry(entryId)`. `staleTime: Infinity`.
- **`useAttachmentPicker()`** — drives the add-source sheet and the `mediaPicker.repository`,
  returning a normalized pick.

### components/ (presentational)
- **`attachmentsGrid.component.tsx`** — thumbnail tiles plus an "Add" tile.
- **`attachmentThumbnail.component.tsx`** — image preview, or a file icon + filename for docs.
- **`addSourceSheet.component.tsx`** — modal with Photo Library / Camera / Files.
- **`attachmentViewerModal.component.tsx`** — full-screen image viewer; documents open via
  `openInSystem`.

### schemas/ + queryKeys.ts
- **`attachment.schema.ts`** — re-exports core types; defines `PendingPick`, `AttachmentView`,
  and the allowed-mime list.
- **`queryKeys.ts`** — `attachmentKeys = { all, byEntry(entryId) }`.

## Create vs. edit wiring

- **Edit (entry id exists):** a `LiveAttachments` container backed by `useEntryAttachments` —
  add/remove persist immediately.
- **Create (no id yet):** a `StagedAttachments` container holds picks in memory. On **Save**, the
  `NewEntry` container creates the entry, reads its id, then calls
  `attachments.coordinator.add(...)` per staged pick.
- `EntryForm` renders an attachments slot only when `type === 'imaging_test'`; `NewEntry` passes
  the staged wrapper, `EditEntry` passes the live wrapper. Both render the shared
  `attachmentsGrid` / `addSourceSheet` / `attachmentViewerModal`.

## Cascade file cleanup

The DB cascade deletes rows; files are cleaned up by composing at the **hook layer**, keeping the
`entries`/`profiles` coordinators attachment-unaware:

- `useDeleteEntry(entry)` → `attachments.removeForEntry(entry.profileId, entry.id)` then
  `entries.remove(entry.id)`. (Hook signature changes from `id` to the full entry; the edit screen
  already has it.)
- `useDeleteProfile` → `attachments.removeForProfile(profileId)` then `profiles.remove(profileId)`.

File deletes run first and are idempotent, so a missing folder is harmless and never blocks the
DB delete.

## Error handling

- Picker cancellation → no-op.
- Unsupported mime → friendly `Result` error; nothing written.
- Infrastructure failures (FS, picker) are wrapped in `Result` and never throw past the
  coordinator; surfaced as inline error or alert.
- Create flow: if the entry saves but an attachment fails, the entry is kept and a non-fatal
  warning is shown (the user can retry from the edit screen).

## Testing

- **`attachmentPaths.provider.test.ts`** — pure-function units (extension/mime/path/isImage).
- **`attachments.coordinator.test.ts`** — fake file/meta/picker ports, asserting: add saves file
  then row; add compensates (deletes file) on row failure; remove deletes row + file;
  `removeForEntry`/`removeForProfile` delete the right folder; `listByEntry` maps to
  `AttachmentView` with correct `uri`/`isImage`. Matches the existing coordinator-test pattern.
- Core attachment-repository and migration tests already pass; unchanged.

## Success criteria

1. On an Imaging & Tests entry, the user can add images (library/camera) and PDFs (files) during
   both create and edit.
2. Attachments persist across app restarts (stored in the document directory).
3. Tapping an image opens a full-screen viewer; tapping a document opens it in the system viewer.
4. Removing an attachment deletes both its row and its file.
5. Deleting an entry or profile removes all associated files (no orphans left on disk).
6. New provider and coordinator tests pass; existing suite stays green.
