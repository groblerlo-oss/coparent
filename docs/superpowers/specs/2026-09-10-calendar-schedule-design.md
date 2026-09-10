# Calendar & Weekly Schedule Feature Design

> **For agentic workers:** This design is approved and ready for implementation planning.

**Goal:** Enhance calendar with auto-archiving and event history, add a new Weekly Schedule tab showing custody patterns + activities, enable nanny access with event creation permissions, and implement change notifications when events are edited.

**Architecture:** Two interconnected systems — the enhanced Calendar (with archive filtering and recurring events) and the new Weekly Schedule (grid-based custody + activities view). Both pull from the same events collection. Firestore security rules grant nanny read-only schedule access with event creation permissions. Notifications trigger on changes.

**Tech Stack:** Vanilla JavaScript, Firebase Firestore, serverless notifications (via Firestore listeners)

---

## 1. Data Model

### Collections Structure

```
families/{familyId}/
  ├── schedule (ONE document - recurring custody pattern)
  │   ├── weeklyPattern: Array<{
  │   │   day: string ("Monday"-"Sunday"),
  │   │   parent: string (parent name or UID),
  │   │   timeStart: string ("HH:MM" format),
  │   │   timeEnd: string ("HH:MM" format)
  │   │ }>
  │   ├── startDate: string (ISO date "YYYY-MM-DD")
  │   ├── exceptions: Array<{
  │   │   date: string (ISO date),
  │   │   parent: string,
  │   │   reason?: string
  │   │ }> (overrides for specific dates)
  │   ├── createdAt: Timestamp
  │   └── updatedAt: Timestamp
  │
  ├── events/{eventId}
  │   ├── title: string
  │   ├── date: string (ISO date "YYYY-MM-DD")
  │   ├── time: string ("HH:MM" format)
  │   ├── duration?: number (minutes, default 60)
  │   ├── category: string ("appointment" | "activity" | "note")
  │   ├── description?: string
  │   ├── createdBy: string (parent UID or "nanny")
  │   ├── createdByName: string (display name)
  │   ├── createdAt: Timestamp
  │   ├── updatedAt: Timestamp
  │   ├── updatedBy?: string (UID of who last edited)
  │   ├── isArchived: boolean (calculated: date + 5 days < today)
  │   ├── archivedDate: string (calculated: eventDate + 5 days)
  │   ├── recurrence?: {
  │   │   enabled: boolean,
  │   │   pattern: string ("weekly" - only weekly initially),
  │   │   daysOfWeek: Array<string> (["Monday", "Thursday", ...]),
  │   │   endDate?: string (ISO date, null = ongoing)
  │   │ }
  │   ├── editHistory: Array<{
  │   │   changedBy: string (UID),
  │   │   changedByName: string,
  │   │   changedAt: Timestamp,
  │   │   field: string (e.g., "time", "title", "category"),
  │   │   oldValue: any,
  │   │   newValue: any
  │   │ }>
  │   └── (DELETED events remain in DB with deletedAt field - soft delete)
  │
  └── nannies/{nanny_document_id}
      ├── uid: string (Firebase UID)
      ├── email: string
      ├── name: string
      ├── status: string ("pending" | "active")
      ├── permissions: Array<string> (["view_schedule", "add_events"])
      ├── addedAt: Timestamp
      ├── addedBy: string (parent UID)
      └── inviteToken: string (for invite links, expires 7 days)
```

---

## 2. Calendar Tab Enhancements

### 2.1 Archive & Filtering Logic

**Archive Calculation:**
- Each event gets `archivedDate = eventDate + 5 days`
- On page load, recalculate `isArchived` for all events
- If today > `archivedDate`, set `isArchived = true`
- Archived events stay in Firestore permanently (history)

**Filter UI:**
- Three toggle buttons above calendar: **"Active Only"** (default) | **"Show All"** | **"Past Only"**
- State persisted in localStorage
- Active Only = hides `isArchived == true` events
- Show All = shows everything
- Past Only = shows only `isArchived == true` events

**Visual Styling:**
- Active events: Normal styling (full opacity, normal colors)
- Past events: Gray background (#e0e0e0), 60% opacity, smaller font, "📋 Past" badge prepended to title
- Both show edit history on hover/click

### 2.2 Recurring Events

**Recurrence Field:**
- Optional `recurrence` object on event document
- Initially support: `pattern: "weekly"` with `daysOfWeek: Array<string>`
- Optional `endDate` (null = ongoing indefinitely)

**Event Expansion:**
- On load, expand recurring events into individual instances
- Example: "Soccer" recurring ["Thursday", "Saturday"] → creates virtual events for all Thursdays/Saturdays up to today + 90 days
- Each expanded instance inherits `recurrence` object so it can regenerate
- Editing a recurring event: modal asks "Update this event only" or "Update this and all future events"

**Archiving recurring events:**
- Each expanded instance has its own archive date (instance date + 5 days)
- Archive filter applies to all instances independently

### 2.3 Event Display Enhancements

**On Calendar:**
```
[Date] | [Title] | [Time] | [Category Badge] | [Actions]
```

- If event has edit history: show "✏️ Edited" indicator
- On hover/click: show full edit history in a dropdown
- Edit history format: "Louis changed Time from 4:00pm to 4:30pm (Sep 10 2:15pm)"

---

## 3. New Weekly Schedule Tab

### 3.1 UI Layout

**Grid View:**
```
            Monday      Tuesday     Wednesday   Thursday    Friday      Saturday    Sunday
6am-12pm    [LOUIS]     [CECILIA]   [LOUIS]     [LOUIS]     [LOUIS]     [CECILIA]   [CECILIA]
            Doctor      
            10:00am     
            
12pm-6pm    [LOUIS]     [CECILIA]   [LOUIS]     [LOUIS]     [LOUIS]     [CECILIA]   [CECILIA]
                                                 Soccer
                                                 4:00pm
6pm-10pm    [LOUIS]     [CECILIA]   [LOUIS]     [LOUIS]     [LOUIS]     [CECILIA]   [CECILIA]
```

**Components:**
- Custody blocks: Large colored background (Louis = #667eea blue, Cecilia = #e91e63 pink)
- Event boxes: Smaller overlay boxes on custody blocks, color-coded by category
  - Appointment: #dc3545 (red)
  - Activity: #ffc107 (amber)
  - Note: #6c757d (gray)
- View mode toggles: "This Week" | "Next Week" | (navigation arrows)

### 3.2 Nanny View (Read-Only)

- Nanny sees the same grid
- Cannot edit custody blocks
- Can see all events (including who added them)
- Has "+ Add Event" button
- Cannot delete or edit existing events
- Cannot access "Edit Schedule" for custody pattern

### 3.3 Parent View (Full Control)

- Can edit custody blocks (click → "Edit Custody" modal)
- Can override specific weeks (click week → "Override This Week")
- Can add/edit/delete events
- "Set Schedule" button → configure default weekly pattern
- "Edit This Week" button → override specific week without changing default

---

## 4. Permissions & Nanny Access

### 4.1 Nanny Invitation Workflow

**Parents invite:**
1. Settings tab → "Nanny Management" section
2. Click "+ Add Nanny"
3. Enter email, optional name
4. System sends invite email with link
5. Link generates `inviteToken` with 7-day expiry
6. Nanny clicks link, logs in, accepts access
7. Status changes to "active"

**Access granted:**
- Nanny sees Calendar & Weekly Schedule tabs
- Tabs: Expenses, Messages, Documents, Settings are hidden
- Nanny role added to Firestore document

### 4.2 Firestore Security Rules

```javascript
// In families/{familyId}/schedule
match /schedule/{doc} {
  allow read: if isParent(familyId) || isNanny(familyId);
  allow write: if isParent(familyId);
}

// In families/{familyId}/events
match /events/{eventId} {
  allow read: if isParent(familyId) || isNanny(familyId);
  allow create: if isParent(familyId) || isNanny(familyId);
  allow update: if isParent(familyId) && (
    // Parent can edit any event, or nanny can edit only their own
    resource.data.createdBy == request.auth.uid ||
    resource.data.createdBy == "nanny"
  );
  allow delete: if isParent(familyId);
}

// Helper functions
function isParent(familyId) {
  return request.auth.uid != null && 
    get(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid)).data.role == 'parent';
}

function isNanny(familyId) {
  return request.auth.uid != null &&
    get(/databases/$(database)/documents/families/$(familyId)).data.nannies != null &&
    request.auth.uid in get(/databases/$(database)/documents/families/$(familyId)).data.nannies[*].uid;
}
```

---

## 5. Change Notifications

### 5.1 When Notifications Trigger

**Event Created:**
- If created by parent: notify other parent(s)
- If created by nanny: notify both parents

**Event Edited:**
- Notify all other family members (other parent, nanny)
- Include what changed: "Time changed 4:00pm → 4:30pm"

**Event Deleted:**
- Notify other parent + nanny

**Custody Schedule Changed:**
- Notify nanny + other parent

### 5.2 Notification Content

**In-app:**
- Toast notification in top-right corner
- Persistent notification in new "Notifications" dropdown (icon in header)
- Format: "[Who] updated: [Event Title] - [What changed]"
- Example: "Louis updated: Soccer training - Time changed 4:00pm → 4:30pm"

**Event Display with Change Indicator:**
- When viewing calendar/schedule, show: "⏰ Time changed: ~~4:00pm~~ → **4:30pm**"
- Strikethrough old value, bold new value
- On hover: show full edit history

**Email (optional - Phase 2):**
- Daily digest of changes
- Only for nanny (parents see in-app)

### 5.3 Implementation

- Use Firestore realtime listeners on `events` and `schedule` collections
- Compare new state to previous state
- Build notification message
- Store in new `families/{familyId}/notifications/{notificationId}` collection
- UI reads from notifications collection and displays

---

## 6. Event Management Workflow

### 6.1 Adding Events

**From Calendar Tab:**
- "+ Add Event" button (existing, enhanced)
- Modal form:
  - Title (required)
  - Date (required)
  - Time (required)
  - Duration (optional, default 60 min)
  - Category (required: Appointment | Activity | Note)
  - Description (optional)
  - Recurring? (Yes/No)
    - If yes: select days of week + optional end date
  - Notes

**From Weekly Schedule Tab:**
- Click on a time block → quick add modal
- Auto-fills date and time from clicked block
- Same fields as above

**Validation:**
- Title required, 1-100 characters
- Date must be today or future
- Time format validation (HH:MM)
- If recurring: at least one day selected

### 6.2 Editing Events

**Parent editing own event:**
- Can edit any field
- Creates edit history entry
- Asks if recurring: "Update this occurrence only" or "This and all future"

**Parent editing other parent's event:**
- Can edit, but shows notification to original creator
- Still creates edit history

**Nanny:**
- Cannot edit any event
- Can only delete via request (or this is restricted entirely - TBD per parent preference)

### 6.3 Deleting Events

**Parents:** Can delete any event
**Nanny:** Cannot delete (only parents can)

**Soft delete:** Set `deletedAt` timestamp, filter out from calendar view
- Can be restored by parent (within 30 days?)

---

## 7. Weekly Schedule Configuration

### 7.1 Initial Setup

**First-time parents:**
- On first access to Weekly Schedule, if no schedule exists
- Show "Set Up Your Custody Schedule" modal
- Builder interface:
  - Day selector (Mon-Sun)
  - Parent dropdown (select who has custody that day)
  - Time pickers (start/end)
  - Preview of result
  - Save button

**Output:** Creates `schedule` document in Firestore

### 7.2 Editing Schedule

**"Edit Schedule" button in Weekly Schedule tab:**
- Opens same builder modal
- Pre-filled with current pattern
- Changes apply to future weeks only (doesn't retroactively change past)

**"Override This Week" button:**
- Opens minimal modal: "This week, [date range], custody goes to [parent]"
- Creates exception in `schedule.exceptions` array
- Only affects that one week

---

## 8. Testing Checklist

### Calendar Archive & Filtering
- [ ] Event displays normally 5 days after event date
- [ ] On day 6, event marked as past and grayed out
- [ ] Filter "Active Only" hides past events
- [ ] Filter "Show All" shows everything
- [ ] Filter "Past Only" shows only archived
- [ ] Filter state persists in localStorage
- [ ] Recurring events each get own archive date

### Weekly Schedule
- [ ] Default schedule displays correctly (custody blocks show)
- [ ] Events overlay on correct time blocks
- [ ] Parent can click custody block to edit
- [ ] Parent can click "Override This Week"
- [ ] Nanny sees schedule read-only
- [ ] Nanny can add events from schedule tab

### Nanny Access
- [ ] Nanny invitation email sent
- [ ] Nanny can accept invite and access calendar/schedule
- [ ] Nanny cannot see Expenses, Messages, Documents, Settings tabs
- [ ] Nanny can add events
- [ ] Nanny cannot edit/delete events
- [ ] Nanny cannot edit custody schedule

### Notifications
- [ ] Event created by parent → other parent notified
- [ ] Event edited → notification shows what changed (time: 4pm → 4:30pm)
- [ ] Edit history visible on event
- [ ] Custody schedule changed → nanny notified
- [ ] Notification format clear and actionable

### Edge Cases
- [ ] Recurring event: one occurrence in past, one future → handles archive correctly
- [ ] Event created by nanny → parents notified with "Nanny added"
- [ ] Parent edits event to exact same time → no notification (or notification acknowledges no change)
- [ ] Very long edit history → displays without breaking UI

---

## 9. Success Criteria

✅ Calendar shows active and past events with clear filtering
✅ Past events visible only via "Past Only" or "Show All" filters
✅ Recurring events (weekly pattern) display and expand correctly
✅ New Weekly Schedule tab shows custody + events in grid view
✅ Parents can set/edit custody schedule
✅ Nanny can view schedule and add events (read-only access)
✅ Event changes trigger notifications with visible change indicators
✅ Edit history tracks all changes with who/what/when
✅ No existing calendar functionality broken
✅ Mobile-responsive (grid view works on smaller screens)

---

## 10. Files to Modify

- `index.html` (main app file)
  - Add Weekly Schedule tab HTML
  - Enhance calendar HTML with filters
  - Add schedule setup modal HTML
  - Add nanny management section to Settings
  - JavaScript: archive logic, recurring expansion, notifications, change tracking

- `firestore-rules.txt` (security rules)
  - Add nanny role checks
  - Add schedule and events collection rules
  - Add notifications collection rules

- New file (optional): `DESIGN-calendar-schedule.md` (this document)

---

## 11. Known Constraints & Decisions

- **Recurring pattern only:** Weekly pattern initially. Monthly/custom patterns in Phase 2.
- **No timezone handling:** Assumes all parents/nanny in same timezone. Phase 2: add timezone support.
- **Soft delete only:** Events marked deleted but not removed. Enables restore. No permanent deletion (except admin action).
- **Change notification immediate:** Real-time via Firestore listeners. No batching/digests in Phase 1.
- **Nanny cannot delete events:** Only parents can delete. Nanny can only add. This prevents accidental deletions.

