# Entry Attachments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users attach images (photo library / camera) and documents (PDFs from Files) to Imaging & Tests entries, persisted on-device, during both entry creation and editing.

**Architecture:** A new `src/features/attachments/` feature. Pure path/mime logic lives in a provider; device APIs (file system, pickers, sharing) live in repositories; an `attachments.coordinator` orchestrates file+metadata so they never drift (saving compensates by deleting the file if the DB row fails; deleting removes both). React-query hooks expose live add/remove/list for the edit screen; the create screen stages picks in memory and commits them after the entry is saved. File cleanup on entry/profile delete is composed at the hook layer so the entries/profiles coordinators stay attachment-unaware.

**Tech Stack:** Expo SDK 54, React Native, TypeScript, `@tanstack/react-query`, `expo-file-system` (new `File`/`Directory`/`Paths` API), `expo-image-picker`, `expo-document-picker`, `expo-sharing`, `@med-history/core` (existing `attachments` table + repo), Vitest.

**Key facts already true (no work needed):**
- `packages/core` has the `attachments` table (FK `ON DELETE CASCADE` on `entry_id`), `Attachment` type, `createAttachmentInput` Zod schema, and `db.attachments.create/listByEntry/remove` — all tested.
- `Result<T>` lives at `@/lib/result`: `{ ok: true; data } | { ok: false; error }`, with `ok(data)` / `err(msg)`.
- Files must live in the **document** dir (permanent), laid out as `attachments/{profileId}/{entryId}/{fileId}.{ext}`.

---

## File Structure

**Create:**
- `src/features/attachments/schemas/attachment.schema.ts` — `PendingPick`, `AttachmentView`, `AttachmentSource`, allowed-mime list.
- `src/features/attachments/queryKeys.ts` — `attachmentKeys`.
- `src/features/attachments/services/providers/attachmentPaths.provider.ts` — pure path/mime helpers.
- `src/features/attachments/services/providers/attachmentPaths.provider.test.ts`
- `src/features/attachments/services/coordinators/attachments.coordinator.ts` — ports + orchestration.
- `src/features/attachments/services/coordinators/attachments.coordinator.test.ts`
- `src/features/attachments/services/coordinators/attachments.coordinator.instance.ts`
- `src/features/attachments/repositories/attachmentFiles.repository.ts` — `expo-file-system` + `expo-sharing`.
- `src/features/attachments/repositories/mediaPicker.repository.ts` — `expo-image-picker` + `expo-document-picker`.
- `src/features/attachments/repositories/attachmentsMeta.repository.ts` — delegates to `db.attachments`.
- `src/features/attachments/hooks/useAttachmentActions.hook.ts` — `pick`, `open`.
- `src/features/attachments/hooks/useEntryAttachments.hook.ts` — live list/add/remove.
- `src/features/attachments/hooks/useCommitStagedAttachments.hook.ts` — commit staged picks after create.
- `src/features/attachments/components/attachmentThumbnail.component.tsx` (+ `.styles.ts`)
- `src/features/attachments/components/attachmentsGrid.component.tsx` (+ `.styles.ts`)
- `src/features/attachments/components/addSourceSheet.component.tsx` (+ `.styles.ts`)
- `src/features/attachments/components/attachmentViewerModal.component.tsx` (+ `.styles.ts`)
- `src/features/attachments/containers/stagedAttachments.container.tsx`
- `src/features/attachments/containers/liveAttachments.container.tsx`

**Modify:**
- `app.json` — add `expo-image-picker` plugin with permission strings.
- `src/components/icon.component.tsx` — add `image`, `document`, `close`, `camera`, `folder` icons.
- `src/features/entries/components/entryForm.component.tsx` — render an `attachmentsSlot` for `imaging_test`.
- `src/features/entries/containers/newEntry.container.tsx` — stage picks; commit after create.
- `src/features/entries/containers/editEntry.container.tsx` — pass live attachments; pass full entry to delete.
- `src/features/entries/hooks/useDeleteEntry.hook.ts` — accept the entry; clean files first.
- `src/features/profiles/hooks/useDeleteProfile.hook.ts` — clean profile files first.

---

## Task 1: Install dependencies & configure permissions

**Files:**
- Modify: `apps/mobile/package.json` (via installer)
- Modify: `apps/mobile/app.json`

- [ ] **Step 1: Install the four Expo packages**

Run from `apps/mobile`:
```bash
npx expo install expo-file-system expo-image-picker expo-document-picker expo-sharing
```
Expected: all four added to `package.json` `dependencies` with SDK-54-compatible versions; exit 0.

- [ ] **Step 2: Add the image-picker config plugin to `app.json`**

In `apps/mobile/app.json`, change the `plugins` array so the `expo-image-picker` entry is added after `@react-native-community/datetimepicker`:
```json
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#208AEF",
          "android": {
            "image": "./assets/images/splash-icon.png",
            "imageWidth": 76
          }
        }
      ],
      "expo-sqlite",
      "@react-native-community/datetimepicker",
      [
        "expo-image-picker",
        {
          "photosPermission": "MedHistory uses your photos so you can attach images to a medical entry.",
          "cameraPermission": "MedHistory uses your camera so you can photograph a result and attach it to a medical entry."
        }
      ]
    ],
```
(`expo-file-system`, `expo-document-picker`, and `expo-sharing` need no plugin entry.)

- [ ] **Step 3: Typecheck still passes**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/package.json apps/mobile/app.json
git commit -m "chore(attachments): add file-system, image/document picker, sharing deps"
```

---

## Task 2: Path & mime provider (pure, TDD)

**Files:**
- Create: `apps/mobile/src/features/attachments/services/providers/attachmentPaths.provider.ts`
- Test: `apps/mobile/src/features/attachments/services/providers/attachmentPaths.provider.test.ts`

- [ ] **Step 1: Write the failing test**

Create the test file:
```ts
import { describe, it, expect } from 'vitest';
import {
  isImage,
  isAllowedMime,
  extFromMime,
  extFromName,
  extOf,
  inferMime,
  buildRelativePath,
} from './attachmentPaths.provider';

describe('attachmentPaths provider', () => {
  it('detects image mimes', () => {
    expect(isImage('image/jpeg')).toBe(true);
    expect(isImage('application/pdf')).toBe(false);
  });

  it('allows images and pdf only', () => {
    expect(isAllowedMime('image/png')).toBe(true);
    expect(isAllowedMime('application/pdf')).toBe(true);
    expect(isAllowedMime('text/plain')).toBe(false);
  });

  it('maps mime to extension', () => {
    expect(extFromMime('image/jpeg')).toBe('jpg');
    expect(extFromMime('application/pdf')).toBe('pdf');
    expect(extFromMime('image/unknown')).toBe('bin');
  });

  it('reads extension from a filename', () => {
    expect(extFromName('scan.JPG')).toBe('jpg');
    expect(extFromName('no-extension')).toBe('');
  });

  it('prefers the filename extension, falls back to mime', () => {
    expect(extOf('lab.pdf', 'application/pdf')).toBe('pdf');
    expect(extOf(null, 'image/png')).toBe('png');
  });

  it('infers mime from a name when none is given', () => {
    expect(inferMime('photo.jpg', undefined)).toBe('image/jpeg');
    expect(inferMime('report.pdf', undefined)).toBe('application/pdf');
    expect(inferMime('x', 'image/heic')).toBe('image/heic');
  });

  it('builds a profile-scoped relative path', () => {
    expect(buildRelativePath('p1', 'e1', 'f1', 'jpg')).toBe('attachments/p1/e1/f1.jpg');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/features/attachments/services/providers/attachmentPaths.provider.test.ts`
Expected: FAIL — cannot resolve `./attachmentPaths.provider`.

- [ ] **Step 3: Implement the provider**

Create:
```ts
/** Pure helpers for attachment file paths and mime handling. No I/O. */

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
};

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isAllowedMime(mimeType: string): boolean {
  return isImage(mimeType) || mimeType === 'application/pdf';
}

export function extFromMime(mimeType: string): string {
  return MIME_TO_EXT[mimeType] ?? 'bin';
}

export function extFromName(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

/** Best extension for a pick: the filename's, else derived from the mime. */
export function extOf(name: string | null, mimeType: string): string {
  return (name && extFromName(name)) || extFromMime(mimeType);
}

/** Best-effort mime for a pick that arrived without one (e.g. some images). */
export function inferMime(name: string, fallback: string | undefined): string {
  if (fallback) return fallback;
  return EXT_TO_MIME[extFromName(name)] ?? 'application/octet-stream';
}

export function buildRelativePath(
  profileId: string,
  entryId: string,
  fileId: string,
  ext: string,
): string {
  return `attachments/${profileId}/${entryId}/${fileId}.${ext}`;
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run src/features/attachments/services/providers/attachmentPaths.provider.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/attachments/services/providers/attachmentPaths.provider.ts apps/mobile/src/features/attachments/services/providers/attachmentPaths.provider.test.ts
git commit -m "feat(attachments): add pure path/mime provider with tests"
```

---

## Task 3: Schemas & query keys

**Files:**
- Create: `apps/mobile/src/features/attachments/schemas/attachment.schema.ts`
- Create: `apps/mobile/src/features/attachments/queryKeys.ts`

- [ ] **Step 1: Create the schema/type module**

```ts
import type { Attachment } from '@med-history/core';

/** Source the user picks an attachment from. */
export type AttachmentSource = 'library' | 'camera' | 'files';

/** A picked-but-not-yet-persisted file (from a picker). mimeType is always resolved. */
export interface PendingPick {
  uri: string;
  mimeType: string;
  name: string | null;
  size: number | null;
}

/** A persisted attachment enriched for display. */
export type AttachmentView = Attachment & {
  uri: string;
  isImage: boolean;
};
```

- [ ] **Step 2: Create the query-key factory**

```ts
export const attachmentKeys = {
  all: ['attachments'] as const,
  byEntry: (entryId: string) => [...attachmentKeys.all, 'entry', entryId] as const,
};
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/attachments/schemas/attachment.schema.ts apps/mobile/src/features/attachments/queryKeys.ts
git commit -m "feat(attachments): add view schemas and query keys"
```

---

## Task 4: Coordinator + ports (TDD with fakes)

**Files:**
- Create: `apps/mobile/src/features/attachments/services/coordinators/attachments.coordinator.ts`
- Test: `apps/mobile/src/features/attachments/services/coordinators/attachments.coordinator.test.ts`

- [ ] **Step 1: Write the failing test (fakes for all three ports)**

```ts
import { describe, it, expect } from 'vitest';
import { makeAttachmentsCoordinator, type AttachmentFilesPort, type AttachmentMetaPort, type AttachmentPickerPort } from './attachments.coordinator';
import type { Attachment } from '@med-history/core';
import type { PendingPick } from '../../schemas/attachment.schema';

function fakeFiles(over: Partial<AttachmentFilesPort> = {}) {
  const saved = new Set<string>();
  const port: AttachmentFilesPort = {
    save: async (profileId, entryId, fileId, ext) => {
      const relativePath = `attachments/${profileId}/${entryId}/${fileId}.${ext}`;
      saved.add(relativePath);
      return { relativePath, sizeBytes: 10 };
    },
    resolveUri: (rel) => `file:///docs/${rel}`,
    deleteFile: async (rel) => { saved.delete(rel); },
    deleteEntryDir: async () => {},
    deleteProfileDir: async () => {},
    open: async () => {},
    ...over,
  };
  return { port, saved };
}

function fakeMeta(over: Partial<AttachmentMetaPort> = {}) {
  let n = 0;
  const rows: Attachment[] = [];
  const port: AttachmentMetaPort = {
    create: async (input) => {
      const row: Attachment = {
        id: `a${++n}`,
        entryId: input.entryId,
        relativePath: input.relativePath,
        mimeType: input.mimeType,
        originalFilename: input.originalFilename ?? null,
        sizeBytes: input.sizeBytes ?? null,
        createdAt: 't',
      };
      rows.push(row);
      return row;
    },
    listByEntry: async (entryId) => rows.filter((r) => r.entryId === entryId),
    remove: async (id) => { const i = rows.findIndex((r) => r.id === id); if (i >= 0) rows.splice(i, 1); },
    ...over,
  };
  return { port, rows };
}

const fakePicker: AttachmentPickerPort = { pick: async () => null };
const pick: PendingPick = { uri: 'file:///cache/x.jpg', mimeType: 'image/jpeg', name: 'x.jpg', size: 10 };
const deps = (files: AttachmentFilesPort, meta: AttachmentMetaPort) => {
  let i = 0;
  return makeAttachmentsCoordinator({ files, meta, picker: fakePicker, genId: () => `f${++i}` });
};

describe('attachments coordinator', () => {
  it('add saves the file then records the row', async () => {
    const f = fakeFiles();
    const m = fakeMeta();
    const r = await deps(f.port, m.port).add('p1', 'e1', pick);
    expect(r.ok).toBe(true);
    expect(m.rows).toHaveLength(1);
    expect(m.rows[0].relativePath).toBe('attachments/p1/e1/f1.jpg');
    expect(f.saved.has('attachments/p1/e1/f1.jpg')).toBe(true);
  });

  it('add rejects an unsupported mime without writing anything', async () => {
    const f = fakeFiles();
    const m = fakeMeta();
    const r = await deps(f.port, m.port).add('p1', 'e1', { ...pick, mimeType: 'text/plain' });
    expect(r.ok).toBe(false);
    expect(f.saved.size).toBe(0);
    expect(m.rows).toHaveLength(0);
  });

  it('add deletes the saved file if the row insert fails', async () => {
    const f = fakeFiles();
    const m = fakeMeta({ create: async () => { throw new Error('db fail'); } });
    const r = await deps(f.port, m.port).add('p1', 'e1', pick);
    expect(r.ok).toBe(false);
    expect(f.saved.size).toBe(0); // compensated
  });

  it('listByEntry maps rows to views with uri and isImage', async () => {
    const f = fakeFiles();
    const m = fakeMeta();
    const c = deps(f.port, m.port);
    await c.add('p1', 'e1', pick);
    const r = await c.listByEntry('e1');
    expect(r.ok && r.data[0].uri).toBe('file:///docs/attachments/p1/e1/f1.jpg');
    expect(r.ok && r.data[0].isImage).toBe(true);
  });

  it('remove deletes the row and the file', async () => {
    const f = fakeFiles();
    const m = fakeMeta();
    const c = deps(f.port, m.port);
    await c.add('p1', 'e1', pick);
    const row = m.rows[0];
    const r = await c.remove(row);
    expect(r.ok).toBe(true);
    expect(m.rows).toHaveLength(0);
    expect(f.saved.size).toBe(0);
  });

  it('removeForEntry and removeForProfile delegate to the file ports', async () => {
    let entryDir = '';
    let profileDir = '';
    const f = fakeFiles({
      deleteEntryDir: async (p, e) => { entryDir = `${p}/${e}`; },
      deleteProfileDir: async (p) => { profileDir = p; },
    });
    const c = deps(f.port, fakeMeta().port);
    await c.removeForEntry('p1', 'e1');
    await c.removeForProfile('p1');
    expect(entryDir).toBe('p1/e1');
    expect(profileDir).toBe('p1');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/features/attachments/services/coordinators/attachments.coordinator.test.ts`
Expected: FAIL — cannot resolve `./attachments.coordinator`.

- [ ] **Step 3: Implement the coordinator**

```ts
import type { Attachment, CreateAttachmentInput } from '@med-history/core';
import { ok, err, type Result } from '@/lib/result';
import type { AttachmentSource, AttachmentView, PendingPick } from '../../schemas/attachment.schema';
import { isAllowedMime, isImage, extOf } from '../providers/attachmentPaths.provider';

export interface AttachmentFilesPort {
  save(profileId: string, entryId: string, fileId: string, ext: string, sourceUri: string): Promise<{ relativePath: string; sizeBytes: number | null }>;
  resolveUri(relativePath: string): string;
  deleteFile(relativePath: string): Promise<void>;
  deleteEntryDir(profileId: string, entryId: string): Promise<void>;
  deleteProfileDir(profileId: string): Promise<void>;
  open(uri: string, mimeType: string): Promise<void>;
}

export interface AttachmentPickerPort {
  pick(source: AttachmentSource): Promise<PendingPick | null>;
}

export interface AttachmentMetaPort {
  create(input: CreateAttachmentInput): Promise<Attachment>;
  listByEntry(entryId: string): Promise<Attachment[]>;
  remove(id: string): Promise<void>;
}

export interface AttachmentDeps {
  files: AttachmentFilesPort;
  picker: AttachmentPickerPort;
  meta: AttachmentMetaPort;
  genId: () => string;
}

export function makeAttachmentsCoordinator({ files, picker, meta, genId }: AttachmentDeps) {
  async function pick(source: AttachmentSource): Promise<Result<PendingPick | null>> {
    try {
      return ok(await picker.pick(source));
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function add(profileId: string, entryId: string, picked: PendingPick): Promise<Result<Attachment>> {
    if (!isAllowedMime(picked.mimeType)) return err('Only images and PDFs can be attached.');
    const fileId = genId();
    const ext = extOf(picked.name, picked.mimeType);
    let saved: { relativePath: string; sizeBytes: number | null };
    try {
      saved = await files.save(profileId, entryId, fileId, ext, picked.uri);
    } catch (e) {
      return err((e as Error).message);
    }
    try {
      const row = await meta.create({
        entryId,
        relativePath: saved.relativePath,
        mimeType: picked.mimeType,
        originalFilename: picked.name ?? undefined,
        sizeBytes: saved.sizeBytes ?? undefined,
      });
      return ok(row);
    } catch (e) {
      await files.deleteFile(saved.relativePath); // compensate — no orphan files
      return err((e as Error).message);
    }
  }

  async function listByEntry(entryId: string): Promise<Result<AttachmentView[]>> {
    try {
      const rows = await meta.listByEntry(entryId);
      return ok(rows.map((r) => ({ ...r, uri: files.resolveUri(r.relativePath), isImage: isImage(r.mimeType) })));
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function remove(attachment: Attachment): Promise<Result<void>> {
    try {
      await meta.remove(attachment.id);
      await files.deleteFile(attachment.relativePath);
      return ok(undefined);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function removeForEntry(profileId: string, entryId: string): Promise<Result<void>> {
    try {
      await files.deleteEntryDir(profileId, entryId);
      return ok(undefined);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function removeForProfile(profileId: string): Promise<Result<void>> {
    try {
      await files.deleteProfileDir(profileId);
      return ok(undefined);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function open(uri: string, mimeType: string): Promise<Result<void>> {
    try {
      await files.open(uri, mimeType);
      return ok(undefined);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  return { pick, add, listByEntry, remove, removeForEntry, removeForProfile, open };
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npx vitest run src/features/attachments/services/coordinators/attachments.coordinator.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/attachments/services/coordinators/attachments.coordinator.ts apps/mobile/src/features/attachments/services/coordinators/attachments.coordinator.test.ts
git commit -m "feat(attachments): add coordinator orchestrating files + metadata with tests"
```

---

## Task 5: File-system repository

**Files:**
- Create: `apps/mobile/src/features/attachments/repositories/attachmentFiles.repository.ts`

- [ ] **Step 1: Implement the file repository**

```ts
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { AttachmentFilesPort } from '../services/coordinators/attachments.coordinator';

/** Device file storage for attachments, under <documentDir>/attachments/{profileId}/{entryId}/. */
export const attachmentFilesRepository: AttachmentFilesPort = {
  async save(profileId, entryId, fileId, ext, sourceUri) {
    const dir = new Directory(Paths.document, 'attachments', profileId, entryId);
    if (!dir.exists) dir.create({ intermediates: true });
    const dest = new File(dir, `${fileId}.${ext}`);
    new File(sourceUri).copy(dest);
    return { relativePath: `attachments/${profileId}/${entryId}/${fileId}.${ext}`, sizeBytes: dest.size ?? null };
  },

  resolveUri(relativePath) {
    return new File(Paths.document, ...relativePath.split('/')).uri;
  },

  async deleteFile(relativePath) {
    const file = new File(Paths.document, ...relativePath.split('/'));
    if (file.exists) file.delete();
  },

  async deleteEntryDir(profileId, entryId) {
    const dir = new Directory(Paths.document, 'attachments', profileId, entryId);
    if (dir.exists) dir.delete();
  },

  async deleteProfileDir(profileId) {
    const dir = new Directory(Paths.document, 'attachments', profileId);
    if (dir.exists) dir.delete();
  },

  async open(uri, mimeType) {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType });
    }
  },
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean. (If the SDK types differ from the snippet above, consult `https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/` and adjust — the contract `AttachmentFilesPort` must stay unchanged.)

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/attachments/repositories/attachmentFiles.repository.ts
git commit -m "feat(attachments): add expo-file-system + sharing repository"
```

---

## Task 6: Media picker repository

**Files:**
- Create: `apps/mobile/src/features/attachments/repositories/mediaPicker.repository.ts`

- [ ] **Step 1: Implement the picker repository**

```ts
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { AttachmentPickerPort } from '../services/coordinators/attachments.coordinator';
import type { PendingPick } from '../schemas/attachment.schema';
import { inferMime } from '../services/providers/attachmentPaths.provider';

async function fromLibrary(): Promise<PendingPick | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Photo library permission was denied.');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, mimeType: inferMime(a.fileName ?? a.uri, a.mimeType), name: a.fileName ?? null, size: a.fileSize ?? null };
}

async function fromCamera(): Promise<PendingPick | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Camera permission was denied.');
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, mimeType: inferMime(a.fileName ?? a.uri, a.mimeType), name: a.fileName ?? null, size: a.fileSize ?? null };
}

async function fromFiles(): Promise<PendingPick | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, mimeType: inferMime(a.name, a.mimeType), name: a.name, size: a.size ?? null };
}

export const mediaPickerRepository: AttachmentPickerPort = {
  pick(source) {
    if (source === 'library') return fromLibrary();
    if (source === 'camera') return fromCamera();
    return fromFiles();
  },
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/attachments/repositories/mediaPicker.repository.ts
git commit -m "feat(attachments): add image/document picker repository"
```

---

## Task 7: Metadata repository

**Files:**
- Create: `apps/mobile/src/features/attachments/repositories/attachmentsMeta.repository.ts`

- [ ] **Step 1: Implement the metadata repository**

```ts
import { getDatabase } from '@/lib/db/database';
import type { AttachmentMetaPort } from '../services/coordinators/attachments.coordinator';

/** Device-backed metadata port: thin 1:1 delegation to core's attachments repo. */
export const attachmentsMetaRepository: AttachmentMetaPort = {
  async create(input) {
    return (await getDatabase()).attachments.create(input);
  },
  async listByEntry(entryId) {
    return (await getDatabase()).attachments.listByEntry(entryId);
  },
  async remove(id) {
    return (await getDatabase()).attachments.remove(id);
  },
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/attachments/repositories/attachmentsMeta.repository.ts
git commit -m "feat(attachments): add metadata repository delegating to core"
```

---

## Task 8: Coordinator instance (wire the ports)

**Files:**
- Create: `apps/mobile/src/features/attachments/services/coordinators/attachments.coordinator.instance.ts`

- [ ] **Step 1: Wire the concrete repositories + id generator**

```ts
import * as Crypto from 'expo-crypto';
import { makeAttachmentsCoordinator } from './attachments.coordinator';
import { attachmentFilesRepository } from '../../repositories/attachmentFiles.repository';
import { mediaPickerRepository } from '../../repositories/mediaPicker.repository';
import { attachmentsMetaRepository } from '../../repositories/attachmentsMeta.repository';

/** App-wide attachments coordinator wired to device-backed repositories. */
export const attachmentsCoordinator = makeAttachmentsCoordinator({
  files: attachmentFilesRepository,
  picker: mediaPickerRepository,
  meta: attachmentsMetaRepository,
  genId: () => Crypto.randomUUID(),
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/features/attachments/services/coordinators/attachments.coordinator.instance.ts
git commit -m "feat(attachments): wire attachments coordinator instance"
```

---

## Task 9: Hooks

**Files:**
- Create: `apps/mobile/src/features/attachments/hooks/useAttachmentActions.hook.ts`
- Create: `apps/mobile/src/features/attachments/hooks/useEntryAttachments.hook.ts`
- Create: `apps/mobile/src/features/attachments/hooks/useCommitStagedAttachments.hook.ts`

- [ ] **Step 1: `useAttachmentActions` (pick + open)**

```ts
import { attachmentsCoordinator } from '../services/coordinators/attachments.coordinator.instance';
import type { AttachmentSource, PendingPick } from '../schemas/attachment.schema';

/** Device actions shared by staged and live attachment UIs: pick a file, open one. */
export function useAttachmentActions() {
  async function pick(source: AttachmentSource): Promise<PendingPick | null> {
    const r = await attachmentsCoordinator.pick(source);
    if (!r.ok) throw new Error(r.error);
    return r.data;
  }
  async function open(uri: string, mimeType: string): Promise<void> {
    const r = await attachmentsCoordinator.open(uri, mimeType);
    if (!r.ok) throw new Error(r.error);
  }
  return { pick, open };
}
```

- [ ] **Step 2: `useEntryAttachments` (live list/add/remove)**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Attachment } from '@med-history/core';
import { attachmentsCoordinator } from '../services/coordinators/attachments.coordinator.instance';
import { attachmentKeys } from '../queryKeys';
import type { PendingPick } from '../schemas/attachment.schema';

export function useEntryAttachments(profileId: string, entryId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: attachmentKeys.byEntry(entryId) });

  const query = useQuery({
    queryKey: attachmentKeys.byEntry(entryId),
    queryFn: async () => {
      const r = await attachmentsCoordinator.listByEntry(entryId);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    enabled: entryId.length > 0,
    staleTime: Infinity,
  });

  const addM = useMutation({
    mutationFn: async (pick: PendingPick) => {
      const r = await attachmentsCoordinator.add(profileId, entryId, pick);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: invalidate,
  });

  const removeM = useMutation({
    mutationFn: async (attachment: Attachment) => {
      const r = await attachmentsCoordinator.remove(attachment);
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: invalidate,
  });

  return {
    attachments: query.data ?? [],
    loading: query.isLoading,
    error: query.isError ? (query.error as Error).message : null,
    add: (pick: PendingPick) => addM.mutateAsync(pick),
    remove: (attachment: Attachment) => removeM.mutateAsync(attachment),
    busy: addM.isPending || removeM.isPending,
  };
}
```

- [ ] **Step 3: `useCommitStagedAttachments` (commit picks after entry create)**

```ts
import { attachmentsCoordinator } from '../services/coordinators/attachments.coordinator.instance';
import type { PendingPick } from '../schemas/attachment.schema';

/** Persists staged picks against a freshly-created entry. Returns how many failed. */
export function useCommitStagedAttachments() {
  async function commit(profileId: string, entryId: string, picks: PendingPick[]): Promise<{ failures: number }> {
    let failures = 0;
    for (const pick of picks) {
      const r = await attachmentsCoordinator.add(profileId, entryId, pick);
      if (!r.ok) failures += 1;
    }
    return { failures };
  }
  return { commit };
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/attachments/hooks
git commit -m "feat(attachments): add picker/open, live, and staged-commit hooks"
```

---

## Task 10: Add icons used by the attachment UI

**Files:**
- Modify: `apps/mobile/src/components/icon.component.tsx`

- [ ] **Step 1: Extend the IconName union**

In `icon.component.tsx`, add the new names to the `IconName` union (after `'check'`):
```ts
  | 'check'
  | 'image'
  | 'document'
  | 'camera'
  | 'folder'
  | 'close'
  | 'calendar';
```

- [ ] **Step 2: Add their registry entries**

In `ICON_REGISTRY`, add after the `check` entry:
```ts
  check: { Family: Ionicons as never, name: 'checkmark' },
  image: { Family: Ionicons as never, name: 'image-outline' },
  document: { Family: Ionicons as never, name: 'document-outline' },
  camera: { Family: Ionicons as never, name: 'camera-outline' },
  folder: { Family: Ionicons as never, name: 'folder-outline' },
  close: { Family: Ionicons as never, name: 'close' },
  calendar: { Family: Ionicons as never, name: 'calendar-outline' },
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/components/icon.component.tsx
git commit -m "feat(attachments): add image/document/camera/folder/close icons"
```

---

## Task 11: Presentational components

**Files:**
- Create: `apps/mobile/src/features/attachments/components/attachmentThumbnail.component.tsx` + `.styles.ts`
- Create: `apps/mobile/src/features/attachments/components/attachmentsGrid.component.tsx` + `.styles.ts`
- Create: `apps/mobile/src/features/attachments/components/addSourceSheet.component.tsx` + `.styles.ts`
- Create: `apps/mobile/src/features/attachments/components/attachmentViewerModal.component.tsx` + `.styles.ts`

A shared display item shape is used by the grid (works for both staged picks and persisted attachments):
```ts
// (declared inline in attachmentsGrid.component.tsx)
export interface GridItem {
  key: string;
  uri: string;
  isImage: boolean;
  name: string | null;
}
```

- [ ] **Step 1: `attachmentThumbnail` styles**

`attachmentThumbnail.styles.ts`:
```ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeAttachmentThumbnailStyles = (theme: Theme) =>
  StyleSheet.create({
    tile: {
      width: 96,
      height: 96,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      backgroundColor: theme.colors.bgElement,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    image: { width: '100%', height: '100%' },
    doc: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs, padding: theme.spacing.xs },
    docName: { color: theme.colors.textSecondary, fontSize: theme.text.caption, textAlign: 'center' },
    remove: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 22,
      height: 22,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.bgApp,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
```

- [ ] **Step 2: `attachmentThumbnail` component**

`attachmentThumbnail.component.tsx`:
```tsx
import { Image, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon } from '@/components/icon.component';
import { makeAttachmentThumbnailStyles } from './attachmentThumbnail.styles';

export function AttachmentThumbnail({
  uri,
  isImage,
  name,
  onPress,
  onRemove,
}: {
  uri: string;
  isImage: boolean;
  name: string | null;
  onPress: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const styles = makeAttachmentThumbnailStyles(theme);
  return (
    <Pressable style={styles.tile} onPress={onPress} accessibilityLabel={name ?? 'Attachment'}>
      {isImage ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.doc}>
          <Icon name="document" size={28} color={theme.colors.accent} />
          <Text style={styles.docName} numberOfLines={2}>
            {name ?? 'Document'}
          </Text>
        </View>
      )}
      <Pressable style={styles.remove} onPress={onRemove} accessibilityLabel="Remove attachment" hitSlop={8}>
        <Icon name="close" size={14} color={theme.colors.textSecondary} />
      </Pressable>
    </Pressable>
  );
}
```

- [ ] **Step 3: `attachmentsGrid` styles**

`attachmentsGrid.styles.ts`:
```ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeAttachmentsGridStyles = (theme: Theme) =>
  StyleSheet.create({
    label: { color: theme.colors.textSecondary, fontSize: theme.text.footnote, marginBottom: theme.spacing.xs },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    addTile: {
      width: 96,
      height: 96,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.bgApp,
    },
    addLabel: { color: theme.colors.textSecondary, fontSize: theme.text.caption },
  });
```

- [ ] **Step 4: `attachmentsGrid` component**

`attachmentsGrid.component.tsx`:
```tsx
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon } from '@/components/icon.component';
import { AttachmentThumbnail } from './attachmentThumbnail.component';
import { makeAttachmentsGridStyles } from './attachmentsGrid.styles';

export interface GridItem {
  key: string;
  uri: string;
  isImage: boolean;
  name: string | null;
}

export function AttachmentsGrid({
  items,
  onAdd,
  onOpen,
  onRemove,
}: {
  items: GridItem[];
  onAdd: () => void;
  onOpen: (item: GridItem) => void;
  onRemove: (item: GridItem) => void;
}) {
  const theme = useTheme();
  const styles = makeAttachmentsGridStyles(theme);
  return (
    <View>
      <Text style={styles.label}>Attachments</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <AttachmentThumbnail
            key={item.key}
            uri={item.uri}
            isImage={item.isImage}
            name={item.name}
            onPress={() => onOpen(item)}
            onRemove={() => onRemove(item)}
          />
        ))}
        <Pressable style={styles.addTile} onPress={onAdd} accessibilityLabel="Add attachment">
          <Icon name="add" size={24} color={theme.colors.accent} />
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 5: `addSourceSheet` styles**

`addSourceSheet.styles.ts`:
```ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeAddSourceSheetStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
      backgroundColor: theme.colors.bgApp,
      borderTopLeftRadius: theme.radius.lg,
      borderTopRightRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    title: { color: theme.colors.textPrimary, fontSize: theme.text.subtitle, fontWeight: '600', marginBottom: theme.spacing.sm },
    option: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.md },
    optionLabel: { color: theme.colors.textPrimary, fontSize: theme.text.callout },
    cancel: { marginTop: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radius.md, alignItems: 'center', backgroundColor: theme.colors.bgElement },
    cancelLabel: { color: theme.colors.textPrimary, fontSize: theme.text.callout, fontWeight: '600' },
  });
```

- [ ] **Step 6: `addSourceSheet` component**

`addSourceSheet.component.tsx`:
```tsx
import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme.hook';
import { Icon, type IconName } from '@/components/icon.component';
import type { AttachmentSource } from '../schemas/attachment.schema';
import { makeAddSourceSheetStyles } from './addSourceSheet.styles';

const OPTIONS: { source: AttachmentSource; label: string; icon: IconName }[] = [
  { source: 'library', label: 'Photo Library', icon: 'image' },
  { source: 'camera', label: 'Take Photo', icon: 'camera' },
  { source: 'files', label: 'Files', icon: 'folder' },
];

export function AddSourceSheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: AttachmentSource) => void;
}) {
  const theme = useTheme();
  const styles = makeAddSourceSheetStyles(theme);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Add attachment</Text>
          {OPTIONS.map((opt) => (
            <Pressable key={opt.source} style={styles.option} onPress={() => onSelect(opt.source)}>
              <Icon name={opt.icon} size={22} color={theme.colors.accent} />
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

- [ ] **Step 7: `attachmentViewerModal` styles**

`attachmentViewerModal.styles.ts`:
```ts
import { StyleSheet } from 'react-native';
import type { Theme } from '@/constants/theme';

export const makeAttachmentViewerStyles = (theme: Theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: '#000000' },
    image: { flex: 1 },
    close: {
      position: 'absolute',
      top: theme.spacing.xl,
      right: theme.spacing.lg,
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
```

- [ ] **Step 8: `attachmentViewerModal` component (images only; docs open via system)**

`attachmentViewerModal.component.tsx`:
```tsx
import { Image, Modal, Pressable } from 'react-native';
import { Icon } from '@/components/icon.component';
import { useTheme } from '@/hooks/useTheme.hook';
import { makeAttachmentViewerStyles } from './attachmentViewerModal.styles';

export function AttachmentViewerModal({
  uri,
  onClose,
}: {
  uri: string | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const styles = makeAttachmentViewerStyles(theme);
  return (
    <Modal visible={uri !== null} transparent={false} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {uri && <Image source={{ uri }} style={styles.image} resizeMode="contain" />}
        <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Close">
          <Icon name="close" size={22} color="#ffffff" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

- [ ] **Step 9: Typecheck & commit**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.
```bash
git add apps/mobile/src/features/attachments/components
git commit -m "feat(attachments): add grid, thumbnail, source sheet, and viewer components"
```

---

## Task 12: Behavior containers (staged + live)

**Files:**
- Create: `apps/mobile/src/features/attachments/containers/stagedAttachments.container.tsx`
- Create: `apps/mobile/src/features/attachments/containers/liveAttachments.container.tsx`

Both render `AttachmentsGrid` + `AddSourceSheet` + `AttachmentViewerModal`. The staged one is controlled (in-memory picks for the create flow); the live one is entry-backed (persists immediately for the edit flow).

- [ ] **Step 1: `stagedAttachments` container (create flow)**

```tsx
import { useState } from 'react';
import { Alert } from 'react-native';
import { useAttachmentActions } from '../hooks/useAttachmentActions.hook';
import { isImage } from '../services/providers/attachmentPaths.provider';
import { AttachmentsGrid, type GridItem } from '../components/attachmentsGrid.component';
import { AddSourceSheet } from '../components/addSourceSheet.component';
import { AttachmentViewerModal } from '../components/attachmentViewerModal.component';
import type { AttachmentSource, PendingPick } from '../schemas/attachment.schema';

/** Create-flow attachments: picks are held in memory and committed when the entry is saved. */
export function StagedAttachments({
  picks,
  onChange,
}: {
  picks: PendingPick[];
  onChange: (picks: PendingPick[]) => void;
}) {
  const { pick, open } = useAttachmentActions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const items: GridItem[] = picks.map((p, i) => ({
    key: `${i}-${p.uri}`,
    uri: p.uri,
    isImage: isImage(p.mimeType),
    name: p.name,
  }));

  async function choose(source: AttachmentSource) {
    setSheetOpen(false);
    try {
      const picked = await pick(source);
      if (picked) onChange([...picks, picked]);
    } catch (e) {
      Alert.alert('Could not add attachment', (e as Error).message);
    }
  }

  function openItem(item: GridItem) {
    const p = picks.find((x) => x.uri === item.uri);
    if (!p) return;
    if (item.isImage) setViewerUri(item.uri);
    else void open(p.uri, p.mimeType).catch((e) => Alert.alert('Could not open file', (e as Error).message));
  }

  return (
    <>
      <AttachmentsGrid
        items={items}
        onAdd={() => setSheetOpen(true)}
        onOpen={openItem}
        onRemove={(item) => onChange(picks.filter((x) => x.uri !== item.uri))}
      />
      <AddSourceSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onSelect={choose} />
      <AttachmentViewerModal uri={viewerUri} onClose={() => setViewerUri(null)} />
    </>
  );
}
```

- [ ] **Step 2: `liveAttachments` container (edit flow)**

```tsx
import { useState } from 'react';
import { Alert } from 'react-native';
import { useEntryAttachments } from '../hooks/useEntryAttachments.hook';
import { useAttachmentActions } from '../hooks/useAttachmentActions.hook';
import { AttachmentsGrid, type GridItem } from '../components/attachmentsGrid.component';
import { AddSourceSheet } from '../components/addSourceSheet.component';
import { AttachmentViewerModal } from '../components/attachmentViewerModal.component';
import type { AttachmentSource } from '../schemas/attachment.schema';

/** Edit-flow attachments: add/remove persist immediately against an existing entry. */
export function LiveAttachments({ profileId, entryId }: { profileId: string; entryId: string }) {
  const { attachments, add, remove } = useEntryAttachments(profileId, entryId);
  const { pick, open } = useAttachmentActions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const items: GridItem[] = attachments.map((a) => ({ key: a.id, uri: a.uri, isImage: a.isImage, name: a.originalFilename }));

  async function choose(source: AttachmentSource) {
    setSheetOpen(false);
    try {
      const picked = await pick(source);
      if (picked) await add(picked);
    } catch (e) {
      Alert.alert('Could not add attachment', (e as Error).message);
    }
  }

  function openItem(item: GridItem) {
    const a = attachments.find((x) => x.id === item.key);
    if (!a) return;
    if (a.isImage) setViewerUri(a.uri);
    else void open(a.uri, a.mimeType).catch((e) => Alert.alert('Could not open file', (e as Error).message));
  }

  return (
    <>
      <AttachmentsGrid
        items={items}
        onAdd={() => setSheetOpen(true)}
        onOpen={openItem}
        onRemove={(item) => {
          const a = attachments.find((x) => x.id === item.key);
          if (a) void remove(a).catch((e) => Alert.alert('Could not remove', (e as Error).message));
        }}
      />
      <AddSourceSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onSelect={choose} />
      <AttachmentViewerModal uri={viewerUri} onClose={() => setViewerUri(null)} />
    </>
  );
}
```

- [ ] **Step 3: Typecheck & commit**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.
```bash
git add apps/mobile/src/features/attachments/containers
git commit -m "feat(attachments): add staged (create) and live (edit) attachment containers"
```

---

## Task 13: Wire attachments into the entry form & screens

**Files:**
- Modify: `apps/mobile/src/features/entries/components/entryForm.component.tsx`
- Modify: `apps/mobile/src/features/entries/containers/newEntry.container.tsx`
- Modify: `apps/mobile/src/features/entries/containers/editEntry.container.tsx`

- [ ] **Step 1: Add an `attachmentsSlot` prop to `EntryForm`**

In `entryForm.component.tsx`, add `attachmentsSlot` to the props type (after `onDelete?`):
```tsx
  onDelete?: () => void;
  attachmentsSlot?: React.ReactNode;
```
Add `attachmentsSlot` to the destructured params (after `onDelete`):
```tsx
  onDelete,
  attachmentsSlot,
}: {
```
Render it just before the `{error && ...}` line:
```tsx
      {attachmentsSlot}

      {error && <Text style={styles.error}>{error}</Text>}
```
Add the React import at the top if not present:
```tsx
import React, { useState } from 'react';
```

- [ ] **Step 2: `NewEntry` — stage picks and commit after create**

Replace `newEntry.container.tsx` with:
```tsx
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import type { EntryType } from '@med-history/core';
import { useTheme } from '@/hooks/useTheme.hook';
import { regionParamToCode } from '@/features/body/utils/regionParam';
import { StagedAttachments } from '@/features/attachments/containers/stagedAttachments.container';
import { useCommitStagedAttachments } from '@/features/attachments/hooks/useCommitStagedAttachments.hook';
import type { PendingPick } from '@/features/attachments/schemas/attachment.schema';
import { useCreateEntry } from '../hooks/useCreateEntry.hook';
import { EntryForm } from '../components/entryForm.component';
import { buildCreateInput } from '../services/providers/entryTypes.provider';
import { makeEntryModalStyles } from './entryModal.styles';

export function NewEntryContainer() {
  const theme = useTheme();
  const styles = makeEntryModalStyles(theme);
  const { id, code, type, label } = useLocalSearchParams<{ id: string; code: string; type: EntryType; label?: string }>();
  const { createEntry, saving } = useCreateEntry();
  const { commit } = useCommitStagedAttachments();
  const [picks, setPicks] = useState<PendingPick[]>([]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>New entry</Text>
        {label && <Text style={styles.subtitle}>{label}</Text>}
        <EntryForm
          type={type}
          submitting={saving}
          attachmentsSlot={
            type === 'imaging_test' ? <StagedAttachments picks={picks} onChange={setPicks} /> : undefined
          }
          onSubmit={async (values, medication) => {
            const entry = await createEntry(
              buildCreateInput(id ?? '', regionParamToCode(code ?? ''), type, values, medication),
            );
            if (picks.length > 0) {
              const { failures } = await commit(entry.profileId, entry.id, picks);
              if (failures > 0) {
                Alert.alert('Some attachments failed', `${failures} file(s) could not be saved. You can add them again from the entry.`);
              }
            }
            router.back();
          }}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: `EditEntry` — render live attachments**

In `editEntry.container.tsx`, add the import:
```tsx
import { LiveAttachments } from '@/features/attachments/containers/liveAttachments.container';
```
Add the `attachmentsSlot` prop to the `<EntryForm ...>` (after `submitting={saving}`):
```tsx
          attachmentsSlot={
            entry.type === 'imaging_test'
              ? <LiveAttachments profileId={entry.profileId} entryId={entry.id} />
              : undefined
          }
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/entries/components/entryForm.component.tsx apps/mobile/src/features/entries/containers/newEntry.container.tsx apps/mobile/src/features/entries/containers/editEntry.container.tsx
git commit -m "feat(attachments): surface attachments in the imaging/test entry form"
```

---

## Task 14: Cascade file cleanup on delete

**Files:**
- Modify: `apps/mobile/src/features/entries/hooks/useDeleteEntry.hook.ts`
- Modify: `apps/mobile/src/features/entries/containers/editEntry.container.tsx`
- Modify: `apps/mobile/src/features/profiles/hooks/useDeleteProfile.hook.ts`

- [ ] **Step 1: `useDeleteEntry` cleans files first, takes the full entry**

Replace `useDeleteEntry.hook.ts` with:
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bodyKeys } from '@/features/body/queryKeys';
import { attachmentsCoordinator } from '@/features/attachments/services/coordinators/attachments.coordinator.instance';
import { entriesCoordinator } from '../services/coordinators/entries.coordinator.instance';
import { entriesKeys } from '../queryKeys';

export function useDeleteEntry() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (entry: { id: string; profileId: string }) => {
      // Files first (idempotent), then the DB row (which cascades attachment rows).
      await attachmentsCoordinator.removeForEntry(entry.profileId, entry.id);
      const r = await entriesCoordinator.remove(entry.id);
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: entriesKeys.all });
      await qc.invalidateQueries({ queryKey: bodyKeys.all });
    },
  });
  return {
    deleteEntry: (entry: { id: string; profileId: string }) => mutation.mutateAsync(entry),
    deleting: mutation.isPending,
  };
}
```

- [ ] **Step 2: Update the edit screen's delete call**

In `editEntry.container.tsx`, the `confirmDelete` handler currently calls `deleteEntry(currentEntry.id)`. Change that call to pass the entry:
```tsx
          await deleteEntry({ id: currentEntry.id, profileId: currentEntry.profileId });
```
(`currentEntry` is already in scope in `confirmDelete`.)

- [ ] **Step 3: `useDeleteProfile` cleans the profile's files first**

Replace `useDeleteProfile.hook.ts` with:
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsCoordinator } from '@/features/attachments/services/coordinators/attachments.coordinator.instance';
import { profilesCoordinator } from '../services/coordinators/profiles.coordinator.instance';
import { profilesKeys } from '../queryKeys';

export function useDeleteProfile() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      // Remove the profile's entire attachment folder, then the profile row (cascades entries + attachment rows).
      await attachmentsCoordinator.removeForProfile(id);
      const r = await profilesCoordinator.remove(id);
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: profilesKeys.all });
    },
  });
  return { deleteProfile: (id: string) => mutation.mutateAsync(id), deleting: mutation.isPending };
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean. (The edit container is the only caller of `deleteEntry`; the profile-settings container calls `deleteProfile(profile.id)` — unchanged signature.)

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/entries/hooks/useDeleteEntry.hook.ts apps/mobile/src/features/entries/containers/editEntry.container.tsx apps/mobile/src/features/profiles/hooks/useDeleteProfile.hook.ts
git commit -m "feat(attachments): delete attachment files when entries/profiles are removed"
```

---

## Task 15: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck the whole app**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 2: Run the full test suite**

Run: `npx vitest run`
Expected: all pass, including the new `attachmentPaths.provider` (7) and `attachments.coordinator` (6) tests, and the existing core attachment/migration suites.

- [ ] **Step 3: Lint the changed files**

Run: `npx expo lint`
Expected: no new errors in `src/features/attachments/**` or the modified entry/profile files. (Pre-existing warnings elsewhere are out of scope.)

- [ ] **Step 4: Manual smoke test (device/simulator)**

Run: `npx expo run:ios` (or `run:android`). Then verify:
1. Open a body region → Imaging & Tests → **+**. The form shows an **Attachments** section with an **Add** tile.
2. Tap **Add** → sheet offers Photo Library / Take Photo / Files. Add one image and one PDF. Thumbnails appear (image preview; document shows a file icon + name).
3. Tap **Save**. Reopen the entry (edit) → both attachments are listed.
4. In edit, add another attachment → it persists immediately. Tap the image → full-screen viewer; tap the PDF → opens in the system viewer. Remove one → it disappears.
5. Kill and relaunch the app → the entry's attachments are still present (document-dir persistence).
6. Delete the entry → reopen the region; confirm no errors. (Files for that entry are removed.)
7. Delete the whole profile from profile settings → no errors; relaunch confirms it's gone.

- [ ] **Step 5: Final commit (if any manual-fix touch-ups were needed)**

```bash
git add -A
git commit -m "test(attachments): verify end-to-end attachment flow"
```
(Skip if nothing changed.)

---

## Self-review notes (already reconciled)

- **Spec coverage:** scope (imaging_test only) → Tasks 13; create+edit → Tasks 12–13; sources (library/camera/files) → Task 6; document-dir layout → Task 5; coordinator compensation → Task 4; cascade file cleanup → Task 14; deps + permissions → Task 1; tests → Tasks 2, 4, 15.
- **Type consistency:** `AttachmentFilesPort` / `AttachmentPickerPort` / `AttachmentMetaPort` defined in Task 4 are implemented verbatim in Tasks 5–7 and wired in Task 8. `PendingPick` / `AttachmentView` / `AttachmentSource` defined in Task 3 are used unchanged throughout. `GridItem` defined in Task 11 is reused by both containers in Task 12. `add`/`remove`/`listByEntry`/`pick`/`open`/`removeForEntry`/`removeForProfile` names are consistent across coordinator, hooks, and callers.
- **No placeholders:** every code step contains complete code.
