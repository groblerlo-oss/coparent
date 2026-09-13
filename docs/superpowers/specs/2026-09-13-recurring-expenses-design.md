# Recurring Expenses Feature Design

**Goal:** Enable parents to set up recurring monthly expenses (school fees, medical aid, etc.) that auto-generate each month with clear "Paid By" tracking for settlement calculations.

**Architecture:** Recurring expenses are calendar events stored in Firestore with metadata (`isRecurring: true`, `recurringTemplate`, `paidBy`, `frequency`). Auto-generation happens on-load or via scheduled task. Each generated expense is a separate record for full history tracking.

**Tech Stack:** Vanilla JavaScript, Firebase Firestore, HTML/CSS (existing patterns)

---

## User Workflow

**Creating a Recurring Expense:**
1. Click "+ Add Recurring Expense" button in Expenses tab
2. Modal appears with form:
   - **Description:** Expense name (School Fees, Medical Aid, etc.)
   - **Amount:** Monthly amount
   - **Category:** School, Medical, Other, etc.
   - **Paid By:** Dropdown (Mom, Dad, Shared)
   - **Start Date:** When to begin auto-generation
   - **End Date:** (Optional) When to stop, blank = ongoing
   - **Frequency:** Monthly, Bi-weekly, Weekly
3. Click Save → Creates template, generates current + next 3 months

**Auto-Generation:**
- On app load, checks for recurring templates
- Generates new expenses for current month + upcoming months
- Each generated expense is independent record
- Can edit/skip individual occurrences

**Viewing & Managing:**
- Expenses tab shows both recurring and one-time
- Dashboard breakdown: "Mom's recurring: R5,000/month", "Dad's: R3,500/month", "Shared: R2,000/month"
- Can edit individual months if amount changes
- Can pause/resume template
- Can delete template (doesn't delete past records)

---

## UI Components

### Recurring Expense Button
- Location: Expenses tab, next to "+ Add Expense"
- Label: "+ Add Recurring Expense"
- Triggers recurring expense modal

### Recurring Expense Modal
**Form fields:**
- **Description** (required) - Text input
- **Amount** (required) - Number input
- **Category** (required) - Dropdown (School, Medical, Other)
- **Paid By** (required) - Radio buttons (Mom, Dad, Shared)
- **Start Date** (required) - Date picker
- **End Date** (optional) - Date picker, blank = ongoing
- **Frequency** (required) - Radio buttons (Monthly, Bi-weekly, Weekly)
- **Buttons:** Save, Cancel

### Dashboard Recurring Summary
- Card showing:
  - "Mom's Recurring Expenses: R5,000/month"
  - "Dad's Recurring Expenses: R3,500/month"
  - "Shared Expenses: R2,000/month"
  - "Total Monthly: R10,500"
- Expand to show list of recurring items

### Expenses Table Update
- Add "Recurring" badge next to one-time expenses
- Show "Next Billing" date for recurring
- Display "Paid By" column
- Show "Edit" option for individual occurrences

---

## Data Structure

### Recurring Template (Firestore)
```
{
  id: "template-uuid",
  description: "School Fees",
  amount: 1335,
  category: "school",
  paidBy: "mom",        // "mom" | "dad" | "shared"
  startDate: "2026-09-01",
  endDate: null,        // null = ongoing
  frequency: "monthly", // "weekly" | "biweekly" | "monthly"
  isRecurring: true,
  createdBy: "user-id",
  createdAt: Timestamp,
  active: true,         // Can pause template
  templateId: "template-uuid"
}
```

### Generated Expense (Firestore)
```
{
  id: "auto-generated",
  description: "School Fees",
  date: "2026-09-01",
  amount: 1335,
  category: "school",
  paidBy: "mom",
  createdBy: "user-id",
  createdAt: Timestamp,
  isArchived: false,
  
  // Tracking fields
  isRecurring: true,
  templateId: "template-uuid",      // Links to template
  generatedMonth: "2026-09",         // For queries
  skipped: false,                    // Can skip individual months
  editedAmount: null,                // If manually changed from template
  
  // Payment tracking
  paid: false,
  paidDate: null,
  paidNotes: ""
}
```

---

## Functionality

### Create Recurring Expense
1. User fills form → clicks Save
2. System validates dates and amounts
3. Creates recurring template in Firestore
4. Auto-generates expenses for:
   - Current month (if start date <= today)
   - Next 3 months
5. Shows confirmation: "✅ Recurring expense created: School Fees R1,335/month starting Sept 1"

### Auto-Generation Logic
- On app load, check all active recurring templates
- For each template:
  - Check if current month already has generated expense
  - If not, generate one with generatedMonth = current month
  - Also generate next month if not exists
- Generate expenses with `isRecurring: true`, `templateId` for tracking

### View Recurring Expenses
- Dashboard card shows total by person and frequency
- Expenses tab shows both types with "Recurring" badge
- Expand "Show Details" to see next billing dates

### Edit Individual Occurrence
- Click expense → "Edit this month" option
- Change amount, paid status, notes
- Original template unchanged
- Sets `editedAmount` flag so reports show deviation

### Pause/Resume Template
- Long-press recurring template → "Pause" option
- Sets `active: false`, stops new generation
- Can resume to restart generation

### Delete Template
- Removes template, doesn't delete past records
- All generated expenses remain in history

---

## Edge Cases

### What if user starts template mid-month?
- If start date is Sept 15, first generated expense is Sept 15
- Next is Oct 15, Nov 15, etc.

### Overlapping templates?
- Allow multiple templates (e.g., School Fees + Medical Aid)
- Dashboard aggregates all recurring by person

### Shared expenses (50/50)?
- When `paidBy: "shared"`, counts as 50% for each parent
- Settlement calculation: Each owes 50% of shared

### Editing template later?
- Only affects NEW generations
- Existing generated expenses keep original amount
- To change past months, edit individual occurrences

### End date reached?
- Stop generating new expenses
- Existing ones stay in history
- Template marked `active: false` automatically

---

## Testing Strategy

### Unit Tests
- Date generation: Verify correct dates for weekly/biweekly/monthly
- Paid By calculation: Verify settlement math for shared expenses
- Template validation: Start/end date logic

### Integration Tests
- Create template → verify auto-generation for 3 months
- Edit individual month → verify doesn't affect template
- Pause template → verify stops generation
- Settlement calculation includes recurring totals

### Manual Testing
- Create school fees recurring template (monthly)
- Verify Sept, Oct, Nov expenses auto-generated
- Edit Oct amount → verify only Oct changed
- Check dashboard summary shows recurring totals
- Verify "Paid By" filtering works

---

## Success Criteria

✅ User can create recurring expenses in 3 clicks (button → form → save)
✅ System auto-generates monthly expenses for at least 3 months ahead
✅ Dashboard shows "Mom's recurring", "Dad's recurring", "Shared recurring" totals
✅ Individual occurrences can be edited/skipped without affecting template
✅ Settlement calculations include recurring expense totals
✅ Full history preserved for all generated expenses
✅ Recurring expenses can be paused/resumed
✅ "Paid By" field correctly tracks who pays what
