# Design Document: LinkVault

## Overview

The LinkVault page is a full-stack admin feature at `/admin/link-vault`. It gives content teams a single place to manage and discover copyright-free video and audio material. The page has two distinct sections on the same scrollable surface:

- **Live Source Channels** — user-managed cards for government and public social media accounts (YouTube, Facebook, Twitter/X, Instagram, website). Teams curate this list and click through to source footage.
- **Creator Asset Library** — a curated and user-extendable list of copyright-free websites. Pixabay, Mixkit (video), and Instats (audio) are seeded into MongoDB on first server boot as regular documents — they can be deleted just like any user-created entry.

All data is stored in and retrieved from MongoDB via Mongoose. There is no localStorage, no static seed constant in the client, and no client-side merge logic. Both sections use the Buffer design system (`buffer-card`, `buffer-button-primary`, etc.) with full dark-mode support via `dark:` Tailwind variants.

---

## Architecture

### High-Level Component Tree

```
App.jsx
  └── Route /admin/link-vault
        └── PrivateRoute allowedRoles={["admin"]}
              └── MediaLibrary (page)
                    ├── AdminLayout (title, sidebar, topbar)
                    ├── LiveSourceChannels (section)
                    │    ├── ChannelCard × N
                    │    ├── AddChannelModal
                    │    ├── EditChannelModal
                    │    └── ConfirmModal (delete)
                    └── CreatorAssetLibrary (section)
                         ├── ResourceCard × N
                         ├── AddResourceModal
                         ├── EditResourceModal
                         └── ConfirmModal (delete)
```

### Data Flow

```
MongoDB (via Mongoose, companyId-scoped)
  ├── FootageChannel  collection
  └── FootageResource collection  ← seeded with Pixabay/Mixkit/Instats on first boot

Page mount:
  1. GET /api/footage-channels  → channelEntries state
  2. GET /api/footage-resources → resourceEntries state
  3. loading=false; if either fails → empty state + toast.error(...)

Mutations:
  Add channel:     POST   /api/footage-channels      → prepend to channelEntries
  Edit channel:    PUT    /api/footage-channels/:id  → update in channelEntries
  Delete channel:  DELETE /api/footage-channels/:id  → filter from channelEntries
  Add resource:    POST   /api/footage-resources      → prepend to resourceEntries
  Edit resource:   PUT    /api/footage-resources/:id → update in resourceEntries
  Delete resource: DELETE /api/footage-resources/:id → filter from resourceEntries
```

### Backend File Layout

```
server/
  models/
    FootageChannel.js
    FootageResource.js
  controllers/
    footageChannelController.js
    footageResourceController.js
  routes/
    footageChannelRoutes.js
    footageResourceRoutes.js
  utils/
    footageSeed.js
  app.js              ← register two new route prefixes, call seedFootageResources()
```

### Integration Points

- **`AdminLayout`** — wraps the page with `title="Footage & Asset Sources"` and `icon={Film}` (lucide-react).
- **`adminMenu` in `AdminLayout.jsx`** — add `{ label: "LinkVault", path: "/admin/link-vault", icon: Film }`.
- **`App.jsx`** — new `<Route>` wrapped in `<PrivateRoute allowedRoles={["admin"]}>`.
- **`api` axios instance** — `client/src/utils/api.js`; auto-attaches JWT Bearer token and handles 401 redirect.
- **`ConfirmModal`** — reused for both channel and resource deletion confirmation.
- **`PageSectionLoader`** — shown while both initial API calls are in-flight.
- **`server/app.js`** — call `seedFootageResources()` inside `startServer()` after `connectDB()`.

---

## Backend

### Mongoose Models

**`server/models/FootageChannel.js`**

```js
const mongoose = require("mongoose");

const footageChannelSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name:      { type: String, required: true, trim: true },
    youtube:   { type: String, default: "" },
    facebook:  { type: String, default: "" },
    twitter:   { type: String, default: "" },
    instagram: { type: String, default: "" },
    website:   { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.FootageChannel ||
  mongoose.model("FootageChannel", footageChannelSchema);
```

**`server/models/FootageResource.js`**

```js
const mongoose = require("mongoose");

const footageResourceSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["video", "audio"], required: true },
    url:  { type: String, required: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.FootageResource ||
  mongoose.model("FootageResource", footageResourceSchema);
```

> Seeded entries (Pixabay, Mixkit, Instats) have `createdBy: undefined` and are identical to user-created resources. There is no `isSeeded` flag — they are plain documents and can be deleted.

---

### Controllers

**`server/controllers/footageChannelController.js`**

```js
const FootageChannel = require("../models/FootageChannel");

const getFootageChannels = async (req, res) => {
  try {
    const channels = await FootageChannel
      .find({ companyId: req.user.companyId })
      .sort({ createdAt: -1 });
    res.json(channels);
  } catch (err) {
    res.status(500).json({ message: "Failed to load footage channels" });
  }
};

const createFootageChannel = async (req, res) => {
  try {
    const { name, youtube, facebook, twitter, instagram, website } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Channel name is required" });
    }
    const channel = await FootageChannel.create({
      companyId: req.user.companyId,
      createdBy: req.user.id,
      name: name.trim(),
      youtube:   youtube   || "",
      facebook:  facebook  || "",
      twitter:   twitter   || "",
      instagram: instagram || "",
      website:   website   || "",
    });
    res.status(201).json(channel);
  } catch (err) {
    res.status(500).json({ message: "Failed to create footage channel" });
  }
};

const deleteFootageChannel = async (req, res) => {
  try {
    const channel = await FootageChannel.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    await channel.deleteOne();
    res.json({ message: "Channel deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete footage channel" });
  }
};

module.exports = { getFootageChannels, createFootageChannel, deleteFootageChannel };
```

---

## Components and Interfaces

### Page: `MediaLibrary`

**File:** `client/src/pages/admin/MediaLibrary.jsx`

Owns all API calls and top-level state. Passes data and mutation callbacks down to section components.

```jsx
const [channelEntries, setChannelEntries] = useState([]);
const [resourceEntries, setResourceEntries] = useState([]);
const [loading, setLoading] = useState(true);

const loadChannels  = async () => {
  const res = await api.get("/footage-channels");
  setChannelEntries(res.data);
};
const loadResources = async () => {
  const res = await api.get("/footage-resources");
  setResourceEntries(res.data);
};

useEffect(() => {
  const load = async () => {
    try {
      await Promise.all([loadChannels(), loadResources()]);
    } catch {
      toast.error("Couldn't load footage data — please refresh.");
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);
```

Renders `<PageSectionLoader show={loading} />` as a full-section overlay while loading, then renders `<LiveSourceChannels>` and `<CreatorAssetLibrary>` once resolved.

---

### Component: `LiveSourceChannels`

**File:** `client/src/components/footage/LiveSourceChannels.jsx`

Props:
```js
// entries:  FootageChannel[]
// onAdded:  () => void   – triggers refetch in parent after successful POST
// onDeleted: () => void  – triggers refetch in parent after successful DELETE
```

Renders: section heading + "Add Channel" button, responsive grid of `ChannelCard` components (or empty-state text if `entries` is empty), `AddChannelModal`, and `ConfirmModal` for delete confirmation. Internally tracks `showAddModal` (boolean) and `pendingDeleteId` (string | null).

---

### Component: `ChannelCard`

**File:** `client/src/components/footage/ChannelCard.jsx`

Props:
```js
// entry:    FootageChannel  { _id, name, youtube, facebook, twitter, instagram, website }
// onDelete: (id: string) => void
```

Renders the channel name, a trash icon button (accessible, `aria-label="Delete channel"`), and one anchor per non-empty link field. Each anchor uses `target="_blank" rel="noopener noreferrer"`.

Platform icons (all from `lucide-react`):

| Field | Icon |
|-------|------|
| `youtube` | `Youtube` |
| `facebook` | `Users` (proxy) |
| `twitter` | `AtSign` |
| `instagram` | `Camera` |
| `website` | `Globe` |

---

### Component: `AddChannelModal`

**File:** `client/src/components/footage/AddChannelModal.jsx`

Props:
```js
// isOpen:   boolean
// onClose:  () => void
// onSaved:  (newEntry: FootageChannel) => void
```

Fields: Channel Name (required), YouTube URL, Facebook URL, Twitter/X URL, Instagram URL, Website URL (all optional).

Client-side validation (mirrors server):
- Channel Name: `name.trim().length === 0` → field-level error, block submit.
- Each URL field: if non-empty, must match `/^https?:\/\//i` → field-level error, block submit.

On submit: calls `api.post("/footage-channels", payload)`, shows spinner on button during inflight. On success calls `onSaved(response.data)` then `onClose()`. Shows `toast.error(err.response?.data?.message || "...")` on failure without closing the form. Resets all local state on close.

---

### Component: `EditChannelModal`

**File:** `client/src/components/footage/EditChannelModal.jsx`

Props:
```js
// isOpen:   boolean
// entry:    FootageChannel  — the channel being edited (pre-populates all fields)
// onClose:  () => void
// onSaved:  (updatedEntry: FootageChannel) => void
```

Fields: same as `AddChannelModal` — Channel Name (required), YouTube, Facebook, Twitter/X, Instagram, Website URL (all optional) — pre-populated from `entry`.

Client-side validation: identical to `AddChannelModal`.

On submit: calls `api.put("/footage-channels/${entry._id}", payload)`. On success calls `onSaved(response.data)` then `onClose()`. Shows `toast.error(...)` on failure without closing. Resets all local state on close.

---

### Component: `CreatorAssetLibrary`

Props:
```js
// resources: FootageResource[]
// onAdded:   () => void   – triggers refetch in parent after successful POST
// onEdited:  () => void   – triggers refetch in parent after successful PUT
// onDeleted: () => void   – triggers refetch in parent after successful DELETE
```

Renders: section heading + "Add Resource" button, responsive grid of `ResourceCard` components, `AddResourceModal`, `EditResourceModal`, and `ConfirmModal` for delete confirmation.

---

### Component: `ResourceCard`

**File:** `client/src/components/footage/ResourceCard.jsx`

Props:
```js
// entry:    FootageResource  { _id, name, type, url }
// onDelete: (id: string) => void
```

Displays: name, type badge pill, clickable link (`target="_blank"`), and trash icon delete button.

Type badge (Buffer pill pattern):
- `video`: `bg-primary-50 dark:bg-primary-950/25 text-primary-700 dark:text-primary-400 border border-primary-200/70` + `Film` icon + text "Video / Footage"
- `audio`: `bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70` + `Music2` icon + text "Sound / Audio"

---

### Component: `AddResourceModal`

**File:** `client/src/components/footage/AddResourceModal.jsx`

Props:
```js
// isOpen:   boolean
// onClose:  () => void
// onSaved:  (newEntry: FootageResource) => void
```

Fields: Resource Name (required text), Resource Type (required `<select>`: "Video / Footage" | "Sound / Audio"), Website URL (required URL).

Client-side validation:
- Name: `name.trim().length === 0` → field-level error, block submit.
- URL: empty or doesn't match `/^https?:\/\//i` → field-level error, block submit.
- Type: always valid if a controlled `<select>` defaults to the first option.

On submit: calls `api.post("/footage-resources", payload)`. On success calls `onSaved(response.data)` then `onClose()`. Shows `toast.error(...)` on failure. Resets all state on close.

---

### Component: `EditResourceModal`

**File:** `client/src/components/footage/EditResourceModal.jsx`

Props:
```js
// isOpen:   boolean
// entry:    FootageResource  — the resource being edited (pre-populates all fields)
// onClose:  () => void
// onSaved:  (updatedEntry: FootageResource) => void
```

Fields: same as `AddResourceModal` — Resource Name (required), Resource Type (required select), Website URL (required) — pre-populated from `entry`.

Client-side validation: identical to `AddResourceModal`.

On submit: calls `api.put("/footage-resources/${entry._id}", { name, type, url })`. On success calls `onSaved(response.data)` then `onClose()`. Shows `toast.error(...)` on failure. Resets all state on close.

---

**`server/controllers/footageResourceController.js`**

```js
const FootageResource = require("../models/FootageResource");

const getFootageResources = async (req, res) => {
  try {
    const resources = await FootageResource
      .find({ companyId: req.user.companyId })
      .sort({ createdAt: 1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: "Failed to load footage resources" });
  }
};

const createFootageResource = async (req, res) => {
  try {
    const { name, type, url } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Resource name is required" });
    }
    if (!["video", "audio"].includes(type)) {
      return res.status(400).json({ message: "Resource type must be 'video' or 'audio'" });
    }
    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ message: "URL must begin with http:// or https://" });
    }
    const resource = await FootageResource.create({
      companyId: req.user.companyId,
      createdBy: req.user.id,
      name: name.trim(),
      type,
      url,
    });
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ message: "Failed to create footage resource" });
  }
};

const deleteFootageResource = async (req, res) => {
  try {
    const resource = await FootageResource.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    await resource.deleteOne();
    res.json({ message: "Resource deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete footage resource" });
  }
};

module.exports = { getFootageResources, createFootageResource, deleteFootageResource };
```

---

### Routes

**`server/routes/footageChannelRoutes.js`**

```js
const express = require("express");
const { getFootageChannels, createFootageChannel, deleteFootageChannel } =
  require("../controllers/footageChannelController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/",       protect, allowRoles("admin"), getFootageChannels);
router.post("/",      protect, allowRoles("admin"), createFootageChannel);
router.delete("/:id", protect, allowRoles("admin"), deleteFootageChannel);

module.exports = router;
```

**`server/routes/footageResourceRoutes.js`**

```js
const express = require("express");
const { getFootageResources, createFootageResource, deleteFootageResource } =
  require("../controllers/footageResourceController");
const { protect } = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/",       protect, allowRoles("admin"), getFootageResources);
router.post("/",      protect, allowRoles("admin"), createFootageResource);
router.delete("/:id", protect, allowRoles("admin"), deleteFootageResource);

module.exports = router;
```

**Additions to `server/app.js`:**

```js
// Require (alongside existing route requires at top of file)
const footageChannelRoutes  = require("./routes/footageChannelRoutes");
const footageResourceRoutes = require("./routes/footageResourceRoutes");
const { seedFootageResources } = require("./utils/footageSeed");

// Inside startServer(), after connectDB() and before the existing migrations:
await seedFootageResources();

// Inside the API routes block:
app.use("/api/footage-channels",  footageChannelRoutes);
app.use("/api/footage-resources", footageResourceRoutes);
```

---

## Data Models

### Frontend Types (API response shape)

```ts
interface FootageChannel {
  _id: string;           // MongoDB ObjectId as string
  name: string;
  youtube?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  website?: string;
  companyId: string;
  createdBy: string;
  createdAt: string;     // ISO 8601
  updatedAt: string;
}

interface FootageResource {
  _id: string;
  name: string;
  type: "video" | "audio";
  url: string;
  companyId: string;
  createdBy?: string;    // undefined for seeded entries
  createdAt: string;
  updatedAt: string;
}
```

The client never generates IDs. The `_id` field is used as the React `key` and as the route param for DELETE calls.

---

### Backend Mongoose Models

#### `FootageChannel` — `server/models/FootageChannel.js`

```js
const mongoose = require("mongoose");

const footageChannelSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  youtube:   { type: String, default: "" },
  facebook:  { type: String, default: "" },
  twitter:   { type: String, default: "" },
  instagram: { type: String, default: "" },
  website:   { type: String, default: "" },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.models.FootageChannel
  || mongoose.model("FootageChannel", footageChannelSchema);
```

#### `FootageResource` — `server/models/FootageResource.js`

```js
const mongoose = require("mongoose");

const footageResourceSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  type:      { type: String, enum: ["video", "audio"], required: true },
  url:       { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.models.FootageResource
  || mongoose.model("FootageResource", footageResourceSchema);
```

There is no `isSeeded` field — seeded entries are plain documents, indistinguishable from user-created ones. Teams own their full dataset after first seeding.

---

### Seed Data — `server/constants/footageSeedData.js`

```js
const SEED_RESOURCES = [
  { name: "Pixabay", type: "video", url: "https://pixabay.com" },
  { name: "Mixkit",  type: "video", url: "https://mixkit.co"   },
  { name: "Instats", type: "audio", url: "https://instats.org" },
];
module.exports = SEED_RESOURCES;
```

Seeding runs inside `getFootageResources`: if the company has zero resource documents, the three seeds are inserted before returning the list. This is per-company and lazy — it only runs on first access for that company, not at server boot.

---

### REST API Endpoints

| Method | Path | Middleware | Description |
|--------|------|-----------|-------------|
| `GET` | `/api/footage-channels` | `protect` | List all channels for caller's company |
| `POST` | `/api/footage-channels` | `protect`, `allowRoles("admin")` | Create channel |
| `PUT` | `/api/footage-channels/:id` | `protect`, `allowRoles("admin")` | Update channel |
| `DELETE` | `/api/footage-channels/:id` | `protect`, `allowRoles("admin")` | Delete channel |
| `GET` | `/api/footage-resources` | `protect` | List resources; seeds on first call per company |
| `POST` | `/api/footage-resources` | `protect`, `allowRoles("admin")` | Create resource |
| `PUT` | `/api/footage-resources/:id` | `protect`, `allowRoles("admin")` | Update resource |
| `DELETE` | `/api/footage-resources/:id` | `protect`, `allowRoles("admin")` | Delete resource |

All endpoints scope queries to `req.user.companyId`. The `companyId` is never accepted from the request body.

---

### Controllers

#### `server/controllers/footageChannelController.js`

```js
const FootageChannel = require("../models/FootageChannel");

const getFootageChannels = async (req, res) => {
  try {
    const channels = await FootageChannel.find({ companyId: req.user.companyId });
    res.json(channels);
  } catch {
    res.status(500).json({ message: "Failed to load footage channels" });
  }
};

const createFootageChannel = async (req, res) => {
  try {
    const { name, youtube, facebook, twitter, instagram, website } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Channel name is required" });
    const channel = await FootageChannel.create({
      name: name.trim(), youtube, facebook, twitter, instagram, website,
      companyId: req.user.companyId,
      createdBy: req.user.id,
    });
    res.json(channel);
  } catch {
    res.status(500).json({ message: "Failed to create footage channel" });
  }
};

const deleteFootageChannel = async (req, res) => {
  try {
    const channel = await FootageChannel.findOne({
      _id: req.params.id, companyId: req.user.companyId,
    });
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    await channel.deleteOne();
    res.json({ message: "Channel deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete footage channel" });
  }
};

module.exports = { getFootageChannels, createFootageChannel, deleteFootageChannel };
```

#### `server/controllers/footageResourceController.js`

```js
const FootageResource = require("../models/FootageResource");
const SEED_RESOURCES  = require("../constants/footageSeedData");

const getFootageResources = async (req, res) => {
  try {
    const existing = await FootageResource.find({ companyId: req.user.companyId });
    if (existing.length === 0) {
      const seeded = await FootageResource.insertMany(
        SEED_RESOURCES.map((r) => ({ ...r, companyId: req.user.companyId }))
      );
      return res.json(seeded);
    }
    res.json(existing);
  } catch {
    res.status(500).json({ message: "Failed to load footage resources" });
  }
};

const createFootageResource = async (req, res) => {
  try {
    const { name, type, url } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Resource name is required" });
    if (!["video", "audio"].includes(type)) return res.status(400).json({ message: "Invalid resource type" });
    if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ message: "URL must begin with http:// or https://" });
    const resource = await FootageResource.create({
      name: name.trim(), type, url,
      companyId: req.user.companyId,
      createdBy: req.user.id,
    });
    res.json(resource);
  } catch {
    res.status(500).json({ message: "Failed to create footage resource" });
  }
};

const deleteFootageResource = async (req, res) => {
  try {
    const resource = await FootageResource.findOne({
      _id: req.params.id, companyId: req.user.companyId,
    });
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    await resource.deleteOne();
    res.json({ message: "Resource deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete footage resource" });
  }
};

module.exports = { getFootageResources, createFootageResource, deleteFootageResource };
```

---

### Route Files

#### `server/routes/footageChannelRoutes.js`

```js
const express = require("express");
const { getFootageChannels, createFootageChannel, deleteFootageChannel } =
  require("../controllers/footageChannelController");
const { protect }  = require("../middleware/authMiddleware");
const allowRoles   = require("../middleware/roleMiddleware");
const router = express.Router();

router.get("/",      protect, getFootageChannels);
router.post("/",     protect, allowRoles("admin"), createFootageChannel);
router.delete("/:id",protect, allowRoles("admin"), deleteFootageChannel);

module.exports = router;
```

#### `server/routes/footageResourceRoutes.js`

```js
const express = require("express");
const { getFootageResources, createFootageResource, deleteFootageResource } =
  require("../controllers/footageResourceController");
const { protect }  = require("../middleware/authMiddleware");
const allowRoles   = require("../middleware/roleMiddleware");
const router = express.Router();

router.get("/",      protect, getFootageResources);
router.post("/",     protect, allowRoles("admin"), createFootageResource);
router.delete("/:id",protect, allowRoles("admin"), deleteFootageResource);

module.exports = router;
```

#### Additions to `server/app.js`

```js
// At top with other requires:
const footageChannelRoutes  = require("./routes/footageChannelRoutes");
const footageResourceRoutes = require("./routes/footageResourceRoutes");

// In the API routes block:
app.use("/api/footage-channels",  footageChannelRoutes);
app.use("/api/footage-resources", footageResourceRoutes);
```

---

## DB Seeding

Pixabay, Mixkit, and Instats are seeded into MongoDB on first server boot as regular `FootageResource` documents. The seed runs inside `startServer()` after `connectDB()`. It is idempotent — it checks by `name` + `companyId` before inserting, so re-running on subsequent boots is a no-op.

Because they are regular documents with no special flag, they can be deleted through the standard DELETE endpoint like any user-created resource.

**`server/utils/footageSeed.js`**

```js
const FootageResource = require("../models/FootageResource");
const Company = require("../models/Company");

const SEED_RESOURCES = [
  { name: "Pixabay", type: "video", url: "https://pixabay.com" },
  { name: "Mixkit",  type: "video", url: "https://mixkit.co"   },
  { name: "Instats", type: "audio", url: "https://instats.org" },
];

const seedFootageResources = async () => {
  try {
    const companies = await Company.find({}, "_id").lean();

    for (const company of companies) {
      for (const seed of SEED_RESOURCES) {
        const exists = await FootageResource.findOne({
          companyId: company._id,
          name: seed.name,
        });
        if (!exists) {
          await FootageResource.create({
            companyId: company._id,
            name: seed.name,
            type: seed.type,
            url:  seed.url,
          });
          console.log(`✅ Seeded footage resource: ${seed.name} (company ${company._id})`);
        }
      }
    }
  } catch (err) {
    // Non-fatal — missing Company collection or DB unavailability logs a warning
    // and the server continues. The seed will succeed on the next boot.
    console.error("⚠️  Footage resource seeding failed:", err.message);
  }
};

module.exports = { seedFootageResources };
```

Key decisions:
- **Non-fatal**: A try/catch means a missing `Company` collection or transient DB error never blocks server startup.
- **Per-company**: Each company gets its own copy of the seed resources, maintaining the `companyId` scoping invariant used throughout the app.
- **Idempotent by name**: `findOne({ companyId, name })` prevents duplicates on re-boot without a migration table.
- **Boot-time, not first-request**: Running at startup (not lazily on first GET) means every company immediately sees the defaults, even if they never visit the page.

---


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property reflection — consolidations before writing final properties:**
- 2.4 and 2.5 (link rendering present/absent) are merged into one comprehensive ChannelCard link property (P1).
- 3.3 and 6.3 (whitespace name validation in both forms) share the same validation logic — tested as one property (P2).
- 3.5 and 6.4 (URL prefix validation in both forms) are the same rule — tested as one property (P3).
- 3.4 (valid channel creation) and 7.1 (channel persistence) are consolidated — if POST is called and the grid updates after a mocked re-fetch, both are validated by P4.
- 6.5 (valid resource creation) and 7.2 (resource persistence) are consolidated by the same reasoning into P7.
- 5.2 (all resource entries render as cards) is implied by 5.3 (each card reflects its entry data) — P8 covers both.
- 3.6 and 6.6 (form reset on dismiss) share the same invariant — tested as one property (P9).
- 4.3 and 4.4 (confirm/cancel delete) are kept separate (P5, P6) as they validate distinct outcomes.

---

### Property 1: Channel card anchors match exactly the populated link fields

*For any* `FootageChannel` document with any combination of populated and empty link fields (youtube, facebook, twitter, instagram, website), the rendered `ChannelCard` should contain exactly one clickable anchor for **each** non-empty link field (with `href` matching the field value and `target="_blank"`), and **no** anchor for any empty-string or undefined field.

**Validates: Requirements 2.4, 2.5**

---

### Property 2: Whitespace-only names are always rejected by both forms

*For any* string composed entirely of whitespace characters (empty string, spaces, tabs, newlines, or any combination), entering it as the name field in either the Add Channel form or the Add Resource form and submitting should be rejected: the `api.post` is never called, and a field-level validation error is displayed.

**Validates: Requirements 3.3, 6.3**

---

### Property 3: Non-HTTP(S) URL values are always blocked

*For any* string that does not begin with `http://` or `https://` (including the empty string, bare hostnames like `example.com`, partial URLs like `www.example.com`, and strings like `ftp://example.com`), entering it in any URL field and submitting should be blocked with a field-level validation error, and `api.post` should not be called.

**Validates: Requirements 3.5, 6.4**

---

### Property 4: Valid channel creation calls POST and the entry appears in the grid

*For any* channel payload with a non-whitespace name and all URL fields either empty or beginning with `http://`/`https://`, submitting the Add Channel form (with a mocked successful `api.post`) should result in `api.post("/footage-channels", payload)` being called with matching data, and the returned document appearing exactly once in the channel card grid with its name and all provided links rendered correctly.

**Validates: Requirements 3.4, 7.1**

---

### Property 5: Confirming channel deletion calls DELETE and removes the card

*For any* channel list of any non-zero size, and any entry in that list, after the user confirms deletion via `ConfirmModal` (with mocked `api.delete` and a mocked `api.get` returning the list without that entry), `DELETE /api/footage-channels/:id` should have been called with the correct `_id`, the entry should no longer appear in the rendered grid, and the card count should decrease by exactly one.

**Validates: Requirements 4.3**

---

### Property 6: Cancelling channel deletion leaves the list unchanged

*For any* channel list and any entry selected for deletion, if the user dismisses `ConfirmModal` via the cancel action, the channel list should remain identical to its pre-click state (same entries, same order, same count), and no `api.delete` call should have been made.

**Validates: Requirements 4.4**

---

### Property 7: Valid resource creation calls POST and the entry appears in the library

*For any* resource payload with a valid non-whitespace name, a `http://`/`https://` URL, and a type of `"video"` or `"audio"`, submitting the Add Resource form (with mocked `api.post`) should call `POST /api/footage-resources` with the correct payload, and the returned document should appear in the Creator Asset Library grid with its name, correct type badge, and link to the specified URL.

**Validates: Requirements 6.5, 7.2**

---

### Property 8: ResourceCard renders all required entry fields

*For any* `FootageResource` document, the rendered `ResourceCard` should display the entry's `name`, a type badge containing the correct label ("Video / Footage" for `video`, "Sound / Audio" for `audio`), and an anchor element with `href` equal to the entry's `url` and `target="_blank"`.

**Validates: Requirements 5.2, 5.3**

---

### Property 9: Form fields are empty after dismiss

*For any* form (Add Channel or Add Resource) that has been partially or fully filled in, dismissing the form (via cancel or successful submit) and then re-opening it should result in all fields being empty: name = `""`, all URL fields = `""`, type selector = first option.

**Validates: Requirements 3.6, 6.6**

---

### Property 10: Video and audio type badges are visually distinct

*For any* pair of `FootageResource` values where one has `type: "video"` and the other has `type: "audio"`, the CSS class strings applied to their respective type badge elements in `ResourceCard` should not be identical — the colour token combination must differ between the two types.

**Validates: Requirements 5.4**

---

---

## API Endpoints

All endpoints require a valid JWT Bearer token (`protect`) and `role === "admin"` (`allowRoles("admin")`). `companyId` is always read from `req.user.companyId` — never from the request body.

| Method   | Path                         | Request Body                                                              | Success         | Notes                                      |
|----------|------------------------------|---------------------------------------------------------------------------|-----------------|---------------------------------------------|
| `GET`    | `/api/footage-channels`      | —                                                                         | `200` `FootageChannel[]` sorted newest-first | Company-scoped |
| `POST`   | `/api/footage-channels`      | `{ name*, youtube?, facebook?, twitter?, instagram?, website? }`         | `201` `FootageChannel` | `*` required                         |
| `DELETE` | `/api/footage-channels/:id`  | —                                                                         | `200` `{ message }` | 404 if not found or wrong company       |
| `GET`    | `/api/footage-resources`     | —                                                                         | `200` `FootageResource[]` sorted oldest-first | Includes seeded entries |
| `POST`   | `/api/footage-resources`     | `{ name*, type*, url* }`                                                  | `201` `FootageResource` | type: "video"\|"audio"               |
| `DELETE` | `/api/footage-resources/:id` | —                                                                         | `200` `{ message }` | Works on seeded entries too             |

### Error Response Shape

```json
{ "message": "Human-readable description of the error" }
```

| Status | Condition |
|--------|-----------|
| `400`  | Validation failure (empty name, invalid URL, invalid type) |
| `401`  | Missing or invalid JWT |
| `403`  | User role is not `admin` |
| `404`  | Document not found or belongs to a different company |
| `500`  | Unhandled server error |

---

## Error Handling

### API Load Failure (Page Mount)

`FootageSources` calls `Promise.all([loadChannels(), loadResources()])` on mount. If either call rejects (network error, 4xx, 5xx):

1. Both `channelEntries` and `resourceEntries` remain as `[]` (initial state).
2. `loading` is set to `false` — the page renders normally.
3. A non-blocking `toast.error("Couldn't load footage data — please refresh.")` is displayed.
4. Both sections display their empty-state UI. No crash, no blank screen.

### API Failure on Mutation (Add)

Each modal's submit handler wraps the API call:

```js
try {
  const { data } = await api.post("/footage-channels", payload);
  onSubmit(data);   // update parent state
  onClose();
} catch (err) {
  const msg = err.response?.data?.message || "Something went wrong. Please try again.";
  toast.error(msg);
  // Form stays open; user can retry or cancel
}
```

### API Failure on Mutation (Delete)

On DELETE failure, `ConfirmModal` is closed and `toast.error(...)` is shown, but the item remains in the list. State only updates on confirmed API success — no optimistic removal.

### Server-Side Validation Errors (400)

When the server returns `400` with `{ message }`, the modal surfaces that message via `toast.error(response.data.message)`. This handles edge cases where client-side validation was bypassed.

### 401 / 403 Responses

Handled globally by the `api` axios interceptor in `client/src/utils/api.js`. A 401 triggers an automatic redirect to `/login`. A 403 is surfaced as `toast.error` by the component-level catch block.

### Seed Failure (Server)

`seedFootageResources()` is wrapped in a try/catch and is non-fatal. If the `Company` collection is empty or the DB is temporarily unavailable at boot, a warning is logged and the server continues. The seed will succeed on the next boot once the DB is available.

---

## Testing Strategy

### Test Runner

**Vitest** — consistent with workspace standards. Test files live alongside their source files.

```
client/src/components/footage/ChannelCard.test.jsx
client/src/components/footage/ResourceCard.test.jsx
client/src/components/footage/AddChannelModal.test.jsx
client/src/components/footage/AddResourceModal.test.jsx
client/src/components/footage/LiveSourceChannels.test.jsx
client/src/components/footage/CreatorAssetLibrary.test.jsx
client/src/pages/admin/FootageSources.test.jsx
server/utils/footageSeed.test.js
server/controllers/footageChannelController.test.js
server/controllers/footageResourceController.test.js
```

### Mocking Rules

- Never hit a real MongoDB instance or real API in unit tests.
- Mock the `api` Axios instance: `vi.mock("../../utils/api")` (adjust relative path).
- Mock `react-hot-toast`: `vi.mock("react-hot-toast")` to assert `toast.error` / `toast.success` calls.
- Mock Mongoose models in server controller tests: `vi.mock("../models/FootageChannel")`.

---

### Unit Tests (Example-Based)

Arrange → Act → Assert pattern throughout.

**Frontend:**

| Test | Assertion |
|------|-----------|
| `ChannelCard` with all 5 link fields populated | 5 link anchors rendered with correct `href` |
| `ChannelCard` with only `name` | Zero link anchors rendered |
| `ResourceCard` with `type:"video"` | Badge text "Video / Footage", `Film` icon class present |
| `ResourceCard` with `type:"audio"` | Badge text "Sound / Audio", `Music2` icon class present |
| `AddChannelModal` renders when open | 6 form fields present (name + 5 URL fields) |
| `AddResourceModal` type selector | Both "Video / Footage" and "Sound / Audio" options present |
| `FootageSources` on `api.get` rejection | Empty lists rendered, `toast.error` called |
| Empty channel list | Empty-state message element visible |
| `PageSectionLoader` visibility | Shown while `loading=true`, hidden after calls resolve |

**Backend:**

| Test | Assertion |
|------|-----------|
| `getFootageResources` with empty collection | Inserts 3 seed documents, returns them |
| `getFootageResources` with existing docs | Returns existing docs, no additional inserts |
| `createFootageChannel` with empty name | Returns 400 with `"Channel name is required"` |
| `createFootageResource` with invalid URL | Returns 400 with URL error message |
| `createFootageResource` with invalid type | Returns 400 with `"Invalid resource type"` |
| `deleteFootageChannel` wrong company | Returns 404 (cross-company isolation) |
| All controllers | `companyId` from `req.user.companyId`, never from request body |

---

### Property-Based Tests

Use **[fast-check](https://fast-check.dev)** (`npm install --save-dev fast-check`). Each property test runs a minimum of **100 iterations**.

Tag format: `// Feature: copyright-free-footage-sources, Property N: <property text>`

| Property | Generator(s) |
|----------|-------------|
| P1: Channel card anchors | `fc.record({ name: fc.string({minLength:1}), youtube: fc.option(fc.webUrl()), facebook: fc.option(fc.webUrl()), twitter: fc.option(fc.webUrl()), instagram: fc.option(fc.webUrl()), website: fc.option(fc.webUrl()) })` |
| P2: Whitespace names rejected | `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))` applied to both forms |
| P3: Non-HTTP(S) URLs blocked | `fc.string().filter(s => !/^https?:\/\//i.test(s))` |
| P4: Valid channel creation | `fc.record({ name: fc.string({minLength:1}).map(s=>s.trim()).filter(s=>s.length>0), youtube: fc.option(fc.webUrl()), ... })` + mocked `api.post` |
| P5: Confirm delete removes entry | `fc.array(channelEntryArb, {minLength:1})` + random index selection |
| P6: Cancel delete leaves list unchanged | `fc.array(channelEntryArb, {minLength:1})` + cancel action, assert no API call |
| P7: Valid resource creation | `fc.record({ name: nonWhitespaceString, type: fc.constantFrom("video","audio"), url: fc.webUrl() })` + mocked `api.post` |
| P8: ResourceCard reflects entry data | `fc.record({ name: fc.string({minLength:1}), type: fc.constantFrom("video","audio"), url: fc.webUrl(), _id: fc.uuid() })` → render → DOM assertions |
| P10: Video/audio badges are visually distinct | `fc.tuple(resourceArb("video"), resourceArb("audio"))` → render both → compare badge class strings |

**Example property test skeleton:**

```js
// Feature: copyright-free-footage-sources, Property 2: whitespace-only names are always rejected
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { render, screen, fireEvent } from '@testing-library/react';
import AddChannelModal from '../AddChannelModal';

describe('AddChannelModal', () => {
  it('P2: rejects any whitespace-only channel name', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')),
        (whitespace) => {
          const onSaved = vi.fn();
          const { unmount } = render(
            <AddChannelModal isOpen onClose={() => {}} onSaved={onSaved} />
          );
          fireEvent.change(screen.getByLabelText(/channel name/i), {
            target: { value: whitespace },
          });
          fireEvent.click(screen.getByRole('button', { name: /save/i }));
          expect(onSaved).not.toHaveBeenCalled();
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

---

### Smoke / Integration Checks

- Verify `adminMenu` in `AdminLayout.jsx` contains `{ path: "/admin/footage-sources" }`.
- Verify the route is registered in `App.jsx` with `<PrivateRoute allowedRoles={["admin"]}>`.
- Verify `server/app.js` registers both `/api/footage-channels` and `/api/footage-resources`.
- Verify `seedFootageResources()` is called inside `startServer()` after `connectDB()`.
- Manual dark-mode review: confirm no white-on-white or missing `dark:` classes.
- Manual responsive review: grid at 375 px, 768 px, 1280 px viewport widths.

---

### Coverage Targets

| Module | Target |
|--------|--------|
| `footageSeed.js` | 90%+ |
| `footageChannelController.js` | 90%+ |
| `footageResourceController.js` | 90%+ |
| `ChannelCard`, `ResourceCard` | 80%+ |
| `AddChannelModal`, `AddResourceModal` | 80%+ |
| `LiveSourceChannels`, `CreatorAssetLibrary` | 75%+ |
| `FootageSources` page | 70%+ |
