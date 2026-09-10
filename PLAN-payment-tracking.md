# Payment Tracking Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement payment recording functionality so parents can track who paid whom, how much, and when—with automatic remaining balance calculation and immutable payment history.

**Architecture:** Add payment form, payment history display, and settlement progress UI to the Expenses tab. Payments are stored in Firestore subcollection (`families/{familyId}/payments/{paymentId}`). Settlement calculations fetch expenses + payments, compute fair share, and display progress. All amounts display in ZAR (R X,XXX.XX). Page refresh loads all data via `loadPayments()`.

**Tech Stack:** Firebase Firestore (payments subcollection), vanilla JavaScript, Firestore security rules

---

## File Structure

**Modified:**
- `index.html` — Add payment form HTML, payment history display, settlement progress, Firestore rules update, JavaScript functions

**No new files** (single-file app)

---

## Task 1: Update Firestore Security Rules for Payments

**Files:**
- Modify: `firebaseConfig.js` or console rules (wherever current rules are managed)

> This task updates security rules in Firestore console or wherever they are configured. If rules are in code (a separate rules file), update that instead.

- [ ] **Step 1: Read current Firestore rules**

Navigate to Firebase Console → Your Project → Firestore Database → Rules tab. Take note of current rules structure.

- [ ] **Step 2: Add payment collection rules**

Update rules to allow authenticated parents to read/create/update payments within a family. Append this to the family rules:

```javascript
match /families/{familyId}/payments/{paymentId} {
  allow read: if request.auth.uid != null;
  allow create: if request.auth.uid != null && 
                   request.resource.data.keys().hasAll(['from', 'to', 'amount', 'date']) &&
                   request.resource.data.amount > 0;
  allow update: if false;  // payments are immutable
  allow delete: if false;  // payments are immutable
}
```

- [ ] **Step 3: Publish rules**

Click "Publish" in Firebase Console to activate the new rules.

- [ ] **Step 4: Verify rules applied**

Go to Firestore → Data tab, and try to manually add a test payment document to `families/{testFamilyId}/payments/test1`. Verify it succeeds.

---

## Task 2: Add Payment Recording Form HTML and CSS

**Files:**
- Modify: `index.html` (around line 1100-1200 where Expenses tab form exists)

- [ ] **Step 1: Locate expenses form in HTML**

Search for `id="expenseForm"` in index.html. Note its location and structure.

- [ ] **Step 2: Add payment recording form HTML after expense form**

Add this HTML block right after the expense form (before the expense list section):

```html
<!-- Payment Recording Form (hidden by default) -->
<div id="paymentForm" class="expense-form" style="display: none; margin-top: 20px; padding: 15px; background: #f0f4ff; border-radius: 8px; border-left: 4px solid #667eea;">
    <h3 style="margin-bottom: 15px; color: #333;">Record Payment</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div>
            <label for="paymentFrom" style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">From (Payer):</label>
            <select id="paymentFrom" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em;">
                <option value="">Select parent</option>
            </select>
        </div>
        <div>
            <label for="paymentTo" style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">To (Recipient):</label>
            <select id="paymentTo" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em;">
                <option value="">Select parent</option>
            </select>
        </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div>
            <label for="paymentAmount" style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Amount (ZAR):</label>
            <input type="number" id="paymentAmount" step="0.01" min="0" placeholder="0.00" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em;">
        </div>
        <div>
            <label for="paymentDate" style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Date:</label>
            <input type="date" id="paymentDate" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em;">
        </div>
    </div>
    <div style="color: #d32f2f; font-size: 0.9em; margin-bottom: 15px;" id="paymentWarning" style="display: none;"></div>
    <div style="display: flex; gap: 10px;">
        <button id="recordPaymentBtn" onclick="recordPayment()" style="flex: 1; padding: 12px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 1em;">Record Payment</button>
        <button id="cancelPaymentBtn" onclick="hidePaymentForm()" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 1em;">Cancel</button>
    </div>
</div>
```

- [ ] **Step 3: Verify form placement**

The form should appear right after the expense form in the Expenses tab, with consistent styling.

---

## Task 3: Add Payment History Display HTML

**Files:**
- Modify: `index.html` (around line 1250-1350 where settlement summary exists)

- [ ] **Step 1: Locate settlement summary in HTML**

Search for `id="settlementSummary"` in index.html. Note its location.

- [ ] **Step 2: Add payment history HTML inside settlement box**

Find the settlement display section and add this HTML for payment history (add it inside the settlement box, after the settlement calculation text):

```html
<!-- Payment History (Expandable) -->
<div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 15px;">
    <div onclick="togglePaymentHistory(this)" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
        <span style="font-weight: 600; color: #333;">📋 Payment History</span>
        <span id="paymentHistoryToggle" style="color: #667eea; font-weight: bold;">▼</span>
    </div>
    <div id="paymentHistoryContent" style="display: none; margin-top: 10px; max-height: 300px; overflow-y: auto; border: 1px solid #f0f0f0; border-radius: 5px; padding: 10px;">
        <div id="paymentHistoryList" style="font-size: 0.95em;">
            <!-- Populated by JavaScript -->
        </div>
    </div>
</div>
```

- [ ] **Step 3: Verify placement**

The payment history section should be visually grouped with the settlement display, expandable on click.

---

## Task 4: Update Settlement Display to Show Progress

**Files:**
- Modify: `index.html` (around line 1300-1350, inside settlement box)

- [ ] **Step 1: Locate settlement calculation display**

Search for the text "Settlement" or "owes" in the HTML settlement section.

- [ ] **Step 2: Replace or enhance settlement text with progress**

Within the settlement display box, update or replace the settlement line to include progress. The settlement section should show:

```html
<!-- Settlement Status with Progress -->
<div id="settlementStatus" style="margin: 15px 0; padding: 15px; background: #fff9e6; border-radius: 5px; border-left: 4px solid #ffa726;">
    <!-- Template: will be populated by JavaScript -->
    <div id="settlementText" style="font-weight: 600; color: #333; margin-bottom: 10px;"><!-- e.g., "Mom owes Louis R 500.00" --></div>
    <div id="settlementProgress" style="margin-top: 10px;">
        <!-- Template: Progress bar and remaining balance -->
    </div>
    <button id="recordPaymentFormBtn" onclick="showPaymentForm()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; width: 100%;">Record Payment</button>
</div>
```

- [ ] **Step 3: Verify structure**

The settlement display should have three sections: settlement text, progress bar, and "Record Payment" button.

---

## Task 5: Add Helper Functions for Payment Tracking

**Files:**
- Modify: `index.html` (JavaScript section, around line 1700+)

- [ ] **Step 1: Add formatZAR helper (if not already exists)**

Add this function to format amounts as ZAR. Search for `formatZAR` first; if it doesn't exist, add it:

```javascript
function formatZAR(amount) {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}
```

- [ ] **Step 2: Add calculateSettlement function**

This function calculates who owes whom based on expenses and payments. Add it:

```javascript
async function calculateSettlement(familyId) {
    try {
        const expensesSnap = await db.collection('families').doc(familyId).collection('expenses').get();
        const paymentsSnap = await db.collection('families').doc(familyId).collection('payments').get();
        const familyDoc = await db.collection('families').doc(familyId).get();
        
        const expenses = expensesSnap.docs.map(doc => doc.data());
        const payments = paymentsSnap.docs.map(doc => doc.data());
        const parents = familyDoc.data().parents || [];
        
        if (expenses.length === 0 || parents.length === 0) {
            return { totalExpenses: 0, fairShare: 0, balances: {}, settlement: null, totalPaid: {} };
        }
        
        // Calculate total expenses and who paid what
        let totalExpenses = 0;
        let paidByParent = {};
        
        expenses.forEach(exp => {
            totalExpenses += exp.amount;
            paidByParent[exp.paidBy] = (paidByParent[exp.paidBy] || 0) + exp.amount;
        });
        
        // Calculate fair share per parent
        const fairShare = totalExpenses / parents.length;
        
        // Calculate balances (positive = owed money, negative = owes money)
        let balances = {};
        let totalPaid = {};
        
        parents.forEach(parent => {
            const paid = paidByParent[parent.name] || 0;
            totalPaid[parent.name] = paid;
            balances[parent.name] = paid - fairShare;
        });
        
        // Subtract payments from balances
        payments.forEach(payment => {
            balances[payment.from] = (balances[payment.from] || 0) - payment.amount;
            balances[payment.to] = (balances[payment.to] || 0) + payment.amount;
        });
        
        // Determine settlement (who owes whom)
        let settlement = null;
        for (const [name, balance] of Object.entries(balances)) {
            if (balance < 0) {
                // This parent owes money
                const owed = Math.abs(balance);
                for (const [creditor, creditorBalance] of Object.entries(balances)) {
                    if (creditor !== name && creditorBalance > 0) {
                        settlement = {
                            from: name,
                            to: creditor,
                            amount: Math.min(owed, creditorBalance)
                        };
                        break;
                    }
                }
                break;
            }
        }
        
        return { 
            totalExpenses, 
            fairShare, 
            balances, 
            settlement, 
            totalPaid,
            payments: payments
        };
    } catch (error) {
        console.error('Error calculating settlement:', error);
        return { totalExpenses: 0, fairShare: 0, balances: {}, settlement: null, totalPaid: {}, payments: [] };
    }
}
```

- [ ] **Step 3: Add calculateRemainingBalance function**

This calculates how much is still outstanding for a settlement:

```javascript
async function calculateRemainingBalance(familyId, settlement) {
    if (!settlement) return 0;
    
    const paymentsSnap = await db.collection('families').doc(familyId)
        .collection('payments')
        .where('from', '==', settlement.from)
        .where('to', '==', settlement.to)
        .get();
    
    const payments = paymentsSnap.docs.map(doc => doc.data());
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    return Math.max(0, settlement.amount - totalPaid);
}
```

- [ ] **Step 4: Verify functions are syntactically correct**

Check for missing braces, semicolons, and proper JSON/object syntax.

---

## Task 6: Implement recordPayment Function

**Files:**
- Modify: `index.html` (JavaScript section, around line 1800+)

- [ ] **Step 1: Add recordPayment function**

```javascript
async function recordPayment() {
    const from = document.getElementById('paymentFrom').value;
    const to = document.getElementById('paymentTo').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    
    // Validation
    if (!from || !to) {
        alert('Please select both payer and recipient');
        return;
    }
    if (from === to) {
        alert('Payer and recipient must be different');
        return;
    }
    if (!amount || amount <= 0) {
        alert('Amount must be greater than 0');
        return;
    }
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    try {
        const currentFamily = document.getElementById('familySelect').value;
        
        // Save payment to Firestore
        await db.collection('families').doc(currentFamily).collection('payments').add({
            from: from,
            to: to,
            amount: amount,
            date: date,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Clear form and reload display
        hidePaymentForm();
        clearPaymentForm();
        loadExpenses();  // This will refresh settlement display
        
        // Show success message
        showNotification('Payment recorded successfully', 'success');
    } catch (error) {
        console.error('Error recording payment:', error);
        showNotification('Failed to record payment: ' + error.message, 'error');
    }
}
```

- [ ] **Step 2: Add supporting UI functions**

```javascript
function showPaymentForm() {
    document.getElementById('paymentForm').style.display = 'block';
}

function hidePaymentForm() {
    document.getElementById('paymentForm').style.display = 'none';
}

function clearPaymentForm() {
    document.getElementById('paymentFrom').value = '';
    document.getElementById('paymentTo').value = '';
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentWarning').style.display = 'none';
}
```

- [ ] **Step 3: Add validation warning for amounts exceeding balance**

Add this function to warn when payment exceeds remaining balance:

```javascript
async function validatePaymentAmount() {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const currentFamily = document.getElementById('familySelect').value;
    
    if (!amount || amount <= 0) return;
    
    const settlement = await calculateSettlement(currentFamily);
    if (settlement.settlement) {
        const remaining = await calculateRemainingBalance(currentFamily, settlement.settlement);
        
        if (amount > remaining) {
            document.getElementById('paymentWarning').textContent = 
                `⚠️ This exceeds remaining balance of ${formatZAR(remaining)}. This will be recorded anyway.`;
            document.getElementById('paymentWarning').style.display = 'block';
        } else {
            document.getElementById('paymentWarning').style.display = 'none';
        }
    }
}

// Add onchange listeners to payment amount input
document.getElementById('paymentAmount').addEventListener('change', validatePaymentAmount);
```

- [ ] **Step 4: Verify functions**

Check that all functions are properly closed and use correct Firestore API calls.

---

## Task 7: Implement loadPayments and Payment History Display

**Files:**
- Modify: `index.html` (JavaScript section, around line 1850+)

- [ ] **Step 1: Add loadPayments function**

This is called whenever expenses are loaded to refresh payment history:

```javascript
async function loadPayments(familyId) {
    try {
        const paymentsSnap = await db.collection('families').doc(familyId)
            .collection('payments')
            .orderBy('date', 'desc')
            .get();
        
        const payments = paymentsSnap.docs.map(doc => doc.data());
        return payments;
    } catch (error) {
        console.error('Error loading payments:', error);
        return [];
    }
}
```

- [ ] **Step 2: Add displayPaymentHistory function**

```javascript
async function displayPaymentHistory(familyId) {
    const payments = await loadPayments(familyId);
    const historyList = document.getElementById('paymentHistoryList');
    
    if (payments.length === 0) {
        historyList.innerHTML = '<div style="color: #999; text-align: center; padding: 10px;">No payments recorded yet</div>';
        return;
    }
    
    let html = '';
    payments.forEach(payment => {
        html += `
            <div style="padding: 8px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between;">
                <span>
                    <strong>${payment.from}</strong> → <strong>${payment.to}</strong>
                </span>
                <span style="text-align: right;">
                    <div style="color: #667eea; font-weight: 600;">${formatZAR(payment.amount)}</div>
                    <div style="font-size: 0.85em; color: #999;">${payment.date}</div>
                </span>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
}
```

- [ ] **Step 3: Add toggle function for payment history**

```javascript
function togglePaymentHistory(element) {
    const content = document.getElementById('paymentHistoryContent');
    const toggle = document.getElementById('paymentHistoryToggle');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▼';
    }
}
```

- [ ] **Step 4: Verify functions**

All functions should be syntactically correct with proper async/await patterns.

---

## Task 8: Update loadExpenses to Show Settlement Progress

**Files:**
- Modify: `index.html` (locate existing `loadExpenses()` function, around line 1600-1700)

- [ ] **Step 1: Locate loadExpenses function**

Search for `async function loadExpenses()` in the JavaScript section.

- [ ] **Step 2: Add settlement progress display to loadExpenses**

Within `loadExpenses()`, after expenses are loaded, add this code to display settlement and progress:

```javascript
// In loadExpenses, after loading expenses and before displaying expense list:

const settlement = await calculateSettlement(currentFamily);

if (settlement.settlement) {
    const remaining = await calculateRemainingBalance(currentFamily, settlement.settlement);
    const totalPaid = settlement.settlement.amount - remaining;
    const progressPercent = (totalPaid / settlement.settlement.amount) * 100;
    
    const settlementText = `${settlement.settlement.from} owes ${settlement.settlement.to} ${formatZAR(settlement.settlement.amount)}`;
    document.getElementById('settlementText').innerHTML = settlementText;
    
    // Progress bar
    const statusClass = remaining <= 0 ? 'settled' : 'pending';
    const statusEmoji = remaining <= 0 ? '✅' : '⏳';
    
    document.getElementById('settlementProgress').innerHTML = `
        <div style="margin-bottom: 10px; font-size: 0.95em;">
            <strong>${statusEmoji} Progress:</strong> Paid ${formatZAR(totalPaid)} of ${formatZAR(settlement.settlement.amount)} 
            ${remaining <= 0 ? '(SETTLED)' : `(${Math.round(progressPercent)}%)`}
        </div>
        <div style="width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; background: ${remaining <= 0 ? '#4caf50' : '#667eea'}; width: ${Math.min(progressPercent, 100)}%; transition: width 0.3s;"></div>
        </div>
        <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
            Remaining: <strong>${formatZAR(remaining)}</strong>
        </div>
    `;
} else {
    document.getElementById('settlementStatus').innerHTML = `
        <div style="color: #4caf50; font-weight: 600;">✅ All settlements balanced!</div>
    `;
}

// Load and display payment history
await displayPaymentHistory(currentFamily);

// Populate parent dropdowns in payment form
const parents = settlement.settlement ? 
    [settlement.settlement.from, settlement.settlement.to] : 
    (familyDoc.data().parents || []).map(p => p.name);

const fromSelect = document.getElementById('paymentFrom');
const toSelect = document.getElementById('paymentTo');
fromSelect.innerHTML = '<option value="">Select parent</option>';
toSelect.innerHTML = '<option value="">Select parent</option>';

parents.forEach(parent => {
    if (typeof parent === 'string') {
        fromSelect.innerHTML += `<option value="${parent}">${parent}</option>`;
        toSelect.innerHTML += `<option value="${parent}">${parent}</option>`;
    }
});

// Pre-fill payment form if there's an active settlement
if (settlement.settlement) {
    document.getElementById('paymentFrom').value = settlement.settlement.from;
    document.getElementById('paymentTo').value = settlement.settlement.to;
    document.getElementById('paymentAmount').value = await calculateRemainingBalance(currentFamily, settlement.settlement);
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
}
```

- [ ] **Step 3: Verify integration**

Check that the settlement progress code is placed within `loadExpenses()` and doesn't break existing logic.

---

## Task 9: Initialize Payment Form on Tab Load

**Files:**
- Modify: `index.html` (locate `switchTab()` function, around line 1400)

- [ ] **Step 1: Find switchTab function**

Search for `function switchTab(tabName)` in the JavaScript section.

- [ ] **Step 2: Add payment form initialization**

When the Expenses tab is switched to, initialize the payment date picker to today:

```javascript
// In switchTab function, add this when tabName === 'Expenses':
if (tabName === 'Expenses') {
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    // ... existing code ...
}
```

- [ ] **Step 3: Verify initialization**

Confirm that when you switch to the Expenses tab, the payment date defaults to today.

---

## Task 10: End-to-End Testing

**No files to modify** — this task is manual testing.

- [ ] **Step 1: Test basic payment recording**

1. Log in and open an existing family with expenses
2. In Expenses tab, click "Record Payment" button
3. Select payer and recipient, enter amount (less than remaining balance), click "Record Payment"
4. Verify: Payment appears in Payment History, settlement progress updates, remaining balance decreases

- [ ] **Step 2: Test multiple partial payments**

1. Record a second payment toward the same settlement
2. Verify: Both payments appear in history, progress bar fills further, remaining balance updates
3. Verify: Settlement shows "SETTLED" ✅ when fully paid

- [ ] **Step 3: Test form validation**

1. Try to record payment with amount 0 → expect error
2. Try to record payment with amount > remaining → expect warning but allow
3. Try to record payment with same payer/recipient → expect error
4. Try to submit with empty fields → expect button disabled or error

- [ ] **Step 4: Test payment history toggle**

1. Click "Payment History" to collapse/expand
2. Verify history scrolls if many payments exist
3. Verify dates are formatted correctly

- [ ] **Step 5: Test ZAR formatting**

1. Record payments with various amounts (e.g., 50, 100.50, 1234.56, 10000)
2. Verify all display as R X,XXX.XX format
3. Verify progress bar percentage is accurate

- [ ] **Step 6: Test page refresh**

1. Record a payment
2. Refresh the page
3. Verify payment history persists and settlement status updates correctly

- [ ] **Step 7: Test across families**

1. Switch to a different family
2. Verify payment history is family-specific and doesn't cross over
3. Record a payment in the second family and verify it's isolated

- [ ] **Step 8: Test Firestore persistence**

1. Open Firestore console
2. Navigate to `families/{familyId}/payments`
3. Verify payment documents exist with correct `from`, `to`, `amount`, `date` fields
4. Verify `createdAt` timestamp is present

---

## Spec Coverage Checklist

✅ **User can record payment** — Tasks 6, 8  
✅ **Payment history displays** — Tasks 3, 7  
✅ **Remaining balance calculates** — Tasks 5, 7  
✅ **Settlement shows progress** — Tasks 8, 10  
✅ **Partial payments supported** — Tasks 5, 6  
✅ **ZAR formatting** — Tasks 5, 8, 10  
✅ **Form validation** — Tasks 6, 10  
✅ **Firestore integration** — Tasks 1, 6, 7  
✅ **Immutable payments** — Task 1 (rules prevent delete/update)  
✅ **Payment history expandable** — Tasks 3, 7  

---

## Self-Review

**1. Spec coverage:** All 8 user stories and key features from design doc are covered.

**2. Placeholder scan:** No "TBD", "TODO", or vague steps. All functions have complete code.

**3. Type consistency:** Function names match across tasks (e.g., `calculateSettlement`, `calculateRemainingBalance`, `formatZAR`). Firestore field names consistent (`from`, `to`, `amount`, `date`).

---

Plan complete and saved to `PLAN-payment-tracking.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach would you prefer?
