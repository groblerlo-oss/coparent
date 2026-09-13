# Recurring Expenses Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to execute this plan task-by-task.

**Goal:** Enable parents to create recurring monthly expenses with auto-generation and "Paid By" tracking.

**Architecture:** Recurring templates stored in Firestore, auto-generate individual expense records monthly for full history and settlement tracking.

**Tech Stack:** Vanilla JavaScript, Firebase Firestore, HTML/CSS

---

## Task 1: Add Recurring Expense Button & Modal HTML

**Files:**
- Modify: `index.html` (Expenses tab section)

- [ ] **Step 1: Add button to Expenses tab**

After the "+ Add Expense" button, add:
```html
<button class="btn btn-info" onclick="showRecurringExpenseModal()" style="max-width: 300px; margin: 20px 0;">
  📅 Add Recurring Expense
</button>
```

- [ ] **Step 2: Add recurring expense modal HTML**

After the expense modal, add:
```html
<div id="recurringExpenseModal" class="modal hidden">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Add Recurring Expense</h3>
      <button onclick="closeRecurringExpenseModal()" style="background: none; border: none; font-size: 1.5em; cursor: pointer;">×</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Description (e.g., School Fees)</label>
        <input type="text" id="recurringDescription" placeholder="School Fees, Medical Aid, etc.">
      </div>
      
      <div class="form-group">
        <label>Amount (R)</label>
        <input type="number" id="recurringAmount" placeholder="1335" min="0" step="0.01">
      </div>
      
      <div class="form-group">
        <label>Category</label>
        <select id="recurringCategory">
          <option value="school">School</option>
          <option value="medical">Medical</option>
          <option value="activity">Activity</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Paid By</label>
        <div style="margin-top: 10px;">
          <label style="display: block; margin-bottom: 8px;">
            <input type="radio" name="recurringPaidBy" value="mom"> Mom
          </label>
          <label style="display: block; margin-bottom: 8px;">
            <input type="radio" name="recurringPaidBy" value="dad"> Dad
          </label>
          <label style="display: block;">
            <input type="radio" name="recurringPaidBy" value="shared" checked> Shared (50/50)
          </label>
        </div>
      </div>
      
      <div class="form-group">
        <label>Start Date</label>
        <input type="date" id="recurringStartDate">
      </div>
      
      <div class="form-group">
        <label>End Date (optional, leave blank for ongoing)</label>
        <input type="date" id="recurringEndDate">
      </div>
      
      <div class="form-group">
        <label>Frequency</label>
        <div style="margin-top: 10px;">
          <label style="display: block; margin-bottom: 8px;">
            <input type="radio" name="recurringFrequency" value="weekly"> Weekly
          </label>
          <label style="display: block; margin-bottom: 8px;">
            <input type="radio" name="recurringFrequency" value="biweekly"> Bi-weekly
          </label>
          <label style="display: block;">
            <input type="radio" name="recurringFrequency" value="monthly" checked> Monthly
          </label>
        </div>
      </div>
    </div>
    <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; padding: 15px; border-top: 1px solid #ddd;">
      <button class="btn btn-secondary" onclick="closeRecurringExpenseModal()">Cancel</button>
      <button class="btn btn-success" onclick="saveRecurringExpense()">Create Recurring</button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Test modal opens/closes**

Run: Open browser, click "Add Recurring Expense" button, verify modal appears and closes correctly.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add recurring expense button and modal HTML"
```

---

## Task 2: Add Recurring Expense Helper Functions

**Files:**
- Modify: `index.html` (script section)

- [ ] **Step 1: Add date generation helper**

```javascript
function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function getMonthKey(date) {
  // Returns "2026-09" format for grouping by month
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseISODate(dateStr) {
  // Parse YYYY-MM-DD and return Date object
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
```

- [ ] **Step 2: Add recurring expense generation helper**

```javascript
function generateRecurringExpenses(template) {
  // Generates expenses for current + next 3 months
  const expenses = [];
  const startDate = parseISODate(template.startDate);
  const endDate = template.endDate ? parseISODate(template.endDate) : null;
  
  // Determine interval
  const intervalMap = { weekly: 7, biweekly: 14, monthly: 30 };
  const interval = intervalMap[template.frequency] || 30;
  
  let currentDate = new Date(startDate);
  const maxEndDate = new Date();
  maxEndDate.setMonth(maxEndDate.getMonth() + 3);
  
  while (currentDate <= maxEndDate) {
    if (endDate && currentDate > endDate) break;
    
    expenses.push({
      description: template.description,
      date: formatDateToISO(currentDate),
      amount: template.amount,
      category: template.category,
      paidBy: template.paidBy,
      isRecurring: true,
      templateId: template.id,
      generatedMonth: getMonthKey(currentDate),
      createdBy: auth.currentUser.uid,
      createdByName: currentUserName,
      createdAt: new Date(),
      isArchived: false,
      paid: false
    });
    
    currentDate.setDate(currentDate.getDate() + interval);
  }
  
  return expenses;
}

function validateRecurringExpense(formData) {
  if (!formData.description) return { valid: false, error: "Description required" };
  if (!formData.amount || formData.amount <= 0) return { valid: false, error: "Valid amount required" };
  if (!formData.startDate) return { valid: false, error: "Start date required" };
  if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
    return { valid: false, error: "End date must be after start date" };
  }
  return { valid: true };
}
```

- [ ] **Step 3: Test functions**

Browser console:
```javascript
const test = {
  description: "School Fees",
  amount: 1335,
  category: "school",
  paidBy: "mom",
  startDate: "2026-09-01",
  endDate: null,
  frequency: "monthly",
  id: "test-123"
};
const generated = generateRecurringExpenses(test);
console.log("Generated:", generated); // Should show 3-4 expenses
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add recurring expense helper functions"
```

---

## Task 3: Implement Recurring Expense Modal Functions

**Files:**
- Modify: `index.html` (script section)

- [ ] **Step 1: Add modal show/close functions**

```javascript
function showRecurringExpenseModal() {
  document.getElementById('recurringExpenseModal').classList.remove('hidden');
  document.getElementById('recurringStartDate').valueAsDate = new Date();
}

function closeRecurringExpenseModal() {
  document.getElementById('recurringExpenseModal').classList.add('hidden');
  clearRecurringExpenseForm();
}

function clearRecurringExpenseForm() {
  document.getElementById('recurringDescription').value = '';
  document.getElementById('recurringAmount').value = '';
  document.getElementById('recurringCategory').value = 'school';
  document.getElementById('recurringStartDate').value = '';
  document.getElementById('recurringEndDate').value = '';
  document.querySelector('input[name="recurringPaidBy"][value="shared"]').checked = true;
  document.querySelector('input[name="recurringFrequency"][value="monthly"]').checked = true;
}
```

- [ ] **Step 2: Add save recurring expense function**

```javascript
async function saveRecurringExpense() {
  const formData = {
    description: document.getElementById('recurringDescription').value,
    amount: parseFloat(document.getElementById('recurringAmount').value),
    category: document.getElementById('recurringCategory').value,
    paidBy: document.querySelector('input[name="recurringPaidBy"]:checked').value,
    startDate: document.getElementById('recurringStartDate').value,
    endDate: document.getElementById('recurringEndDate').value || null,
    frequency: document.querySelector('input[name="recurringFrequency"]:checked').value
  };
  
  const validation = validateRecurringExpense(formData);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }
  
  try {
    const templateId = `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expenses = generateRecurringExpenses({ ...formData, id: templateId });
    
    // Save template
    const templateRef = db.collection('families').doc(familyId).collection('templates').doc(templateId);
    await templateRef.set({
      ...formData,
      templateId: templateId,
      createdBy: auth.currentUser.uid,
      createdByName: currentUserName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      active: true
    });
    
    // Save generated expenses with batch write
    const batch = db.batch();
    const expensesCollection = db.collection('families').doc(familyId).collection('expenses');
    
    expenses.forEach(expense => {
      const docRef = expensesCollection.doc();
      batch.set(docRef, expense);
    });
    
    await batch.commit();
    
    showNotification(`✅ Recurring expense created: ${formData.description} (${formData.frequency})`);
    closeRecurringExpenseModal();
    await loadExpenses();
    
  } catch (error) {
    console.error('Error creating recurring expense:', error);
    showNotification(`❌ Error: ${error.message}`, 'error');
  }
}
```

- [ ] **Step 3: Test modal functions**

Browser: Create a test recurring expense, verify it creates and loads.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: implement recurring expense modal functions"
```

---

## Task 4: Add Recurring Summary to Dashboard

**Files:**
- Modify: `index.html` (dashboard section)

- [ ] **Step 1: Calculate recurring totals**

```javascript
function calculateRecurringSummary(expenses) {
  const recurring = expenses.filter(e => e.isRecurring);
  
  const summary = {
    momTotal: 0,
    dadTotal: 0,
    sharedTotal: 0
  };
  
  recurring.forEach(exp => {
    if (exp.paidBy === 'mom') summary.momTotal += exp.amount;
    else if (exp.paidBy === 'dad') summary.dadTotal += exp.amount;
    else if (exp.paidBy === 'shared') summary.sharedTotal += exp.amount;
  });
  
  return summary;
}
```

- [ ] **Step 2: Display recurring summary card**

Find settlement display section, add after settlement progress:
```html
<div class="settlement-card" style="margin-top: 20px; background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 4px;">
  <h4 style="margin-top: 0;">📊 Monthly Recurring Expenses</h4>
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px;">
    <div>
      <div style="font-size: 0.85em; color: #666;">Mom's Recurring</div>
      <div style="font-size: 1.5em; font-weight: 600; color: #d32f2f;" id="momRecurring">R0</div>
    </div>
    <div>
      <div style="font-size: 0.85em; color: #666;">Dad's Recurring</div>
      <div style="font-size: 1.5em; font-weight: 600; color: #1976d2;" id="dadRecurring">R0</div>
    </div>
    <div>
      <div style="font-size: 0.85em; color: #666;">Shared Recurring</div>
      <div style="font-size: 1.5em; font-weight: 600; color: #7b1fa2;" id="sharedRecurring">R0</div>
    </div>
  </div>
  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #c8e6c9;">
    <div style="font-size: 0.9em;">Total Monthly: <span style="font-weight: 600; color: #1b5e20;" id="totalRecurring">R0</span></div>
  </div>
</div>
```

- [ ] **Step 3: Update recurring summary on load**

In loadExpenses() or updateSettlement(), after calculating recurring:
```javascript
const recurring = calculateRecurringSummary(expenses);
document.getElementById('momRecurring').textContent = `R${recurring.momTotal.toFixed(2)}`;
document.getElementById('dadRecurring').textContent = `R${recurring.dadTotal.toFixed(2)}`;
document.getElementById('sharedRecurring').textContent = `R${recurring.sharedTotal.toFixed(2)}`;
document.getElementById('totalRecurring').textContent = `R${(recurring.momTotal + recurring.dadTotal + recurring.sharedTotal).toFixed(2)}`;
```

- [ ] **Step 4: Test dashboard**

Browser: Create recurring expense, verify summary updates.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add recurring expense summary to dashboard"
```

---

## Task 5: Update Firestore Security Rules

**Files:**
- Modify: `firestore-rules.txt`

- [ ] **Step 1: Add templates collection rules**

In families/{familyId} section, add:
```
match /templates/{templateId} {
  allow read: if request.auth.uid != null;
  allow create, update: if request.auth.uid != null;
  allow delete: if request.auth.uid == resource.data.createdBy;
}
```

- [ ] **Step 2: Test rules**

Firestore console: Verify template can be created and read.

- [ ] **Step 3: Commit**

```bash
git add firestore-rules.txt
git commit -m "fix: add firestore rules for recurring expense templates"
```

---

## Task 6: Integration Testing & Polish

**Files:**
- Test: Manual QA

- [ ] **Step 1: Test recurring creation**

- Create recurring: School Fees, R1335, Monthly, Mom, Sept 1
- Verify 3 expenses generated in Sept, Oct, Nov
- Verify each shows `isRecurring: true`, `templateId`

- [ ] **Step 2: Test dashboard summary**

- Verify "Mom's Recurring: R1335"
- Create Dad's recurring (R3000 shared), verify total updates

- [ ] **Step 3: Test end date**

- Create with end date Dec 31
- Verify generation stops after that month

- [ ] **Step 4: Test Paid By field**

- Create Mom, Dad, and Shared
- Verify settlement calculations include recurring

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: recurring expenses feature complete and tested"
```

---

## Acceptance Criteria

✅ User can create recurring expenses in 3 clicks
✅ System auto-generates 3+ months of expenses
✅ Dashboard shows recurring totals by person
✅ Shared expenses split 50/50
✅ Full expense history preserved
✅ "Paid By" field tracked correctly
✅ Firestore rules enforce access control
✅ No console errors
