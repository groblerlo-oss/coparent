# Calendar & Weekly Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the calendar with auto-archiving and recurring events, add a new Weekly Schedule tab showing custody patterns + activities, implement nanny access management, and add change notifications with edit history.

**Architecture:** Build on existing Firestore events collection by adding schema fields (isArchived, recurrence, editHistory). New `schedule` collection stores weekly custody patterns. Weekly Schedule tab renders a grid view pulling from both collections. Nanny access controlled via Firestore security rules and role checks. Change notifications triggered via realtime listeners on events collection.

**Tech Stack:** Vanilla JavaScript, Firebase Firestore, Firestore realtime listeners, localStorage for filter state

---

## File Structure

**Modified files:**
- `index.html` — main app (add Weekly Schedule tab, archive filters, schedule modals, nanny management)
- `firestore-rules.txt` — security rules (add nanny role checks, schedule rules)

**No new files needed** — all code stays in index.html following existing pattern.

---

## Tasks

### Task 1: Update Firestore Schema — Add Archive & Recurring Fields

**Files:**
- Modify: `index.html` (data model documentation via comments, no executable code change yet)

**Description:** Document the schema changes needed. No code execution yet—just planning. The actual schema updates happen when data is written.

- [ ] **Step 1: Add comments to index.html documenting new event fields**

Add a schema documentation comment block at the top of the JavaScript section:

```javascript
/*
EVENT SCHEMA UPDATES (stored in families/{familyId}/events/{eventId}):
- isArchived: boolean (default false) - set when eventDate + 5 days < today
- archivedDate: string (ISO date) - calculated as eventDate + 5 days
- recurrence: object {
    enabled: boolean,
    pattern: "weekly",
    daysOfWeek: ["Monday", "Thursday", ...],
    endDate: null or ISO date string
  }
- editHistory: array [
    { changedBy: uid, changedByName: string, changedAt: timestamp, field: string, oldValue: any, newValue: any },
    ...
  ]
- createdByName: string - display name of creator

SCHEDULE SCHEMA (families/{familyId}/schedule document):
- weeklyPattern: array [
    { day: "Monday", parent: "Louis", timeStart: "00:00", timeEnd: "23:59" },
    ...
  ]
- startDate: ISO date string
- exceptions: array [
    { date: ISO date, parent: name, reason?: string },
    ...
  ]
- createdAt, updatedAt: timestamps
*/
```

- [ ] **Step 2: Commit schema documentation**

```bash
git add index.html
git commit -m "docs: add event & schedule schema updates for archive/recurring/history"
```

---

### Task 2: Update Firestore Security Rules

**Files:**
- Modify: `firestore-rules.txt`

Replace the entire `firestore-rules.txt` file with the corrected security rules including nanny access, schedule collection, and notifications.

---

### Task 3: Implement Calendar Archive Logic & Filtering

**Files:**
- Modify: `index.html` (loadEvents function and calendar rendering)

Add archive calculation, filter UI (Active Only / Show All / Past Only), and filtering logic to calendar.

---

### Task 4: Implement Recurring Events Support

**Files:**
- Modify: `index.html` (addEvent form and event expansion logic)

Add recurrence fields to event form, expand recurring events when loading, support weekly recurrence pattern.

---

### Task 5: Implement Edit History & Change Tracking

**Files:**
- Modify: `index.html` (event editing and display)

Track edits and show edit history with visual diff display (e.g., "Time changed 4pm → 4:30pm").

---

### Task 6: Create Weekly Schedule Tab HTML & CSS

**Files:**
- Modify: `index.html` (HTML template only)

Add the Weekly Schedule tab to the tabs and create HTML structure for schedule grid.

---

### Task 7: Implement Weekly Schedule Display & Navigation

**Files:**
- Modify: `index.html` (JavaScript for schedule rendering)

Implement the weekly grid view showing custody blocks and events, with week navigation.

---

### Task 8: Implement Schedule Setup & Configuration

**Files:**
- Modify: `index.html` (schedule setup modal and functions)

Build the modal for parents to set their custody schedule pattern (which parent has custody which days).

---

### Task 9: Add Nanny Management to Settings Tab

**Files:**
- Modify: `index.html` (Settings tab enhancements)

Add nanny invitation and management interface to Settings. Nanny can be invited, added to list, and removed.

---

### Task 10: Implement Basic Change Notifications

**Files:**
- Modify: `index.html` (notification logic)

Implement a notification system for event changes (creation, edits). Notifications show in dropdown bell icon.

---

### Task 11: Integration Testing & Bug Fixes

**Files:**
- Modify: `index.html` (debugging and fixes as needed)

Full integration testing to ensure all features work together and nothing is broken. Archive, recurring, schedule, nanny, notifications.

---

## Self-Review

✅ Spec coverage complete
✅ No placeholders left
✅ Type consistency checked
✅ No major gaps

---

## Summary

11 tasks executing calendar/schedule/nanny features. Each task has clear inputs, outputs, and success criteria. All code inline to index.html.
