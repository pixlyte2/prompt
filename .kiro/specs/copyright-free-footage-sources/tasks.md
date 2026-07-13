# Implementation Plan: LinkVault

## Overview

Full-stack implementation of the `/admin/link-vault` admin page. The work is split into four layers: backend (models → seed → controllers → routes → app wiring), then frontend (page → section components → card components → modals → nav/routing). Property-based tests use `fast-check` and sit alongside the component they validate. Each layer builds on the previous and nothing is left unintegrated.

## Tasks

- [x] 1. Set up backend models and seed data
  - [x] 1.1 Create `FootageChannel` Mongoose model
    - Create `server/models/FootageChannel.js` with schema: `companyId` (required ObjectId ref Company), `createdBy` (ObjectId ref User), `name` (String required trim), `youtube/facebook/twitter/instagram/website` (String default ""), timestamps
    - _Requirements: 7.1_

  - [x] 1.2 Create `FootageResource` Mongoose model
    - Create `server/models/FootageResource.js` with schema: `companyId` (required ObjectId ref Company), `createdBy` (ObjectId ref User), `name` (String required trim), `type` (enum ["video","audio"] required), `url` (String required), timestamps
    - _Requirements: 5.1, 7.2_

  - [x] 1.3 Create seed constant and seed utility
    - Create `server/constants/footageSeedData.js` exporting the 3 seed entries: Pixabay (video), Mixkit (video), Instats (audio)
    - Create `server/utils/footageSeed.js` — `seedFootageResources()` iterates all Company documents, inserts seeds per-company idempotently (`findOne({ companyId, name })` guard), non-fatal (wrapped in try/catch), logs ✅/⚠️
    - _Requirements: 5.1, 7.3_

  - [ ]* 1.4 Write unit tests for `footageSeed.js`
    - Mock `FootageResource` and `Company` Mongoose models with `vi.mock`
    - Test: zero existing companies → no inserts
    - Test: one company with no existing resources → 3 inserts (one per seed)
    - Test: one company where all 3 already exist → 0 inserts (idempotency)
    - Test: DB error → non-fatal, logs warning, does not throw
    - _Requirements: 5.1_

- [ ] 2. Implement backend controllers and routes
  - [x] 2.1 Implement `footageChannelController.js`
    - Create `server/controllers/footageChannelController.js` with `getFootageChannels`, `createFootageChannel`, `updateFootageChannel`, `deleteFootageChannel`
    - `get`: find by `companyId`, sort `createdAt: -1`
    - `create`: validate `name.trim()` not empty → 400; save with `companyId` from `req.user.companyId`, `createdBy` from `req.user.id`; return 201
    - `update`: `findOne({ _id, companyId })` → 404 if missing; validate `name.trim()` not empty → 400; update fields; return 200
    - `delete`: `findOne({ _id, companyId })` → 404 if missing; `deleteOne()`; return 200
    - _Requirements: 3.3, 3.4, 4.3, 4a.6, 7.1_

  - [ ]* 2.2 Write unit tests for `footageChannelController.js`
    - Mock `FootageChannel` model
    - Test `createFootageChannel`: empty name → 400; valid name → 201 with correct fields; `companyId` always from `req.user`, never request body
    - Test `deleteFootageChannel`: valid id + same company → 200; wrong company → 404
    - Test `getFootageChannels`: returns array sorted newest-first
    - _Requirements: 3.3, 3.4, 4.3_

  - [ ] 2.3 Implement `footageResourceController.js`
    - Create `server/controllers/footageResourceController.js` with `getFootageResources`, `createFootageResource`, `updateFootageResource`, `deleteFootageResource`
    - `get`: `find({ companyId })`; if count is 0 → `insertMany` seeds → return seeded list; else return existing
    - `create`: validate non-empty trimmed name → 400; validate `type` in ["video","audio"] → 400; validate URL matches `/^https?:\/\//i` → 400; save; return 201
    - `update`: `findOne({ _id, companyId })` → 404 if missing; same validation as create; update fields; return 200
    - `delete`: same `findOne({ _id, companyId })` guard; `deleteOne()`
    - _Requirements: 5.1, 6.3, 6.4, 6.5, 6a.6, 7.2_

  - [ ]* 2.4 Write unit tests for `footageResourceController.js`
    - Mock `FootageResource` model and `footageSeedData`
    - Test `getFootageResources`: empty collection → seeds inserted, returned; non-empty → no inserts
    - Test `createFootageResource`: empty name → 400; invalid type → 400; non-HTTP URL → 400; valid payload → 201
    - Test `deleteFootageResource`: valid + same company → 200; wrong company → 404; `companyId` never from body
    - _Requirements: 5.1, 6.3, 6.4, 6.5_

  - [ ] 2.5 Create route files and register in `app.js`
    - Create `server/routes/footageChannelRoutes.js`: GET `/` (`protect`), POST `/` (`protect, allowRoles("admin")`), PUT `/:id` (`protect, allowRoles("admin")`), DELETE `/:id` (`protect, allowRoles("admin")`)
    - Create `server/routes/footageResourceRoutes.js`: same pattern for resources including PUT `/:id`
    - In `server/app.js`: require both route files; `app.use("/api/footage-channels", ...)` and `app.use("/api/footage-resources", ...)`; call `seedFootageResources()` inside `startServer()` after `connectDB()`
    - _Requirements: 1.1, 5.1, 7.1, 7.2_

- [ ] 3. Checkpoint — backend complete
  - Ensure all backend tests pass. Confirm route registration and seed call are wired correctly in `app.js`. Ask the user if questions arise.

- [ ] 4. Implement card components
  - [ ] 4.1 Implement `ChannelCard` component
    - Create `client/src/components/footage/ChannelCard.jsx`
    - Props: `entry` (FootageChannel), `onDelete` (fn)
    - Render: `buffer-card`, channel name, trash icon button (`aria-label="Delete channel"`, calls `onDelete(entry._id)`)
    - For each of `youtube/facebook/twitter/instagram/website`: only render anchor when field is truthy; use corresponding lucide-react icon (Youtube, Users, AtSign, Camera, Globe); `target="_blank" rel="noopener noreferrer"`; Buffer design system link styling
    - Dark mode variants throughout
    - _Requirements: 2.1, 2.4, 2.5, 4.1_

  - [ ]* 4.2 Write property test P1 for `ChannelCard`
    - **Property 1: Channel card anchors match exactly the populated link fields**
    - **Validates: Requirements 2.4, 2.5**
    - Generator: `fc.record({ name: fc.string({minLength:1}), youtube: fc.option(fc.webUrl()), facebook: fc.option(fc.webUrl()), twitter: fc.option(fc.webUrl()), instagram: fc.option(fc.webUrl()), website: fc.option(fc.webUrl()) })`; render `ChannelCard`; count anchors; assert equals non-null fields
    - Tag: `// Feature: copyright-free-footage-sources, Property 1`
    - 100 runs minimum

  - [ ] 4.3 Implement `ResourceCard` component
    - Create `client/src/components/footage/ResourceCard.jsx`
    - Props: `entry` (FootageResource), `onDelete` (fn)
    - Render: `buffer-card`, name, type badge pill (video: `bg-primary-50 dark:bg-primary-950/25 text-primary-700 dark:text-primary-400 border border-primary-200/70` + `Film` icon + "Video / Footage"; audio: `bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70` + `Music2` icon + "Sound / Audio"), external link anchor (`target="_blank" rel="noopener noreferrer"`), trash icon delete button
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.4 Write property test P8 for `ResourceCard`
    - **Property 8: ResourceCard renders all required entry fields**
    - **Validates: Requirements 5.2, 5.3**
    - Generator: `fc.record({ _id: fc.uuid(), name: fc.string({minLength:1}), type: fc.constantFrom("video","audio"), url: fc.webUrl() })`; render `ResourceCard`; assert name text present, correct badge label, anchor `href` equals entry url with `target="_blank"`
    - Tag: `// Feature: copyright-free-footage-sources, Property 8`
    - 100 runs minimum

  - [ ]* 4.5 Write unit tests for `ChannelCard` and `ResourceCard`
    - `ChannelCard` with all 5 links populated → 5 anchors with correct hrefs
    - `ChannelCard` with name only (no links) → 0 anchors rendered
    - `ChannelCard` trash button click → `onDelete` called with correct `_id`
    - `ResourceCard` type="video" → badge text "Video / Footage", `Film` icon present
    - `ResourceCard` type="audio" → badge text "Sound / Audio", `Music2` icon present
    - `ResourceCard` link → has correct href, `target="_blank"`
    - _Requirements: 2.4, 2.5, 4.1, 5.3, 5.4_

- [ ] 5. Implement modal components
  - [ ] 5.1 Implement `AddChannelModal` component
    - Create `client/src/components/footage/AddChannelModal.jsx`
    - Props: `isOpen`, `onClose`, `onSaved`
    - Fields (all with `buffer-input`): Channel Name (required), YouTube URL, Facebook URL, Twitter/X URL, Instagram URL, Website URL (optional)
    - Client-side validation: name `trim().length === 0` → field error, block submit; each non-empty URL must match `/^https?:\/\//i` → field error, block submit
    - Submit: `api.post("/footage-channels", payload)`, spinner on button; success → `onSaved(response.data)` then `onClose()`; failure → `toast.error(err.response?.data?.message || "...")`, form stays open
    - Reset all local state on `onClose()` (cancel or success)
    - Modal via `createPortal`, `fixed inset-0 bg-black/40 backdrop-blur-sm`, panel = `buffer-card shadow-xl`
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

  - [ ]* 5.2 Write property test P2 for whitespace name rejection in `AddChannelModal`
    - **Property 2: Whitespace-only names are always rejected by both forms**
    - **Validates: Requirements 3.3, 6.3**
    - Generator: `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))`; render `AddChannelModal isOpen`; fill name with whitespace string; click save; assert `api.post` not called, field-level error visible
    - Mock `api` via `vi.mock`; mock `react-hot-toast`
    - Tag: `// Feature: copyright-free-footage-sources, Property 2`
    - 100 runs minimum

  - [ ]* 5.3 Write property test P3 for non-HTTP(S) URL rejection in `AddChannelModal`
    - **Property 3: Non-HTTP(S) URL values are always blocked**
    - **Validates: Requirements 3.5, 6.4**
    - Generator: `fc.string().filter(s => !/^https?:\/\//i.test(s))`; render `AddChannelModal isOpen` with valid name; fill YouTube field with non-HTTP string; click save; assert `api.post` not called, URL field error visible
    - Tag: `// Feature: copyright-free-footage-sources, Property 3`
    - 100 runs minimum

  - [ ]* 5.4 Write property test P4 for valid channel creation in `AddChannelModal`
    - **Property 4: Valid channel creation POST updates the grid**
    - **Validates: Requirements 3.4, 7.1**
    - Generator: `fc.record({ name: fc.string({minLength:1}).map(s=>s.trim()).filter(s=>s.length>0), youtube: fc.option(fc.webUrl()), facebook: fc.option(fc.webUrl()), twitter: fc.option(fc.webUrl()), instagram: fc.option(fc.webUrl()), website: fc.option(fc.webUrl()) })`; mock `api.post` to resolve with matching document; submit form; assert `api.post` called with correct payload, `onSaved` called with returned document
    - Tag: `// Feature: copyright-free-footage-sources, Property 4`
    - 100 runs minimum

  - [ ]* 5.5 Write property test P9 for form reset on dismiss in `AddChannelModal`
    - **Property 9: Form fields are empty after dismiss**
    - **Validates: Requirements 3.6, 6.6**
    - Generator: `fc.record({ name: fc.string(), youtube: fc.string(), facebook: fc.string() })`; render `AddChannelModal isOpen`; fill fields; click cancel; re-open modal; assert all fields empty
    - Tag: `// Feature: copyright-free-footage-sources, Property 9`
    - 100 runs minimum

  - [ ] 5.6 Implement `AddResourceModal` component    - Create `client/src/components/footage/AddResourceModal.jsx`
    - Props: `isOpen`, `onClose`, `onSaved`
    - Fields: Resource Name (required `buffer-input`), Resource Type (required `<select buffer-input>`: "Video / Footage" → value "video", "Sound / Audio" → value "audio"), Website URL (required `buffer-input`)
    - Client-side validation: name `trim().length === 0` → field error; URL empty or not matching `/^https?:\/\//i` → field error; block submit on any error
    - Submit: `api.post("/footage-resources", { name, type, url })`; success → `onSaved(response.data)` then `onClose()`; failure → `toast.error(...)`
    - Reset all state on close
    - Same portal/overlay pattern as `AddChannelModal`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 5.11 Implement `EditChannelModal` component
    - Create `client/src/components/footage/EditChannelModal.jsx`
    - Props: `isOpen`, `entry` (FootageChannel), `onClose`, `onSaved`
    - Same fields as `AddChannelModal`, pre-populated from `entry` on open
    - Same client-side validation as `AddChannelModal`
    - Submit: `api.put("/footage-channels/${entry._id}", payload)`; success → `onSaved(response.data)` then `onClose()`; failure → `toast.error(...)`; reset state on close
    - _Requirements: 4a.1, 4a.2, 4a.3, 4a.4, 4a.5, 4a.6, 4a.7_

  - [ ] 5.12 Implement `EditResourceModal` component
    - Create `client/src/components/footage/EditResourceModal.jsx`
    - Props: `isOpen`, `entry` (FootageResource), `onClose`, `onSaved`
    - Same fields as `AddResourceModal`, pre-populated from `entry` on open
    - Same client-side validation as `AddResourceModal`
    - Submit: `api.put("/footage-resources/${entry._id}", { name, type, url })`; success → `onSaved(response.data)` then `onClose()`; failure → `toast.error(...)`; reset state on close
    - _Requirements: 6a.1, 6a.2, 6a.3, 6a.4, 6a.5, 6a.6, 6a.7_

  - [ ]* 5.7 Write property test P2 for whitespace name rejection in `AddResourceModal`
    - **Property 2 (AddResourceModal): Whitespace-only names are always rejected**
    - **Validates: Requirements 6.3**
    - Same generator pattern as 5.2 applied to `AddResourceModal`; fill name with whitespace, provide valid URL; click save; assert `api.post` not called
    - Tag: `// Feature: copyright-free-footage-sources, Property 2`
    - 100 runs minimum

  - [ ]* 5.8 Write property test P3 for non-HTTP(S) URL rejection in `AddResourceModal`
    - **Property 3 (AddResourceModal): Non-HTTP(S) URL values are always blocked**
    - **Validates: Requirements 6.4**
    - Same generator as 5.3 applied to `AddResourceModal` URL field; assert block
    - Tag: `// Feature: copyright-free-footage-sources, Property 3`
    - 100 runs minimum

  - [ ]* 5.9 Write property test P7 for valid resource creation in `AddResourceModal`
    - **Property 7: Valid resource creation calls POST and the entry appears in the library**
    - **Validates: Requirements 6.5, 7.2**
    - Generator: `fc.record({ name: fc.string({minLength:1}).map(s=>s.trim()).filter(s=>s.length>0), type: fc.constantFrom("video","audio"), url: fc.webUrl() })`; mock `api.post` to resolve; submit; assert `api.post` called with correct payload, `onSaved` called
    - Tag: `// Feature: copyright-free-footage-sources, Property 7`
    - 100 runs minimum

  - [ ]* 5.10 Write unit tests for `AddChannelModal` and `AddResourceModal`
    - `AddChannelModal` renders when `isOpen=true` with 6 fields; cancel resets and closes; successful submit calls `onSaved` with response; API failure shows `toast.error`, keeps form open
    - `AddResourceModal` selector has both "Video / Footage" and "Sound / Audio" options; required URL validation blocks empty URL; successful submit resets fields
    - _Requirements: 3.1, 3.2, 3.6, 6.1, 6.2, 6.6_

- [ ] 6. Checkpoint — components complete
  - Ensure all component and modal tests pass (`vitest --run`). Ask the user if questions arise.

- [ ] 7. Implement section components
  - [ ] 7.1 Implement `LiveSourceChannels` section component
    - Create `client/src/components/footage/LiveSourceChannels.jsx`
    - Props: `entries` (FootageChannel[]), `onAdded` (fn), `onEdited` (fn), `onDeleted` (fn)
    - Internal state: `showAddModal` (boolean), `editingEntry` (FootageChannel | null), `pendingDeleteId` (string | null)
    - Render: section heading "Live Source Channels" + "Add Channel" `buffer-button-primary`, responsive grid, empty-state, `ChannelCard` for each entry, `AddChannelModal`, `EditChannelModal`, `ConfirmModal` for delete
    - Add flow: `showAddModal=true` → POST succeeds → `onAdded()`
    - Edit flow: pencil click → `editingEntry=entry` → EditChannelModal → PUT succeeds → `onEdited()` on success
    - Delete flow: trash click → `pendingDeleteId=entry._id` → ConfirmModal → DELETE → `onDeleted()` on success
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 4.1, 4.2, 4.3, 4.4, 4a.1, 4a.2, 4a.6_

  - [ ]* 7.2 Write property test P5 for confirm delete in `LiveSourceChannels`
    - **Property 5: Confirming channel deletion calls DELETE and removes the card**
    - **Validates: Requirements 4.3**
    - Generator: `fc.array(channelEntryArb, {minLength:1})`; pick random index as target; render `LiveSourceChannels` with array; click trash on target entry; confirm in `ConfirmModal`; mock `api.delete` to resolve; assert `api.delete` called with correct `_id`, `onDeleted` called
    - Tag: `// Feature: copyright-free-footage-sources, Property 5`
    - 100 runs minimum

  - [ ]* 7.3 Write property test P6 for cancel delete in `LiveSourceChannels`
    - **Property 6: Cancelling channel deletion leaves the list unchanged**
    - **Validates: Requirements 4.4**
    - Generator: `fc.array(channelEntryArb, {minLength:1})`; click trash on any entry; cancel ConfirmModal; assert `api.delete` not called, `onDeleted` not called, all original cards still rendered
    - Tag: `// Feature: copyright-free-footage-sources, Property 6`
    - 100 runs minimum

  - [ ] 7.4 Implement `CreatorAssetLibrary` section component
    - Create `client/src/components/footage/CreatorAssetLibrary.jsx`
    - Props: `resources` (FootageResource[]), `onAdded` (fn), `onEdited` (fn), `onDeleted` (fn)
    - Internal state: `showAddModal` (boolean), `editingEntry` (FootageResource | null), `pendingDeleteId` (string | null)
    - Render: section heading "Creator Asset Library" + "Add Resource" `buffer-button-primary`, responsive grid, `ResourceCard`, `AddResourceModal`, `EditResourceModal`, `ConfirmModal`
    - Edit flow: pencil click → `editingEntry=entry` → EditResourceModal → PUT succeeds → `onEdited()`
    - Delete flow mirrors LiveSourceChannels pattern
    - _Requirements: 5.1, 5.2, 5.5, 6.1, 6a.1, 6a.6_

  - [ ]* 7.5 Write unit tests for `LiveSourceChannels` and `CreatorAssetLibrary`
    - `LiveSourceChannels`: empty entries → empty-state message shown; non-empty entries → N cards rendered; "Add Channel" button opens `AddChannelModal`; delete confirm calls `api.delete` and invokes `onDeleted`; delete cancel leaves cards unchanged
    - `CreatorAssetLibrary`: non-empty resources → N `ResourceCard` rendered; "Add Resource" button opens `AddResourceModal`; delete confirm calls `api.delete` and invokes `onDeleted`
    - _Requirements: 2.2, 2.3, 4.2, 4.3, 4.4, 5.5_

- [ ] 8. Implement `FootageSources` page and integrate routing + nav
  - [ ] 8.1 Implement `MediaLibrary` page component
    - Create `client/src/pages/admin/MediaLibrary.jsx`
    - State: `channelEntries` ([]), `resourceEntries` ([]), `loading` (true)
    - `useEffect` on mount: `Promise.all([api.get("/footage-channels"), api.get("/footage-resources")])` → set both states; catch → `toast.error("Couldn't load footage data — please refresh.")`; finally → `setLoading(false)`
    - Render: `<AdminLayout title="LinkVault" icon={Film}>`, `<PageSectionLoader show={loading} />`, once resolved: `<LiveSourceChannels entries={channelEntries} onAdded={loadChannels} onEdited={loadChannels} onDeleted={loadChannels} />`, horizontal divider, `<CreatorAssetLibrary resources={resourceEntries} onAdded={loadResources} onEdited={loadResources} onDeleted={loadResources} />`
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 7.4_

  - [ ] 8.2 Add sidebar nav entry in `AdminLayout.jsx`
    - In `client/src/layout/AdminLayout.jsx`, locate the `adminMenu` array
    - Add entry `{ label: "LinkVault", path: "/admin/link-vault", icon: Film }` (import `Film` from `lucide-react`)
    - Position logically within the menu (after Channels or with other resource-type links)
    - _Requirements: 1.2_

  - [ ] 8.3 Register route in `App.jsx`
    - In `client/src/App.jsx`, add `<Route path="/admin/link-vault" element={<PrivateRoute allowedRoles={["admin"]}><MediaLibrary /></PrivateRoute>} />`
    - Lazy-import `MediaLibrary` with `React.lazy`
    - _Requirements: 1.1_

  - [ ]* 8.4 Write unit tests for `FootageSources` page
    - Mock `api.get` for both endpoints; test: both calls resolve → `loading=false`, both sections rendered, `PageSectionLoader` hidden; test: either call rejects → empty state shown, `toast.error` called, no crash; test: `PageSectionLoader` shown while calls are in-flight
    - _Requirements: 1.4, 7.3, 7.4_

- [ ] 9. Final checkpoint — ensure all tests pass
  - Run `vitest --run` to execute the full test suite. Verify no TypeScript/lint errors. Confirm nav link renders, route is protected, dark mode classes are present on all new components. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` — install with `npm install --save-dev fast-check` in the `client` directory if not already present
- Seeding is lazy (per-company, on first GET) — no migration or separate boot script needed
- `ConfirmModal` and `PageSectionLoader` are reused from `client/src/components/` — do not recreate them
- All components use `buffer-*` design system classes with `dark:` variants throughout
- The `api` axios utility at `client/src/utils/api.js` auto-attaches JWT and handles 401 redirect — never manage auth headers manually in components

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.3"] },
    { "id": 2, "tasks": ["1.4", "2.2", "2.4", "4.1", "4.3"] },
    { "id": 3, "tasks": ["2.5", "4.2", "4.4", "4.5", "5.1", "5.6"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.7", "5.8", "5.9", "5.10"] },
    { "id": 5, "tasks": ["7.1", "7.4"] },
    { "id": 6, "tasks": ["7.2", "7.3", "7.5"] },
    { "id": 7, "tasks": ["8.1"] },
    { "id": 8, "tasks": ["8.2", "8.3"] },
    { "id": 9, "tasks": ["8.4"] }
  ]
}
```
