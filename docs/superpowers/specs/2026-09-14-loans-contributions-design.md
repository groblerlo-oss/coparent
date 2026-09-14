# Loans & Contributions Feature Design

**Goal:** Enable parents to track recurring contributions (like childcare splits) and one-time loans/debts that affect settlement calculations.

**Architecture:** Store loans and contributions as adjustments in Firestore. Display them in the settlement section and include them in settlement calculations. Simple UI with inline add/edit/delete.

**Tech Stack:** Vanilla JavaScript, Firebase Firestore, HTML/CSS (existing patterns)

---

## User Workflow

**Creating a Loan or Contribution:**
1. Click "+ Add Adjustment" in the Loans & Contributions section
2. Modal appears with form:
   - **Name:** Description (e.g., "Lunchbox contribution", "Lawyer fees")
   - **Amount:** Numeric value
   - **Type:** Radio buttons (Contribution / Loan)
   - **Frequency:** Radio buttons (Monthly / One-time) — only shown for Contributions
   - **From:** Dropdown (parent who pays)
   - **To:** Dropdown (parent who receives)
3. Click Save → Adds to list

**Editing/Deleting:**
- Each adjustment shows [Edit] and [Remove] buttons
- Edit button opens modal with current values
- Remove button deletes the adjustment

**Settlement Impact:**
- All adjustments where `from=current_payer, to=current_creditor` are added to the owed amount
- Example: If Louis owes Cecilia R960 from expenses + R4,500 in adjustments = R5,460 total

---

## UI Components

### Settlement Section Layout

**Before (Current):**
```
Louis owes Cecilia R 960.00
[Breakdown of expenses...]
[Record Payment button]
```

**After (With Adjustments):**
```
Louis owes Cecilia R 5,460.00
[Breakdown of expenses...]

⚖️ Loans & Contributions
━━━━━━━━━━━━━━━━━━━━━━
Lunchbox contribution (monthly): R500
  [Edit] [Remove]

Lawyer fees (one-time): R4,000
  [Edit] [Remove]

Total adjustments: R4,500

[Record Payment button]
```

### Adjustment Modal

**Form fields:**
- **Name** (text input) — required
- **Amount** (number input) — required
- **Type** (radio buttons) — Contribution / Loan — required
- **Frequency** (radio buttons, shown only if Type=Contribution) — Monthly / One-time — required
- **From** (dropdown) — populated with parent names — required
- **To** (dropdown) — populated with parent names — required
- **Buttons:** Save, Cancel

---

## Data Structure

### Adjustments Collection (Firestore)

Location: `families/{familyId}/adjustments/{adjustmentId}`

```javascript
{
  id: "adj-12345",
  name: "Lunchbox contribution",
  amount: 500,
  type: "contribution",           // "contribution" or "loan"
  frequency: "monthly",           // "monthly" or "one-time"
  from: "Louis Grobler",          // payer (parent name)
  to: "Cecilia",                  // recipient (parent name)
  createdBy: "user-uid",          // who created it
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

---

## Functionality

### Load Adjustments
- On settlement calculation, fetch all adjustments for the family
- Filter for `from=current_payer, to=current_creditor`
- Sum their amounts

### Calculate Settlement with Adjustments
1. Calculate base settlement from expenses (existing logic)
2. Load all adjustments
3. Sum adjustments where `from=payer, to=creditor`
4. Add to base settlement amount
5. Display both components in breakdown

### Adjustment Breakdown Display

Show in settlement breakdown:
```
Breakdown:
Louis paid: R 640.00
Cecilia paid: R 2,560.00
Total expenses: R 3,200.00
Fair share each: R 1,600.00

Adjustments:
Louis owes to Cecilia:
  - Lunchbox contribution (monthly): R 500.00
  - Lawyer fees (one-time): R 4,000.00
  - Subtotal: R 4,500.00

TOTAL OWED: R 5,460.00
```

---

## Edge Cases

**Circular adjustments:** If Louis owes Cecilia R500 and Cecilia owes Louis R1,000, show both and let settlement math handle it.

**Duplicate adjustments:** Allow users to add — no deduplication. UI shows all.

**Editing recurring amounts:** Edit modal allows changing amount; updated immediately.

**One-time vs recurring:** Frequency only shown for Contributions. Loans are always one-time.

---

## Firestore Security Rules

Add to `families/{familyId}`:
```
match /adjustments/{adjustmentId} {
  allow read: if request.auth.uid != null;
  allow create, update, delete: if request.auth.uid != null;
}
```

---

## Success Criteria

✅ Users can add recurring contributions (e.g., R500/month lunchbox)
✅ Users can add one-time loans (e.g., R4,000 lawyer fees)
✅ Adjustments display in settlement section with clear breakdown
✅ Adjustments affect settlement calculation (R960 + R4,500 = R5,460)
✅ Users can edit and delete adjustments
✅ Parent names populate from family data
✅ No console errors
