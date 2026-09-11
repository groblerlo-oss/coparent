# Custody Pattern Quick-Add Feature Design

> **For agentic workers:** Use superpowers:writing-plans to create the implementation plan.

**Goal:** Enable parents to quickly add recurring custody weekend patterns (every week, bi-weekly, monthly) to the calendar with simple one-click setup, then easily handle swaps/overrides without breaking the pattern.

**Architecture:** Custody patterns are calendar events with special metadata (`isCustodyPattern: true`, `category: "custody"`). Swapping marks the original event with swap details and creates a replacement event. The calendar already supports recurring events, so we reuse that infrastructure.

**Tech Stack:** Vanilla JavaScript, Firebase Firestore (existing calendar event collection), HTML/CSS (existing modal patterns)

---

## User Workflow

**Adding a Custody Pattern:**
1. Click "📅 Add Custody Pattern" button in Calendar tab
2. Modal appears with form:
   - **Child with:** Dropdown (Daddy / Mommy / Granny)
   - **Starting Saturday:** Date picker
   - **Recurrence:** Radio buttons (Weekly / Every 2 weeks / Monthly)
   - **End date:** Optional date picker (blank = ongoing)
3. Click Save → Creates Saturday and Sunday events for entire pattern
4. Events appear on calendar immediately

**Swapping a Weekend:**
1. Click a custody event on calendar
2. Event details modal shows
3. Click "Mark as Swapped 🔄" button
4. Calendar date picker: "Move to which Saturday?"
5. Select new date → Creates new events on replacement weekend, marks original as swapped
6. Original event badge changes to "⚠️ Swapped" with notes field

---

## UI Components

### Custody Pattern Button
- Location: Calendar tab, next to "+ Add Event" button
- Label: "📅 Add Custody Pattern"
- Style: Matches existing button styling
- Triggers: Opens custody pattern modal dialog

### Custody Pattern Modal
**Form fields:**
- **Child with** (required)
  - Dropdown: `<select>`
  - Options: "Daddy", "Mommy", "Granny"
  - Default: "Daddy"

- **Starting Saturday** (required)
  - Date picker: `<input type="date">`
  - Must be a Saturday
  - Validation: Show error if user selects non-Saturday date

- **Recurrence** (required)
  - Radio buttons: "Weekly", "Every 2 weeks", "Monthly"
  - Default: "Every 2 weeks"

- **End Date** (optional)
  - Date picker: `<input type="date">`
  - Leave blank for "ongoing"
  - If filled, must be >= starting date and a Sunday

- **Buttons:** Save, Cancel
- **Validation:** Starting Saturday required; error messages for invalid dates

### Custody Event Display (Calendar)
- **Saturday event title:** "Child with Daddy" (or selected person)
- **Sunday event title:** "Child with Daddy" (same text)
- **Category:** "custody" (new category for styling)
- **Badge:** Shows recurrence pattern ("Weekly", "Every 2 weeks", etc.) and swap status if applicable
- **Swap badge:** "⚠️ Swapped" if `swappedTo` field is set

### Swap Modal
- Opens when clicking "Mark as Swapped 🔄" on an existing custody event
- **Date picker:** "Select new Saturday"
- **Notes field:** "Why the swap?" (optional textarea)
- **Buttons:** Confirm, Cancel
- **Result:** Original event marked as swapped, new events created on selected weekend

---

## Data Structure

### Custody Event Document (Firestore)
```
{
  id: "auto-generated",
  title: "Child with Daddy",  // or "Child with Mommy", etc.
  date: "2026-09-12",        // Saturday date (YYYY-MM-DD, local timezone)
  time: "",                  // Empty for all-day custody events
  category: "custody",       // New category for filtering/styling
  notes: "",
  createdBy: "user-id",
  createdByName: "Louis Grobler",
  createdAt: Timestamp,
  isArchived: false,
  archivedDate: "2026-09-22",
  
  // Custody-specific fields
  isCustodyPattern: true,    // Marks this as part of a pattern
  patternId: "pattern-uuid", // Groups events from same pattern
  patternRecurrence: "biweekly",  // "weekly" | "biweekly" | "monthly"
  patternStartDate: "2026-09-12",
  patternEndDate: "2027-12-31",   // null if ongoing
  patternPerson: "Daddy",    // Who has the child
  
  // Swap tracking
  swappedTo: "2026-09-26",   // null if not swapped; date of replacement weekend
  swappedFrom: null,         // null if not a replacement; original pattern date
  swapNotes: "Daddy's birthday weekend",  // Why it was swapped
  swappedAt: Timestamp,      // When swap was made
  
  // Recurrence (existing, reused)
  recurrence: {
    enabled: true,
    pattern: "weekly" | "biweekly" | "monthly",
    daysOfWeek: ["Saturday", "Sunday"],
    endDate: "2027-12-31" | null
  }
}
```

### Sunday Event
- Identical to Saturday event but `date: "2026-09-13"` (one day later)
- Same `patternId` so they're grouped together

---

## Functionality

### Create Custody Pattern
1. User fills form → clicks Save
2. Calculate all dates for pattern:
   - Start from starting Saturday
   - Generate Saturday + Sunday pairs
   - Apply recurrence interval (weekly = 7 days, biweekly = 14 days, monthly = 30 days)
   - Stop at end date (or 3 years out if ongoing)
3. For each Saturday-Sunday pair:
   - Create two calendar events (one for each day)
   - Set `isCustodyPattern: true` and shared `patternId`
   - Save to Firestore in batch writes
4. Show success notification: "✅ Custody pattern created: Every 2 weeks starting Sept 12"

### Swap a Weekend
1. User clicks custody event → details modal shows
2. User clicks "Mark as Swapped 🔄"
3. Swap modal opens: date picker + notes field
4. User selects new Saturday and enters swap reason
5. System:
   - Updates original event: `swappedTo: "new-date"`, `swapNotes: "..."`
   - Creates new events on replacement weekend
   - New events: `swappedFrom: "original-date"`, `swapNotes: "..."`, same `patternId`
   - Save both updates in batch write
6. Notification: "✅ Swapped! Sept 12-13 moved to Sept 26-27"

### View & Edit Swaps
- Swapped events show "⚠️ Swapped" badge on calendar
- Click to view swap details (where it was moved to, reason)
- Can "Undo swap" to restore original or manually edit swap date

### Delete Custody Pattern
- When user deletes a custody event from the calendar:
  - If `isCustodyPattern: true`, ask: "Delete this one weekend or the entire pattern?"
  - Delete one: Just remove that event
  - Delete pattern: Remove all events with same `patternId`

---

## Edge Cases & Constraints

### Overlapping Patterns
- User can create multiple custody patterns (e.g., "Daddy has weekends" + "Granny has Saturdays")
- Both show on calendar; no automatic conflict resolution
- Parents must manage manually if patterns overlap

### Non-Saturday Start Date
- Form validates that starting date is a Saturday
- Show error message: "Please select a Saturday"

### Swapping to Date Already in Pattern
- Allow it (user might intentionally swap twice)
- Both events show on calendar (original marked as swapped + replacement)

### Ongoing Patterns
- If no end date is specified, create events for 3 years (configurable)
- User can later delete pattern or add end date

### Custody Events for Nanny
- Nanny sees custody events on calendar (read-only)
- Helps nanny know where child is/when they're with which parent
- Nanny cannot create/edit custody patterns (parent-only feature)

---

## Testing Strategy

### Unit Tests
- Pattern generation: Verify correct dates generated for weekly/biweekly/monthly
- Saturday validation: Confirm non-Saturday dates rejected
- Batch writes: Ensure all events created atomically

### Integration Tests
- Create custody pattern → Events appear on calendar with correct dates/times
- Swap workflow → Original marked, new events created, data consistent
- Delete pattern → All related events removed
- Nanny sees custody events but cannot edit (permission layer)

### Manual Testing
- Create bi-weekly pattern (Sept 12 - Dec 31)
- Verify 8 weekends (16 events) created
- Swap one weekend (Sept 12-13 to Oct 5-6)
- Verify original marked "⚠️ Swapped", new events created
- Delete pattern → All gone from calendar
- Check Firestore documents are cleaned up

---

## Success Criteria

✅ User can add custody pattern in 3 clicks (button → form → save)
✅ System generates correct dates for weekly/biweekly/monthly patterns
✅ Swap workflow: original marked, replacement created, notes saved
✅ Calendar shows custody events with correct person name
✅ Nanny sees custody events but cannot modify
✅ Swapped events clearly marked with "⚠️" badge
✅ Batch writes ensure data consistency (all events created or none)
✅ User can delete individual weekends or entire pattern
