# Expense Split Feature Design

**Date:** 2026-09-09  
**Feature:** Configurable expense tracking with split calculations in ZAR  
**Status:** Design approved, ready for implementation

---

## Overview

Add expense tracking to the Co-Parent Planner with configurable parent splits. Parents set split percentages during family setup or later in Settings, then track expenses and see automatic settlement calculations (who owes whom to balance costs).

---

## User Stories

1. **As Louis & Cecilia**, I want to specify our 50/50 split when creating the Oakens family, so expenses are automatically calculated fairly.
2. **As a parent**, I want to add expenses (groceries, school fees, etc.) and specify who paid, so we can track what's been spent.
3. **As a parent**, I want to see how much each of us has paid and who owes whom, so we can settle expenses fairly.
4. **As a parent**, I want to adjust split percentages in Settings, so we can change terms without recreating the family.
5. **As a nanny/helper**, I want to only see the calendar, so I don't see financial information.

---

## Design

### 1. Family Setup Wizard (3 Steps)

**Step 1: Family Basics** (existing screen)
- Family name input
- Children names input (one per line)

**Step 2: Configure Parents & Splits** (new)
- Parent #1 name input + split % (pre-filled with creator's name)
- "+Add Parent" button to add more
- Parent #2 name input + split %
- (Optional) Parent #3, #4, etc.
- Validation: percentages must sum to exactly 100%
- Error message if sum ≠ 100%

**Step 3: Review & Create** (new)
- Summary of: Family name, children, parents with splits
- "Create Family" button
- On success, parents are added to family and expense tracking is enabled

**Data stored in Firestore:**
```javascript
families/{familyId} = {
  name: "Oakens family",
  children: ["Oaken"],
  parents: [
    { userId: "user123", name: "Louis", split: 50 },
    { userId: "user456", name: "Cecilia", split: 50 }
  ],
  createdBy: "user123",
  createdAt: timestamp
}
```

---

### 2. Expenses Tab

**A) Add Expense Form** (collapsible or modal)

Fields:
- **Amount** (required, numeric in ZAR)
- **Description** (required, text, e.g., "Groceries", "School fees")
- **Date** (required, date picker, defaults to today)
- **Category** (optional, dropdown: Food, Medical, School, Activities, Other)
- **Child Name** (optional, dropdown of family children)
- **Who Paid** (required, dropdown of parent names)
- **Notes** (optional, text area for receipt details)

Submit button: "Add Expense"
Success: Notification shows, form clears, list updates immediately

**B) Expense List**

Display all expenses in reverse chronological order (newest first).

Each row shows:
```
[Date] | [Description] | [Amount in ZAR] | [Category] | Paid by: [Parent Name] | [Delete ✕]
```

Optional expansion: Click row to show notes and linked child (if any)

Delete: Confirmation dialog, then removes from Firestore and updates summary

**C) Summary & Settlement Section** (sticky at top or below list)

**Paid Summary:**
```
💰 Payment Summary
Louis paid: R 2,500.00
Cecilia paid: R 1,500.00
Total: R 4,000.00
```

**Settlement Calculation:**
```
⚖️ Settlement
Fair share per parent (50/50): R 2,000.00
Louis paid: R 2,500.00 → Owed: R 500.00 back
Cecilia paid: R 1,500.00 → Owes: R 500.00

💡 Cecilia owes Louis R 500.00 to settle up.
```

**Data stored in Firestore:**
```javascript
families/{familyId}/expenses/{expenseId} = {
  amount: 500,
  description: "Groceries",
  date: "2026-09-09",
  category: "Food",
  childName: "Oaken",           // optional
  paidBy: "Louis",
  notes: "Checkers receipt",
  createdBy: "user123",
  createdAt: timestamp
}
```

---

### 3. Settings Tab - Parent Configuration (new section)

**Add subsection: "Expense Split Configuration"**

Display:
```
Current Parents & Splits:
┌─────────────────────────────┐
│ Louis - 50%      [Edit] [✕] │
│ Cecilia - 50%    [Edit] [✕] │
└─────────────────────────────┘
[+ Add Parent]
```

Functionality:
- Click "Edit": inline form to update name and split % (with 100% validation)
- Click "✕": remove parent (confirmation dialog)
- Click "+Add Parent": inline form to add new parent with split %
- Changes apply to new expenses only (historical expenses keep original splits)
- Primary parent (creator) cannot be removed

---

### 4. Access Control & Security

**Expenses Tab Visibility:**
- Parents: Full access (add, view, delete expenses)
- Helpers (nanny, granny): No access (tab is hidden)

**Firestore Security Rules:**
```javascript
match /families/{familyId}/expenses/{expenseId} {
  allow read, create, update: if isParent(familyId);
  allow delete: if request.auth.uid == resource.data.createdBy;
}
```

Where `isParent(familyId)` checks if user is in `families/{familyId}/members` with role "parent"

---

### 5. Calculation Logic

**For each expense:**
1. Get all parents and their split %
2. Calculate fair share per parent: `total_expenses / number_of_parents * individual_split%`
3. For settlement: `what_parent_paid - fair_share`
4. Display who owes whom and how much

**Example (50/50 split, Louis paid R2500, Cecilia paid R1500, total R4000):**
- Fair share per parent = R4000 / 2 = R2000
- Louis: paid R2500, fair share R2000 → +R500 (owed back)
- Cecilia: paid R1500, fair share R2000 → -R500 (owes)
- **Result:** "Cecilia owes Louis R500"

---

### 6. UI/UX Notes

- Expenses tab starts empty: "No expenses yet. Add your first expense to get started."
- All amounts display in **ZAR** with currency symbol (R or R )
- Numbers formatted: thousands separator (e.g., R 1,234.56)
- Delete is permanent (no undo), so confirm before deleting
- Form validation: error messages appear inline (e.g., "Amount must be > 0", "Percentages must sum to 100%")
- Success notifications: green background, auto-dismiss after 3s

---

### 7. Implementation Phases

**Phase 1:** Family setup wizard (3 steps, parent config)
**Phase 2:** Expenses tab (add, list, delete)
**Phase 3:** Summary & settlement calculations
**Phase 4:** Settings configuration & updates
**Phase 5:** Security rules & testing

---

### 8. Testing Checklist

- [ ] Create family with 2 parents, 50/50 split
- [ ] Create family with 3 parents, 40/40/20 split
- [ ] Wizard validates percentages sum to 100%
- [ ] Add expense, verify it appears in list
- [ ] Delete expense, verify it's removed
- [ ] Settlement calculation is correct
- [ ] Helper role cannot see Expenses tab
- [ ] Parent role can modify splits in Settings
- [ ] Past expenses keep original splits after config change
- [ ] All amounts display in ZAR correctly

---

### 9. Future Enhancements (out of scope for now)

- Recurring expenses (e.g., monthly utilities)
- Expense categories with filtering
- Receipt image uploads
- Monthly/yearly reports and exports
- Payment settlement (mark as paid, archive)
- Email notifications when settlement is calculated

---

## Success Criteria

1. Parents can configure splits during setup or anytime in Settings
2. Expenses are tracked accurately with all required fields
3. Settlement calculations are correct and displayed clearly
4. Helpers cannot access expense information
5. All data persists in Firestore and survives page refreshes
6. UI is responsive and works on mobile devices

