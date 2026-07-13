# Requirements Document

## Introduction

This feature introduces a dedicated "LinkVault" page within the Creator AI admin panel. The page helps content teams manage and discover video footage and audio assets that are free to use without copyright concerns. It is divided into two distinct sections: (1) Live Source Channels — user-managed entries representing government and public social media accounts (YouTube, Facebook, Twitter/X, Instagram, and website links) that teams track to pull footage from — and (2) Creator Asset Library — a curated and optionally user-extendable list of copyright-free resource sites for editors, including Pixabay and Mixkit for video/footage and Instats for sounds/audio. Both sections display entries as visual tiles/cards consistent with the existing Buffer design system.

## Glossary

- **Page**: The "LinkVault" admin page at `/admin/link-vault`.
- **Channel_Entry**: A user-created record representing a government or public social media account, containing a name and one or more social/web links.
- **Resource_Entry**: A record representing a known copyright-free website, categorised as either Video/Footage or Sound/Audio.
- **Resource_Type**: The classification of a Resource_Entry — either `video` (Video/Footage) or `audio` (Sound/Audio).
- **Channel_Card**: A tile/card UI element that displays a Channel_Entry.
- **Resource_Card**: A tile/card UI element that displays a Resource_Entry.
- **Add_Channel_Form**: The inline or modal form used to create a new Channel_Entry.
- **Edit_Channel_Form**: The modal form used to update an existing Channel_Entry, pre-populated with the entry's current values.
- **Edit_Resource_Form**: The modal form used to update an existing Resource_Entry, pre-populated with the entry's current values.
- **Seed_Data**: The pre-populated list of Resource_Entries bundled with the feature (e.g. Pixabay, Mixkit for video; Instats for audio).
- **Channel_Store**: The client-side or server-side persistence layer that holds Channel_Entries.
- **System**: The LinkVault page and its associated components.

---

## Requirements

### Requirement 1: Page Structure and Navigation

**User Story:** As an admin user, I want a dedicated LinkVault page, so that I can access all relevant sources in one organised location.

#### Acceptance Criteria

1. THE System SHALL render a page accessible at the `/admin/link-vault` route, protected by the existing `PrivateRoute` component with `allowedRoles={["admin"]}`.
2. THE System SHALL add a navigation link labelled "LinkVault" to the admin sidebar using the existing `Sidebar` component menu configuration.
3. THE System SHALL display two visually distinct sections on the same page: "Live Source Channels" and "Creator Asset Library", separated by a section heading and a horizontal divider.
4. WHEN the page is loading data, THE System SHALL display a loading indicator consistent with the `PageSectionLoader` component used elsewhere in the application.
5. THE System SHALL apply the Buffer design system (`buffer-card`, `buffer-button-primary`, `buffer-input`, `buffer-text`, `buffer-border`) and support dark mode via `dark:` Tailwind variants throughout the page.

---

### Requirement 2: Live Source Channels — Display

**User Story:** As an admin user, I want to view all saved government and public channel entries as cards, so that I can quickly see and access the sources my team has configured.

#### Acceptance Criteria

1. THE System SHALL display each Channel_Entry as a Channel_Card within the "Live Source Channels" section.
2. WHEN a Channel_Entry has no entries saved, THE System SHALL display an empty-state message indicating that no channels have been added yet, alongside a prompt to add the first one.
3. THE System SHALL render Channel_Cards in a responsive grid layout: single column on mobile, two columns on tablet (≥768px), and three or more columns on desktop (≥1024px).
4. WHEN a Channel_Entry has a value for a given social link (YouTube, Facebook, Twitter/X, Instagram, Website), THE Channel_Card SHALL display that link as a clickable icon or labelled anchor that opens in a new browser tab.
5. WHEN a Channel_Entry has no value for a given social link, THE Channel_Card SHALL not render that link field, preserving visual cleanliness.

---

### Requirement 3: Live Source Channels — Add Entry

**User Story:** As an admin user, I want to add new government or public channel entries, so that I can expand the list of sources available to my team.

#### Acceptance Criteria

1. THE System SHALL provide an "Add Channel" button within the "Live Source Channels" section that opens the Add_Channel_Form.
2. THE Add_Channel_Form SHALL contain the following fields: Channel Name (required text input), YouTube link (optional URL input), Facebook link (optional URL input), Twitter/X link (optional URL input), Instagram link (optional URL input), and Website link (optional URL input).
3. WHEN a user submits the Add_Channel_Form with an empty or whitespace-only Channel Name, THE System SHALL prevent submission and display a validation error on the Channel Name field.
4. WHEN a user submits the Add_Channel_Form with a non-empty Channel Name, THE System SHALL create a new Channel_Entry, add it to the Channel_Card grid, and dismiss the Add_Channel_Form.
5. WHEN a user provides a value for any URL field in the Add_Channel_Form, THE System SHALL validate that the value begins with `http://` or `https://`; IF the value does not begin with `http://` or `https://`, THEN THE System SHALL display a field-level validation error and prevent submission.
6. WHEN the Add_Channel_Form is dismissed (either by cancellation or successful submission), THE System SHALL reset all form fields to their empty default state.

---

### Requirement 4: Live Source Channels — Delete Entry

**User Story:** As an admin user, I want to remove a channel entry I no longer need, so that the list stays relevant and uncluttered.

#### Acceptance Criteria

1. THE Channel_Card SHALL display a delete action (e.g. a trash icon button) that is accessible and visually consistent with the Buffer design system.
2. WHEN a user activates the delete action on a Channel_Card, THE System SHALL display a confirmation prompt (using the existing `ConfirmModal` component or equivalent) before removing the entry.
3. WHEN a user confirms the deletion, THE System SHALL remove the Channel_Entry from the Channel_Store and remove the corresponding Channel_Card from the grid.
4. WHEN a user cancels the deletion, THE System SHALL dismiss the confirmation prompt and leave the Channel_Entry unchanged.

---

### Requirement 4a: Live Source Channels — Edit Entry

**User Story:** As an admin user, I want to edit an existing channel entry, so that I can correct or update its name and links without deleting and re-creating it.

#### Acceptance Criteria

1. THE Channel_Card SHALL display an edit action (e.g. a pencil icon button) alongside the delete action, accessible and visually consistent with the Buffer design system.
2. WHEN a user activates the edit action on a Channel_Card, THE System SHALL open the Edit_Channel_Form pre-populated with the Channel_Entry's current name and link values.
3. THE Edit_Channel_Form SHALL contain the same fields as the Add_Channel_Form: Channel Name (required), YouTube, Facebook, Twitter/X, Instagram, and Website URL (all optional).
4. WHEN a user submits the Edit_Channel_Form with an empty or whitespace-only Channel Name, THE System SHALL prevent submission and display a validation error on the Channel Name field.
5. WHEN a user provides a value for any URL field in the Edit_Channel_Form, THE System SHALL validate that the value begins with `http://` or `https://`; IF it does not, THE System SHALL display a field-level validation error and prevent submission.
6. WHEN a user submits the Edit_Channel_Form with valid values, THE System SHALL update the existing Channel_Entry in the Channel_Store and reflect the updated values on the Channel_Card without a page reload.
7. WHEN the Edit_Channel_Form is dismissed (either by cancellation or successful save), THE System SHALL reset the form to its closed state.

---

### Requirement 5: Creator Asset Library — Display

**User Story:** As an admin user, I want to view a curated list of copyright-free websites for video and audio, so that I can quickly find and navigate to the right resource site.

#### Acceptance Criteria

1. THE System SHALL pre-populate the "Creator Asset Library" section with Seed_Data entries on first load, including at minimum: Pixabay (video), Mixkit (video), and Instats (audio).
2. THE System SHALL display each Resource_Entry as a Resource_Card within the "Creator Asset Library" section.
3. THE Resource_Card SHALL display the resource name, its Resource_Type label ("Video / Footage" or "Sound / Audio"), and a clickable link that opens the resource website in a new browser tab.
4. THE System SHALL visually differentiate Resource_Cards by Resource_Type, using a colour-coded badge or icon consistent with the Buffer design system (e.g. a distinct accent colour or icon for video versus audio).
5. THE System SHALL render Resource_Cards in a responsive grid layout consistent with the Channel_Card grid defined in Requirement 2.3.

---

### Requirement 6: Creator Asset Library — Add Entry

**User Story:** As an admin user, I want to add new copyright-free resource websites beyond the pre-populated list, so that I can keep the resource collection up to date.

#### Acceptance Criteria

1. THE System SHALL provide an "Add Resource" button within the "Creator Asset Library" section that opens an add-resource form.
2. THE add-resource form SHALL contain the following fields: Resource Name (required text input), Resource Type (required selector with options "Video / Footage" and "Sound / Audio"), and Website URL (required URL input).
3. WHEN a user submits the add-resource form with an empty or whitespace-only Resource Name, THE System SHALL prevent submission and display a validation error on the Resource Name field.
4. WHEN a user submits the add-resource form with an invalid or missing Website URL, THE System SHALL prevent submission and display a validation error on the Website URL field.
5. WHEN a user submits the add-resource form with valid values for all required fields, THE System SHALL create a new Resource_Entry, add it to the Resource_Card grid, and dismiss the add-resource form.
6. WHEN the add-resource form is dismissed (either by cancellation or successful submission), THE System SHALL reset all form fields to their empty default state.

---

### Requirement 6a: Creator Asset Library — Edit Entry

**User Story:** As an admin user, I want to edit an existing resource entry, so that I can update its name, type, or URL without deleting and re-creating it.

#### Acceptance Criteria

1. THE Resource_Card SHALL display an edit action (e.g. a pencil icon button) alongside the delete action, accessible and visually consistent with the Buffer design system.
2. WHEN a user activates the edit action on a Resource_Card, THE System SHALL open the Edit_Resource_Form pre-populated with the Resource_Entry's current name, type, and URL values.
3. THE Edit_Resource_Form SHALL contain the same fields as the add-resource form: Resource Name (required), Resource Type (required selector), and Website URL (required).
4. WHEN a user submits the Edit_Resource_Form with an empty or whitespace-only Resource Name, THE System SHALL prevent submission and display a validation error.
5. WHEN a user submits the Edit_Resource_Form with an invalid or missing Website URL, THE System SHALL prevent submission and display a validation error.
6. WHEN a user submits the Edit_Resource_Form with valid values, THE System SHALL update the existing Resource_Entry and reflect the updated values on the Resource_Card without a page reload.
7. WHEN the Edit_Resource_Form is dismissed (either by cancellation or successful save), THE System SHALL reset the form to its closed state.

---

### Requirement 7: Data Persistence

**User Story:** As an admin user, I want my channel and resource entries to persist across page reloads and sessions, so that I do not need to re-enter them each time.

#### Acceptance Criteria

1. WHEN a Channel_Entry is created, edited, or deleted, THE System SHALL persist the updated Channel_Store state so that the same entries are visible after a page reload.
2. WHEN a Resource_Entry is added or edited by the user, THE System SHALL persist the changes so that they remain visible after a page reload.
3. THE System SHALL load persisted Channel_Entries and user-added Resource_Entries on page mount, merging user-added Resource_Entries with the Seed_Data without duplication.
4. IF loading persisted data fails, THEN THE System SHALL display the Seed_Data Resource_Entries and an empty Channel_Entry list, and SHALL display a non-blocking error notification informing the user that saved data could not be loaded.
