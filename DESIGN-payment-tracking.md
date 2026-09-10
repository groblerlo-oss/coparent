# Payment Tracking Feature Design

**Date:** 2026-09-10  
**Feature:** Payment recording and settlement tracking  
**Status:** Design approved, ready for implementation  
**Phase:** Phase 1 (Simple payment ledger; recurring expenses in Phase 2)

---

## Overview

Enable parents to record payments toward settlements. Track who paid whom, when, and how much. Automatically calculate remaining balances and settlement progress. Keep immutable payment history.

---

## User Stories

1. **As a parent**, I want to record a payment toward a settlement (e.g., "Mom paid Louis R 50"), so we have a record of payments made.
2. **As a parent**, I want to see the payment history for each settlement, so I can verify what's been paid.
3. **As a parent**, I want to see the remaining balance automatically calculated, so I know how much is still outstanding.
4. **As a parent**, I want settlements to show as "SETTLED" when fully paid, so I know when we're even.

---

## Data Model

### Firestore Structure

**New `payments` subcollection** under `families/{familyId}`:

```
families/{familyId}/payments/{paymentId}
  - from: string (parent name, e.g., "Mom")
  - to: string (parent name, e.g., "Louis")
  - amount: number (ZAR)
  - date: string (YYYY-MM-DD)
  - createdAt: timestamp
```

**Settlement** (calculated dynamically):
- Not stored (computed from expenses + payments each time)
- Cached for display performance
- Recalculated when expenses or payments change

---

## UI Components

### 1. Settlement Display (Expenses Tab)

Current settlement shows:
```
💰 Expense Summary
├─ Louis paid: R 2,500.00
├─ Mom paid: R 1,500.00
└─ Total: R 4,000.00

⚖️ Settlement
├─ Mom owes Louis R 100
├─ 📊 Progress: Paid R 100 of R 100 ✅ SETTLED
└─ [▼ Payment History]
```

### 2. Payment History (Expandable)

When expanded:
```
Payment History: Mom → Louis R 100
├─ Sep 9: Mom → Louis, R 50
└─ Sep 12: Mom → Louis, R 50
```

### 3. Record Payment Form

Button below each settlement:
- Label: "Record Payment"
- Opens modal/form with:
  - **From:** Dropdown (auto-filled from settlement debtor)
  - **To:** Dropdown (auto-filled from settlement creditor)
  - **Amount:** Number input (defaults to remaining balance, editable for partial payments)
  - **Date:** Date picker (defaults to today)
  - **Button:** "Record Payment"

Form validation:
- Amount must be > 0
- Amount cannot exceed remaining balance (warn but allow override)
- Date must be valid

---

## Data Flow

1. **User adds expense** → Settlement calculated
   ```
   Settlement: "Mom owes Louis R 100"
   ```

2. **User clicks "Record Payment"** → Form opens
   ```
   Form shows:
   - From: Mom (pre-filled)
   - To: Louis (pre-filled)
   - Amount: 100 (remaining balance)
   - Date: Today
   ```

3. **User enters payment** → Saves to Firestore
   ```
   payments/payment001
     from: "Mom"
     to: "Louis"
     amount: 50
     date: "2026-09-10"
   ```

4. **Settlement recalculates** → Progress updates
   ```
   Settlement: "Mom owes Louis R 100"
   Progress: Paid R 50 of R 100 (50% complete)
   ```

5. **User records second payment** → Settlement complete
   ```
   Settlement: "Mom owes Louis R 100"
   Progress: Paid R 100 of R 100 ✅ SETTLED
   ```

---

## Key Features

✅ **Simple payment recording:** from, to, amount, date (no payment method tracking in Phase 1)

✅ **Automatic balance calculation:** Shows remaining balance automatically

✅ **Payment history:** Immutable record of all payments with dates

✅ **Settlement progress:** Visual indicator of how much has been paid

✅ **Partial payments:** Support multiple payments toward one settlement

✅ **ZAR formatting:** All amounts display as R X,XXX.XX

✅ **Real-time updates:** Settlement status updates immediately after payment recorded

✅ **Expandable/collapsible:** Payment history hidden by default, expandable on demand

---

## Error Handling

- **Invalid amount:** Show error "Amount must be greater than 0"
- **Amount exceeds balance:** Warn "This exceeds the remaining balance of R X" but allow (user might be over-paying)
- **Missing fields:** Disable "Record Payment" button until all fields filled
- **Firestore errors:** Show user-friendly error "Failed to record payment. Please try again."

---

## Testing Checklist

- [ ] Record first payment toward settlement
- [ ] Payment appears in history immediately
- [ ] Remaining balance updates correctly
- [ ] Record partial payment (less than full balance)
- [ ] Record multiple payments toward one settlement
- [ ] Settlement shows as "SETTLED" when fully paid
- [ ] All amounts format in ZAR (R X,XXX.XX)
- [ ] Payment history expandable/collapsible
- [ ] Form defaults auto-fill correctly
- [ ] Error validation works (amount, fields)
- [ ] Switch families and payments remain correct
- [ ] Page refresh persists payment history

---

## Success Criteria

1. Parents can record payments for settlements
2. Payment history is immutable and complete
3. Settlement status shows progress and completion
4. Remaining balance is always accurate
5. All displays use ZAR formatting
6. System ready for Phase 2 (recurring expenses)

---

## Phase 2 Considerations (Future)

Payment Tracking Phase 1 is scoped narrowly on purpose. Phase 2 will add:
- Recurring monthly/quarterly expenses
- Custom frequencies
- Loan/balance accounts
- Different split percentages per expense category

Phase 1 foundation supports Phase 2 without modification.

