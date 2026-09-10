# Detailed Activity Schedule Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Weekly Schedule tab with a detailed, editable activity schedule that shows different activities per day across scrollable weeks, with inline editing and full event names in the calendar.

**Architecture:** The schedule displays weeks in a vertical scrollable view (current + 2-3 future weeks visible at once). Each week shows days as columns and activities as rows. Days can have multiple different activities (pickups, homework, meals, etc.). Clicking any cell enables inline editing to add/edit activities. Activity types are semi-custom (predefined defaults plus user-created custom types). The monthly calendar is enhanced to show full event names instead of abbreviations.

**Tech Stack:** Vanilla JavaScript, Firebase Firestore, inline editing (contenteditable or hidden input fields), localStorage for scroll position

---

## 1. Schedule Tab Architecture

### Layout
- **Scrollable container** shows current week + next 2-3 weeks
- Each week is a **full-width section** with:
  - Week header: "Week of Sept 8-14, 2026"
  - Day columns: Sun, Mon, Tue, Wed, Thu, Fri, Sat
  - Activity rows: Dynamic rows for each activity
  - Row height: ~40px per activity
  - Min height per day cell: 120px

### Navigation
- **"Jump to Today"** button sticky at top
- Scrollable container (vertical scroll shows more weeks)
- Each week section 600px tall approximately
- Scroll position saved to localStorage to persist view

### Visual Hierarchy
- Week header bold, 18pt
- Day column headers: 14pt, centered
- Activity cells: 12pt, left-aligned, with person color coding
- Color scheme:
  - Daddy: #667eea (blue)
  - Mommy: #e91e63 (pink)
  - Granny: #ffc107 (yellow)
  - Nanny: #4caf50 (green)
  - Other: #6c757d (gray)

---

## 2. Activity Types

### Predefined Categories
- 🚗 Pickups (school, activities)
- 📚 Homework (supervision, help)
- 🍽️ Meals (breakfast, lunch, dinner)
- 🏠 Home activities (chores, play)
- 🎵 Activities (sports, tutoring, classes)
- 💤 Bedtime routines

### Custom Activities
- Parents can create unlimited custom activity types
- Each custom type has: name, optional icon/emoji, creator UID
- Stored in `families/{familyId}/activityTypes/` collection
- Dropdown in edit form shows all predefined + custom

---

## 3. Editing & Interactions

### Adding Activities
1. **Click empty cell** → inline edit box appears in place
2. User types activity name (or selects from dropdown)
3. User selects "Who" (Mommy/Daddy/Granny/Nanny/Other)
4. User presses Enter or clicks away → saves to Firestore
5. If creating new custom type (not in dropdown), creates it automatically

### Display Format
- Each activity shows: **"[Who] - [Activity Name]"**
- Example: "Daddy - Soccer pickup", "Mommy - Homework 3-4pm"
- Color block on left with person color
- Delete icon (X) on right side on hover

### Editing Existing Activities
1. Click activity → inline edit box appears
2. Modify text or person
3. Press Enter to save or Escape to cancel
4. Delete: Click X button

### Drag to Reorder
- Activities within a day cell can be dragged to reorder
- "order" field in database maintains sequence

---

## 4. Firestore Data Model

### Collections

**`families/{familyId}/weeklySchedule/{weekId}`**
```
{
  weekStart: "2026-09-08" (ISO date, Monday)
  weekEnd: "2026-09-14" (ISO date, Sunday)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**`families/{familyId}/weeklySchedule/{weekId}/days/{dayDate}`**
```
{
  date: "2026-09-09" (ISO date)
  activities: [
    {
      id: "uuid-generated",
      name: "Soccer pickup",
      responsible: "Daddy",
      time: "16:30" (optional - HH:MM format)
      icon: "⚽" (optional)
      createdAt: timestamp
      createdBy: uid
      order: 1
    },
    { ... more activities }
  ]
  updatedAt: timestamp
}
```

**`families/{familyId}/activityTypes/{typeId}`**
```
{
  name: "Soccer Training",
  icon: "⚽",
  category: "activities" (optional),
  createdBy: uid,
  createdAt: timestamp
}
```

### Queries
- Load weeks: `weekStart >= targetDate AND weekStart <= targetDate + 21 days`
- Load single day: Direct document read
- All queries ordered by date ascending

---

## 5. Calendar Enhancements

### Full Event Names
- Event dots on calendar now show **full event name** on hover
- Example: Hover over blue dot → tooltip shows "Soccer - 4:30pm"
- Click dot → opens event detail card (existing functionality)

### Tooltip Display
```
[Event Name]
[Time if available]
[Category]
```

---

## 6. Security Rules

### Firestore Rules
```javascript
// Within match /families/{familyId}

match /weeklySchedule/{weekId} {
  match /days/{dayId} {
    allow read: if isParent(familyId) || isNanny(familyId);
    allow create, update: if isParent(familyId);
    allow delete: if isParent(familyId);
  }
}

match /activityTypes/{typeId} {
  allow read: if isParent(familyId) || isNanny(familyId);
  allow create: if isParent(familyId);
  allow update, delete: if isParent(familyId);
}
```

### Access Control
- Parents (isParent): Full read/write/delete
- Nannies (isNanny): Read-only
- Guests: No access

---

## 7. Features

✅ Scrollable week view (current + 2-3 future weeks visible)
✅ Inline editing (click cell to edit)
✅ Add activities with person assignment
✅ Predefined + custom activity types
✅ Drag-to-reorder activities within a day
✅ Delete activities (X button)
✅ Color-coded by person (Daddy/Mommy/Granny/Nanny)
✅ Nanny read-only access
✅ Calendar enhanced with full event names
✅ Responsive design (mobile-friendly)
✅ Persistence via Firestore

---

## 8. Testing Checklist

- [ ] Add activity to a day cell
- [ ] Edit existing activity (name and person)
- [ ] Delete activity
- [ ] Create custom activity type
- [ ] Drag activity to reorder
- [ ] Scroll through weeks
- [ ] "Jump to Today" button works
- [ ] Nanny can see schedule but cannot edit
- [ ] Calendar shows full event names on hover
- [ ] All changes persist after page reload
- [ ] Mobile responsive (test on 375px viewport)
- [ ] Empty days show empty cells
- [ ] Multiple activities per day stack properly

---

## 9. Success Criteria

✅ Detailed activity schedule fully replaces current Weekly Schedule tab
✅ Parents can manage all family activities in one view
✅ Inline editing is fast and intuitive
✅ Nanny has proper read-only access
✅ Calendar shows meaningful event information
✅ All data persists in Firestore
✅ Mobile responsive and usable on small screens
✅ Performance: Loading weeks < 1 second

---

## 10. Known Constraints & Decisions

- **Semi-custom activities:** Predefined + user-created, not fully free-form from scratch
- **Scrollable weeks:** Better UX than tab/button navigation for multi-week view
- **Inline editing:** Fast and minimal interruption vs modal/drawer approach
- **No time precision:** Times optional (HH:MM), not full scheduling with durations
- **Per-day storage:** Activities stored by date, not by activity type (allows flexibility)
- **Parent-only creation:** Only parents can create activities (nanny can only view)
