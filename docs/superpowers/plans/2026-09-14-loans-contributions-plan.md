# Loans & Contributions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable parents to track recurring contributions (R500/month lunchbox) and one-time loans (R4,000 lawyer fees) that add to settlement calculations.

**Architecture:** Store adjustments (loans/contributions) in Firestore `adjustments` collection. Load them with settlement calculation. Display as separate section in settlement breakdown with add/edit/delete UI.

**Tech Stack:** Vanilla JavaScript, Firebase Firestore, HTML/CSS

---

## Task 1: Update Firestore Security Rules for Adjustments

**Files:**
- Modify: `firestore-rules.txt`

- [ ] **Step 1: Open firestore-rules.txt**

Locate the section with `families/{familyId}` rules (around line 45-60).

- [ ] **Step 2: Add adjustments collection rules**

After the `templates` collection block (after line 77), add:

```
match /adjustments/{adjustmentId} {
  allow read: if request.auth.uid != null;
  allow create, update, delete: if request.auth.uid != null;
}
```

- [ ] **Step 3: Verify structure**

Your firestore-rules.txt should now have:
- `expenses` rules
- `templates` rules  
- `adjustments` rules (NEW)

- [ ] **Step 4: Commit**

```bash
git add firestore-rules.txt
git commit -m "feat: add firestore rules for adjustments collection"
```

---

## Task 2: Add Adjustment Modal HTML to Settlement Section

**Files:**
- Modify: `index.html` (settlement section ~line 1600-1650)

- [ ] **Step 1: Find settlement section**

Search for `<!-- Settlement Summary -->` (around line 1600).

- [ ] **Step 2: Add adjustment button and section**

After the settlement status `</div>` and before `<!-- Recurring Expense Dashboard Summary -->`, add:

```html
                    <!-- Loans & Contributions Section -->
                    <div class="settlement-card" style="margin-top: 20px; background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="margin: 0;">⚖️ Loans & Contributions</h4>
                            <button class="btn btn-sm" onclick="showAddAdjustmentModal()" style="padding: 6px 12px; font-size: 0.85em;">+ Add</button>
                        </div>
                        <div id="adjustmentsList" style="margin-top: 10px;">
                            <!-- Adjustments rendered here -->
                        </div>
                        <div id="noAdjustmentsMessage" style="color: #666; font-size: 0.9em;">No loans or contributions added yet.</div>
                        <div id="adjustmentsTotal" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ffe0b2; font-weight: 600; color: #e65100;"></div>
                    </div>
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add loans and contributions UI section to settlement"
```

---

## Task 3: Add Adjustment Modal HTML

**Files:**
- Modify: `index.html` (after recurring expense modal ~line 2065)

- [ ] **Step 1: Find recurring expense modal**

Search for `</div> <!-- End Recurring Expense Modal -->` (around line 2065).

- [ ] **Step 2: Add adjustment modal HTML**

After that closing tag, add:

```html
    <!-- Add Adjustment Modal -->
    <div id="adjustmentModal" class="modal hidden">
        <div class="modal-content">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Add Loan or Contribution</h3>
                <button onclick="closeAdjustmentModal()" style="background: none; border: none; font-size: 1.5em; cursor: pointer;">&times;</button>
            </div>

            <div class="modal-body">
                <div class="form-group">
                    <label for="adjustmentName">Name</label>
                    <input type="text" id="adjustmentName" placeholder="e.g., Lunchbox contribution, Lawyer fees">
                </div>

                <div class="form-group">
                    <label for="adjustmentAmount">Amount (ZAR)</label>
                    <input type="number" id="adjustmentAmount" placeholder="0.00" step="0.01" min="0">
                </div>

                <div class="form-group">
                    <label>Type</label>
                    <div style="margin-top: 8px;">
                        <label style="display: block; margin-bottom: 8px;">
                            <input type="radio" name="adjustmentType" value="contribution" checked> Contribution
                        </label>
                        <label style="display: block;">
                            <input type="radio" name="adjustmentType" value="loan"> Loan
                        </label>
                    </div>
                </div>

                <div class="form-group" id="frequencyGroup">
                    <label>Frequency</label>
                    <div style="margin-top: 8px;">
                        <label style="display: block; margin-bottom: 8px;">
                            <input type="radio" name="adjustmentFrequency" value="monthly" checked> Monthly
                        </label>
                        <label style="display: block;">
                            <input type="radio" name="adjustmentFrequency" value="one-time"> One-time
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label for="adjustmentFrom">From (Who pays)</label>
                    <select id="adjustmentFrom">
                        <option value="">Select parent...</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="adjustmentTo">To (Who receives)</label>
                    <select id="adjustmentTo">
                        <option value="">Select parent...</option>
                    </select>
                </div>
            </div>

            <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <button class="btn btn-secondary" onclick="closeAdjustmentModal()">Cancel</button>
                <button class="btn" onclick="saveAdjustment()">Save</button>
            </div>
        </div>
    </div>
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add adjustment modal HTML"
```

---

## Task 4: Add Helper Functions for Adjustments

**Files:**
- Modify: `index.html` (after calculateRecurringSummary function ~line 4166)

- [ ] **Step 1: Find calculateRecurringSummary function**

Search for `function calculateRecurringSummary(expenses)` (around line 4144).

- [ ] **Step 2: Add helper functions after it**

After the `updateRecurringSummaryDisplay` function (around line 4166), add:

```javascript
        function validateAdjustment(formData) {
            if (!formData.name) return { valid: false, error: "Name required" };
            if (!formData.amount || formData.amount <= 0) return { valid: false, error: "Valid amount required" };
            if (!formData.from) return { valid: false, error: "From parent required" };
            if (!formData.to) return { valid: false, error: "To parent required" };
            if (formData.from === formData.to) return { valid: false, error: "From and To must be different" };
            return { valid: true };
        }

        async function loadAdjustments() {
            if (!currentFamily) return [];
            try {
                const snapshot = await db.collection('families').doc(currentFamily)
                    .collection('adjustments')
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Error loading adjustments:', error);
                return [];
            }
        }

        function calculateAdjustmentsTotals(adjustments, fromPerson, toPerson) {
            const filtered = adjustments.filter(a => a.from === fromPerson && a.to === toPerson);
            return filtered.reduce((sum, a) => sum + (a.amount || 0), 0);
        }
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add adjustment helper functions"
```

---

## Task 5: Implement Adjustment Modal Functions

**Files:**
- Modify: `index.html` (after loadRecurringTemplates ~line 4265)

- [ ] **Step 1: Find loadRecurringTemplates function**

Search for `async function loadRecurringTemplates()` (around line 4227).

- [ ] **Step 2: Add adjustment modal functions after it**

After the `deleteRecurringTemplate` function (around line 4290), add:

```javascript
        function showAddAdjustmentModal() {
            const modal = document.getElementById('adjustmentModal');
            modal.classList.remove('hidden');

            if (currentFamily) {
                const familyDoc = db.collection('families').doc(currentFamily);
                familyDoc.get().then(doc => {
                    const parents = doc.data().parents || [];
                    const fromSelect = document.getElementById('adjustmentFrom');
                    const toSelect = document.getElementById('adjustmentTo');

                    fromSelect.innerHTML = '<option value="">Select parent...</option>';
                    toSelect.innerHTML = '<option value="">Select parent...</option>';

                    parents.forEach(parent => {
                        if (parent.name) {
                            fromSelect.innerHTML += `<option value="${parent.name}">${parent.name}</option>`;
                            toSelect.innerHTML += `<option value="${parent.name}">${parent.name}</option>`;
                        }
                    });
                });
            }

            clearAdjustmentForm();
        }

        function closeAdjustmentModal() {
            document.getElementById('adjustmentModal').classList.add('hidden');
            clearAdjustmentForm();
        }

        function clearAdjustmentForm() {
            document.getElementById('adjustmentName').value = '';
            document.getElementById('adjustmentAmount').value = '';
            document.querySelector('input[name="adjustmentType"][value="contribution"]').checked = true;
            document.querySelector('input[name="adjustmentFrequency"][value="monthly"]').checked = true;
            document.getElementById('adjustmentFrom').value = '';
            document.getElementById('adjustmentTo').value = '';
            toggleFrequencyField();
        }

        function toggleFrequencyField() {
            const type = document.querySelector('input[name="adjustmentType"]:checked').value;
            const frequencyGroup = document.getElementById('frequencyGroup');
            frequencyGroup.style.display = type === 'contribution' ? 'block' : 'none';
        }

        document.addEventListener('DOMContentLoaded', function() {
            const typeRadios = document.querySelectorAll('input[name="adjustmentType"]');
            typeRadios.forEach(radio => {
                radio.addEventListener('change', toggleFrequencyField);
            });
        });

        async function saveAdjustment() {
            const formData = {
                name: document.getElementById('adjustmentName').value,
                amount: parseFloat(document.getElementById('adjustmentAmount').value),
                type: document.querySelector('input[name="adjustmentType"]:checked').value,
                frequency: document.querySelector('input[name="adjustmentFrequency"]:checked').value,
                from: document.getElementById('adjustmentFrom').value,
                to: document.getElementById('adjustmentTo').value
            };

            const validation = validateAdjustment(formData);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }

            try {
                await db.collection('families').doc(currentFamily)
                    .collection('adjustments')
                    .add({
                        ...formData,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                showNotification(`✅ ${formData.name} added`, 'success');
                closeAdjustmentModal();
                await loadExpenses();
            } catch (error) {
                showNotification(`❌ Error: ${error.message}`, 'error');
            }
        }

        async function deleteAdjustment(adjustmentId) {
            if (!confirm('Delete this adjustment?')) return;

            try {
                await db.collection('families').doc(currentFamily)
                    .collection('adjustments')
                    .doc(adjustmentId)
                    .delete();

                showNotification('✅ Adjustment deleted', 'success');
                await loadExpenses();
            } catch (error) {
                showNotification(`❌ Error: ${error.message}`, 'error');
            }
        }
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: implement adjustment modal functions"
```

---

## Task 6: Update Settlement Calculation to Include Adjustments

**Files:**
- Modify: `index.html` (in calculateSettlement function ~line 3844)

- [ ] **Step 1: Find calculateSettlement function**

Search for `async function calculateSettlement(familyId)` (around line 3844).

- [ ] **Step 2: Update return statement**

At the end of the function (around line 3894), change:

```javascript
                return { totalExpenses, fairShare, balances, settlement, totalPaid, payments: payments };
```

To:

```javascript
                const adjustments = await db.collection('families').doc(familyId).collection('adjustments').get();
                const adjustmentsList = adjustments.docs.map(doc => doc.data());

                return { totalExpenses, fairShare, balances, settlement, totalPaid, payments: payments, adjustments: adjustmentsList };
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: load adjustments in settlement calculation"
```

---

## Task 7: Update Settlement Display to Show Adjustments and Include in Total

**Files:**
- Modify: `index.html` (in loadExpenses function ~line 4051)

- [ ] **Step 1: Find settlement display code**

Search for `if (settlement.settlement)` (around line 4051).

- [ ] **Step 2: Calculate adjusted settlement**

In that block, before displaying settlementText, add:

```javascript
                    let adjustmentsTotal = 0;
                    if (settlement.adjustments && settlement.settlement) {
                        adjustmentsTotal = calculateAdjustmentsTotals(
                            settlement.adjustments,
                            settlement.settlement.from,
                            settlement.settlement.to
                        );
                    }

                    const totalOwed = settlement.settlement.amount + adjustmentsTotal;
```

- [ ] **Step 3: Update settlementText to show total with adjustments**

Change:

```javascript
                    const settlementText = `${settlement.settlement.from} owes ${settlement.settlement.to} ${formatZAR(settlement.settlement.amount)}`;
```

To:

```javascript
                    const settlementText = `${settlement.settlement.from} owes ${settlement.settlement.to} ${formatZAR(totalOwed)}`;
```

- [ ] **Step 4: Add adjustments display to breakdown**

In the breakdownHTML section, after the fair share line, add:

```javascript
                    if (adjustmentsTotal > 0) {
                        breakdownHTML += `<div style="margin: 6px 0; padding: 6px 0; border-top: 1px solid #e8e8e8; padding-left: 8px;">
                            <strong>Adjustments:</strong>
                        </div>`;
                        settlement.adjustments.forEach(adj => {
                            if (adj.from === settlement.settlement.from && adj.to === settlement.settlement.to) {
                                const freq = adj.frequency === 'monthly' ? '/month' : '';
                                breakdownHTML += `<div style="margin: 4px 0; padding-left: 16px; color: #555;">
                                    ${adj.name}${freq}: <strong>+${formatZAR(adj.amount)}</strong>
                                </div>`;
                            }
                        });
                        breakdownHTML += `<div style="margin: 4px 0; padding-left: 8px; color: #e65100; font-weight: 600;">
                            Adjustments subtotal: ${formatZAR(adjustmentsTotal)}
                        </div>`;
                    }
                    breakdownHTML += `<div style="margin: 6px 0; padding: 6px 0; border-top: 1px solid #e8e8e8; padding-left: 8px; font-weight: 600; color: #1b5e20;">
                        TOTAL OWED: ${formatZAR(totalOwed)}
                    </div>`;
```

- [ ] **Step 5: Populate adjustments list**

After the settlement display code, add:

```javascript
                // Load and display adjustments
                if (settlement.adjustments) {
                    const adjList = document.getElementById('adjustmentsList');
                    const noMsg = document.getElementById('noAdjustmentsMessage');
                    adjList.innerHTML = '';

                    if (settlement.adjustments.length === 0) {
                        noMsg.style.display = 'block';
                    } else {
                        noMsg.style.display = 'none';
                        settlement.adjustments.forEach(adj => {
                            const item = document.createElement('div');
                            item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #ffe0b2;';

                            const info = document.createElement('div');
                            const freq = adj.frequency === 'monthly' ? ' (monthly)' : ' (one-time)';
                            const name = document.createElement('div');
                            name.textContent = `${adj.name}${freq}`;
                            name.style.cssText = 'font-weight: 500; color: #333;';

                            const amount = document.createElement('div');
                            amount.textContent = `R${adj.amount.toFixed(2)}`;
                            amount.style.cssText = 'font-size: 0.9em; color: #666;';

                            info.appendChild(name);
                            info.appendChild(amount);

                            const btnContainer = document.createElement('div');
                            btnContainer.style.cssText = 'display: flex; gap: 6px;';

                            const deleteBtn = document.createElement('button');
                            deleteBtn.textContent = 'Delete';
                            deleteBtn.style.cssText = 'padding: 4px 8px; background: #d32f2f; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8em;';
                            deleteBtn.onclick = () => deleteAdjustment(adj.id);

                            btnContainer.appendChild(deleteBtn);
                            item.appendChild(info);
                            item.appendChild(btnContainer);
                            adjList.appendChild(item);
                        });

                        const total = calculateAdjustmentsTotals(settlement.adjustments, '', '');
                        const totalDiv = document.getElementById('adjustmentsTotal');
                        totalDiv.textContent = `Total adjustments: ${formatZAR(total)}`;
                    }
                }
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: display adjustments in settlement and include in total owed"
```

---

## Task 8: Integration Testing

**Files:**
- Test: Manual QA

- [ ] **Step 1: Reload app**

Open the deployed app in browser and log in.

- [ ] **Step 2: Test adding contribution**

1. Go to Expenses tab
2. Scroll to "Loans & Contributions" section
3. Click "+ Add" button
4. Fill form:
   - Name: "Lunchbox contribution"
   - Amount: 500
   - Type: Contribution
   - Frequency: Monthly
   - From: Louis Grobler
   - To: Cecilia
5. Click Save
6. Verify it appears in list

- [ ] **Step 3: Test adding loan**

1. Click "+ Add" button
2. Fill form:
   - Name: "Lawyer fees"
   - Amount: 4000
   - Type: Loan
   - From: Louis Grobler
   - To: Cecilia
3. Click Save
4. Verify it appears in list and frequency field is hidden

- [ ] **Step 4: Verify settlement calculation**

1. Check that "Louis owes Cecilia" now shows new total (R960 + R4,500 = R5,460)
2. Check breakdown shows adjustments section
3. Check "Total adjustments: R4,500"

- [ ] **Step 5: Test delete**

1. Click "Delete" on one adjustment
2. Confirm deletion
3. Verify total recalculates

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: loans and contributions feature complete and tested"
```

- [ ] **Step 7: Deploy**

```bash
firebase deploy --only hosting
git push origin main
```

---

## Acceptance Criteria

✅ Users can add recurring contributions (e.g., R500/month lunchbox)
✅ Users can add one-time loans (e.g., R4,000 lawyer fees)
✅ Adjustments display in settlement section
✅ Adjustments included in total owed calculation
✅ Settlement breakdown shows adjustment details
✅ Users can delete adjustments
✅ No console errors
✅ Firestore rules enforce access control
