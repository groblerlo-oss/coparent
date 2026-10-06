# Payment System Refactor Plan

## Changes Needed

### 1. Monthly Lunchbox Tracking
- Change from single "R500/month" adjustment to monthly entries
- Each month gets its own R500 lunchbox entry in adjustments
- Add `month` and `paid` fields to contribution entries
- Auto-generate entries for current month if missing

### 2. Settlement Calculation
- **Base expenses:** sum split expenses for the month
- **One-time loans:** sum all unpaid one-time loans
- **Monthly contributions:** sum unpaid lunchbox entries for current month only
- **Credits:** track overpayments from previous months
- **Total owed:** (Base + Loans + Current Month Lunchbox) - Credit
- **Settlement direction:** if total < 0, flip (other person owes you)

### 3. Smart Payment Allocation
- Payment goes to: Base → One-time loans → Monthly contributions
- Track which component each payment applies to
- Calculate overpayment as credit for next month

### 4. Display Updates
- Show monthly lunchbox entries separately
- Show each month's entry with paid/unpaid status
- Show credit/overpayment clearly
- Show settlement flipped if applicable

## Files to Update
- index.html: calculateSettlement(), payment logic, display functions
- Firestore schema: add month/paid fields to adjustments

## Key Functions
- calculateSettlement() - main calculation
- allocatePayment() - NEW - smart allocation
- getMonthlyLunchbox() - get/create monthly entries
- getCreditsFromPreviousMonth() - track overpayments
