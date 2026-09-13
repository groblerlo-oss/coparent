# Expense Splits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. Each task is self-contained and produces working, testable code. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable parents to configure expense splits during family setup and track expenses with automatic settlement calculations in ZAR.

**Architecture:** Extend the single-page HTML app with:
1. Multi-step family setup wizard (3 steps instead of 1)
2. Parent split configuration during setup
3. Expenses tab with form, list, and settlement calculations
4. Settings to reconfigure splits anytime
5. Firestore security rules to restrict expense access to parents only

**Tech Stack:** Firebase Firestore, vanilla JavaScript, HTML/CSS

---

## File Structure

**Single file modified:** `index.html`

**Sections:**
- HTML: Add `#familySetupStep2`, `#familySetupStep3` forms; expand `#expenses` tab; add parent config section to `#settings`
- CSS: Style parent split inputs, expense form, settlement display
- JavaScript: New functions for multi-step wizard, parent config, expense CRUD, settlement math

---

## Task Breakdown

### Task 1: Add Step 2 Form (Configure Parents) HTML

**Files:**
- Modify: `index.html` (lines 561-578, add new form after familySetupScreen)

**Steps:**

- [ ] **Step 1a: Add Step 2 HTML structure after the familySetupScreen div**

Find the line:
```html
<!-- Main App -->
<div class="container hidden" id="mainApp">
```

Insert this BEFORE that line (after line 578):

```html
    <!-- Family Setup Step 2: Configure Parents -->
    <div class="hidden" id="familySetupStep2" style="display: none;">
        <div class="container" style="max-width: 500px; margin: 50px auto;">
            <div class="header">
                <h1>Configure Parents & Splits</h1>
                <p>Set up expense split percentages</p>
            </div>
            <div style="padding: 40px;">
                <p style="color: #666; margin-bottom: 20px;">Define how expenses will be split. Percentages must total 100%.</p>
                
                <div id="parentsContainer">
                    <!-- Parent entries added here dynamically -->
                </div>

                <button class="btn btn-secondary" onclick="addParentInput()" style="width: 100%; margin: 20px 0;">+ Add Parent</button>
                
                <div id="splitErrorMessage" class="error-message" style="text-align: center; margin: 15px 0; display: none;"></div>
                
                <button class="btn" onclick="goToStep3()">Next: Review</button>
                <button class="btn btn-secondary" onclick="goBackToStep1()">Back</button>
            </div>
        </div>
    </div>

    <!-- Family Setup Step 3: Review & Create -->
    <div class="hidden" id="familySetupStep3" style="display: none;">
        <div class="container" style="max-width: 500px; margin: 50px auto;">
            <div class="header">
                <h1>Review & Create Family</h1>
                <p>Confirm everything looks good</p>
            </div>
            <div style="padding: 40px;">
                <div class="info-box">
                    <p><strong>Family Name:</strong> <span id="reviewFamilyName"></span></p>
                    <p><strong>Children:</strong> <span id="reviewChildren"></span></p>
                    <p><strong>Parents & Splits:</strong></p>
                    <div id="reviewParents" style="margin-left: 15px;"></div>
                </div>
                
                <button class="btn" onclick="createFamilyFinal()">Create Family</button>
                <button class="btn btn-secondary" onclick="goBackToStep2()">Back</button>
            </div>
        </div>
    </div>
```

- [ ] **Step 1b: Verify the new divs are inserted correctly**

Check that:
- Both `familySetupStep2` and `familySetupStep3` divs are hidden by default (`class="hidden"`)
- They appear BEFORE `<div class="container hidden" id="mainApp">`
- No syntax errors (matching tags, quotes)

- [ ] **Step 1c: Commit**

```bash
git add index.html
git commit -m "feat: add family setup step 2 and step 3 HTML structure"
```

---

### Task 2: Add Step 2 CSS Styling

**Files:**
- Modify: `index.html` (lines 13-480, add CSS)

**Steps:**

- [ ] **Step 2a: Add CSS for parent split inputs**

Find the closing `</style>` tag (around line 480). Insert this CSS before it:

```css
        .parent-input-group {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            display: flex;
            gap: 10px;
            align-items: flex-end;
        }

        .parent-input-group input {
            flex: 1;
        }

        .parent-input-group input:nth-child(2) {
            flex: 0 0 80px;
        }

        .parent-remove-btn {
            padding: 10px 15px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9em;
            transition: background 0.3s;
        }

        .parent-remove-btn:hover {
            background: #c82333;
        }

        .expense-form {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }

        .settlement-box {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }

        .settlement-box h4 {
            color: #1565c0;
            margin-bottom: 10px;
        }

        .settlement-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
        }

        .settlement-item {
            background: white;
            padding: 10px;
            border-radius: 4px;
            font-size: 0.9em;
        }

        .settlement-item strong {
            color: #667eea;
        }

        .settlement-owed {
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
            font-weight: 600;
            color: #856404;
        }
```

- [ ] **Step 2b: Verify CSS syntax**

Check that all brackets and semicolons are correct, no syntax errors.

- [ ] **Step 2c: Commit**

```bash
git add index.html
git commit -m "feat: add CSS styling for parent splits and expense tracking"
```

---

### Task 3: Implement Wizard Navigation Functions

**Files:**
- Modify: `index.html` (lines 735-1419, add JavaScript functions after the Firebase init)

**Steps:**

- [ ] **Step 3a: Add wizard state tracking and navigation functions**

Find the line `let userRole = null;` (around line 754). Add this code right after it:

```javascript
        // Family setup wizard state
        let wizardState = {
            familyName: '',
            childrenNames: [],
            parents: []  // [{name: 'Louis', split: 50}, {name: 'Cecilia', split: 50}]
        };

        function goToStep2() {
            const familyName = document.getElementById('familyName').value.trim();
            const childrenText = document.getElementById('childrenNames').value.trim();

            if (!familyName) {
                showNotification('Please enter a family name', 'error');
                return;
            }

            const children = childrenText.split('\n').filter(name => name.trim()).map(name => name.trim());
            if (children.length === 0) {
                showNotification('Please enter at least one child\'s name', 'error');
                return;
            }

            wizardState.familyName = familyName;
            wizardState.childrenNames = children;

            // Initialize parents with creator's name
            if (wizardState.parents.length === 0) {
                wizardState.parents.push({name: currentUser.displayName || 'Parent 1', split: 50});
                wizardState.parents.push({name: 'Parent 2', split: 50});
            }

            renderParentInputs();
            document.getElementById('familySetupScreen').classList.add('hidden');
            document.getElementById('familySetupStep2').classList.remove('hidden');
        }

        function goToStep3() {
            // Validate parent splits
            const parents = [];
            const parentInputs = document.querySelectorAll('.parent-input-group');

            let totalSplit = 0;
            let hasError = false;

            parentInputs.forEach((group, index) => {
                const nameInput = group.querySelector('input:nth-child(1)');
                const splitInput = group.querySelector('input:nth-child(2)');

                const name = nameInput.value.trim();
                const split = parseFloat(splitInput.value) || 0;

                if (!name) {
                    showNotification('Please enter all parent names', 'error');
                    hasError = true;
                    return;
                }

                if (split <= 0 || split > 100) {
                    showNotification('Split percentages must be between 0 and 100', 'error');
                    hasError = true;
                    return;
                }

                parents.push({name, split});
                totalSplit += split;
            });

            if (hasError) return;

            if (Math.abs(totalSplit - 100) > 0.01) {
                document.getElementById('splitErrorMessage').textContent = `Percentages total ${totalSplit.toFixed(1)}% (must be 100%)`;
                document.getElementById('splitErrorMessage').style.display = 'block';
                return;
            }

            document.getElementById('splitErrorMessage').style.display = 'none';
            wizardState.parents = parents;

            // Populate review screen
            document.getElementById('reviewFamilyName').textContent = wizardState.familyName;
            document.getElementById('reviewChildren').textContent = wizardState.childrenNames.join(', ');
            
            const reviewParents = document.getElementById('reviewParents');
            reviewParents.innerHTML = wizardState.parents.map(p => `<p>• ${p.name}: ${p.split}%</p>`).join('');

            document.getElementById('familySetupStep2').classList.add('hidden');
            document.getElementById('familySetupStep3').classList.remove('hidden');
        }

        function goBackToStep1() {
            document.getElementById('familySetupStep2').classList.add('hidden');
            document.getElementById('familySetupScreen').classList.remove('hidden');
        }

        function goBackToStep2() {
            document.getElementById('familySetupStep3').classList.add('hidden');
            document.getElementById('familySetupStep2').classList.remove('hidden');
        }

        function renderParentInputs() {
            const container = document.getElementById('parentsContainer');
            container.innerHTML = '';

            wizardState.parents.forEach((parent, index) => {
                const group = document.createElement('div');
                group.className = 'parent-input-group';
                group.innerHTML = `
                    <input type="text" value="${parent.name}" placeholder="Parent name">
                    <input type="number" value="${parent.split}" min="0" max="100" step="0.1" placeholder="%">
                    <button class="parent-remove-btn" onclick="removeParentInput(${index})">Remove</button>
                `;
                container.appendChild(group);
            });
        }

        function addParentInput() {
            wizardState.parents.push({name: '', split: 0});
            renderParentInputs();
        }

        function removeParentInput(index) {
            if (wizardState.parents.length > 1) {
                wizardState.parents.splice(index, 1);
                renderParentInputs();
            } else {
                showNotification('At least one parent is required', 'error');
            }
        }
```

- [ ] **Step 3b: Update existing createFamily() function**

Find the `async function createFamily()` (around line 959). Replace the entire function with:

```javascript
        async function createFamily() {
            // This now goes to Step 2 instead of directly creating
            goToStep2();
        }

        async function createFamilyFinal() {
            const familyName = wizardState.familyName;
            const children = wizardState.childrenNames;
            const parents = wizardState.parents;

            if (!familyName || children.length === 0 || parents.length === 0) {
                showNotification('Invalid family setup', 'error');
                return;
            }

            try {
                // Create family with parent splits
                const familyRef = await db.collection('families').add({
                    name: familyName,
                    children: children,
                    parents: parents,  // [{name: 'Louis', split: 50}, {name: 'Cecilia', split: 50}]
                    createdBy: currentUser.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Add all parents to the family members subcollection
                for (const parent of parents) {
                    await familyRef.collection('members').doc(currentUser.uid).set({
                        userId: currentUser.uid,
                        role: 'parent',
                        joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }

                showNotification('Family created successfully!', 'success');
                
                // Reset wizard state
                wizardState = {
                    familyName: '',
                    childrenNames: [],
                    parents: []
                };

                await loadUserData();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
```

- [ ] **Step 3c: Verify wizard state tracking**

Check that:
- `wizardState` object is defined with familyName, childrenNames, parents
- `goToStep2()` validates and transitions correctly
- `goToStep3()` validates splits sum to 100%
- `createFamilyFinal()` saves parents array to Firestore

- [ ] **Step 3d: Commit**

```bash
git add index.html
git commit -m "feat: implement multi-step wizard navigation for family setup"
```

---

### Task 4: Expand Expenses Tab with Form and List

**Files:**
- Modify: `index.html` (lines 610-614, replace Expenses tab content)

**Steps:**

- [ ] **Step 4a: Replace Expenses tab HTML**

Find the Expenses tab section (around lines 610-614):

```html
            <!-- Expenses Tab (Parents Only) -->
            <div id="expenses" class="tab-content parent-only">
                <h2>Expenses & Bills</h2>
                <p>Track and split expenses (Parent access only)</p>
            </div>
```

Replace it with:

```html
            <!-- Expenses Tab (Parents Only) -->
            <div id="expenses" class="tab-content parent-only">
                <h2>💰 Expenses & Bills</h2>
                <button class="btn btn-success" onclick="showAddExpenseForm()" style="max-width: 300px; margin: 20px 0;">+ Add Expense</button>

                <!-- Add Expense Form (initially hidden) -->
                <div id="expenseFormContainer" class="expense-form hidden" style="display: none;">
                    <h3>Add Expense</h3>
                    <div class="form-group">
                        <label>Amount (ZAR)</label>
                        <input type="number" id="expenseAmount" placeholder="0.00" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" id="expenseDescription" placeholder="e.g., Groceries">
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="expenseDate">
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="expenseCategory">
                            <option value="">Select category...</option>
                            <option value="Food">Food</option>
                            <option value="Medical">Medical</option>
                            <option value="School">School</option>
                            <option value="Activities">Activities</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Child (optional)</label>
                        <select id="expenseChildName">
                            <option value="">Not linked to a child</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Who Paid</label>
                        <select id="expensePaidBy">
                            <option value="">Select parent...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Notes (optional)</label>
                        <textarea id="expenseNotes" rows="2" placeholder="e.g., Receipt details..."></textarea>
                    </div>
                    <button class="btn" onclick="saveExpense()">Add Expense</button>
                    <button class="btn btn-secondary" onclick="hideAddExpenseForm()">Cancel</button>
                </div>

                <!-- Expenses List -->
                <div id="expensesList" style="margin-top: 30px;">
                    <!-- Expenses rendered here -->
                </div>

                <!-- Settlement Summary -->
                <div id="settlementSummary" class="settlement-box hidden" style="display: none; margin-top: 30px;">
                    <!-- Settlement info rendered here -->
                </div>
            </div>
```

- [ ] **Step 4b: Verify HTML structure**

Check that:
- Form inputs have correct IDs
- Hidden class is applied to form and settlement
- All buttons have onclick handlers

- [ ] **Step 4c: Commit**

```bash
git add index.html
git commit -m "feat: add expense form and list UI structure"
```

---

### Task 5: Implement Add Expense Functions

**Files:**
- Modify: `index.html` (lines 1419+, add new functions at end of script)

**Steps:**

- [ ] **Step 5a: Add expense form UI functions**

Find the end of the script section (before `</script>`). Add:

```javascript
        // Expense Management Functions
        function showAddExpenseForm() {
            // Populate dropdowns
            const childSelect = document.getElementById('expenseChildName');
            const paidBySelect = document.getElementById('expensePaidBy');

            // Get current family
            const familyRef = db.collection('families').doc(currentFamily);
            familyRef.get().then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    
                    // Populate children dropdown
                    childSelect.innerHTML = '<option value="">Not linked to a child</option>';
                    (data.children || []).forEach(child => {
                        const option = document.createElement('option');
                        option.value = child;
                        option.textContent = child;
                        childSelect.appendChild(option);
                    });

                    // Populate who paid dropdown
                    paidBySelect.innerHTML = '<option value="">Select parent...</option>';
                    (data.parents || []).forEach(parent => {
                        const option = document.createElement('option');
                        option.value = parent.name;
                        option.textContent = parent.name;
                        paidBySelect.appendChild(option);
                    });
                }
            });

            // Set date to today
            document.getElementById('expenseDate').valueAsDate = new Date();

            // Show form
            document.getElementById('expenseFormContainer').classList.remove('hidden');
            document.getElementById('expenseFormContainer').style.display = 'block';
        }

        function hideAddExpenseForm() {
            document.getElementById('expenseFormContainer').classList.add('hidden');
            document.getElementById('expenseFormContainer').style.display = 'none';
            clearExpenseForm();
        }

        function clearExpenseForm() {
            document.getElementById('expenseAmount').value = '';
            document.getElementById('expenseDescription').value = '';
            document.getElementById('expenseCategory').value = '';
            document.getElementById('expenseChildName').value = '';
            document.getElementById('expensePaidBy').value = '';
            document.getElementById('expenseNotes').value = '';
        }

        async function saveExpense() {
            const amount = parseFloat(document.getElementById('expenseAmount').value);
            const description = document.getElementById('expenseDescription').value.trim();
            const date = document.getElementById('expenseDate').value;
            const category = document.getElementById('expenseCategory').value;
            const childName = document.getElementById('expenseChildName').value;
            const paidBy = document.getElementById('expensePaidBy').value;
            const notes = document.getElementById('expenseNotes').value.trim();

            // Validation
            if (!amount || amount <= 0) {
                showNotification('Amount must be greater than 0', 'error');
                return;
            }
            if (!description) {
                showNotification('Description is required', 'error');
                return;
            }
            if (!date) {
                showNotification('Date is required', 'error');
                return;
            }
            if (!paidBy) {
                showNotification('Please select who paid', 'error');
                return;
            }

            try {
                await db.collection('families').doc(currentFamily)
                    .collection('expenses').add({
                        amount: amount,
                        description: description,
                        date: date,
                        category: category || null,
                        childName: childName || null,
                        paidBy: paidBy,
                        notes: notes,
                        createdBy: currentUser.uid,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                showNotification('Expense added successfully!', 'success');
                hideAddExpenseForm();
                loadExpenses();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
```

- [ ] **Step 5b: Verify function implementations**

Check that:
- `showAddExpenseForm()` populates children and parent dropdowns
- `saveExpense()` validates all required fields
- Date defaults to today
- Form clears after save

- [ ] **Step 5c: Commit**

```bash
git add index.html
git commit -m "feat: implement add expense form functions"
```

---

### Task 6: Implement Load and Display Expenses

**Files:**
- Modify: `index.html` (add loadExpenses function)

**Steps:**

- [ ] **Step 6a: Add loadExpenses function**

Add this function at the end of the script (before `</script>`):

```javascript
        async function loadExpenses() {
            if (!currentFamily) return;

            const expensesList = document.getElementById('expensesList');
            expensesList.innerHTML = '<div class="loading">Loading expenses...</div>';

            try {
                const expensesSnapshot = await db.collection('families').doc(currentFamily)
                    .collection('expenses')
                    .orderBy('date', 'desc')
                    .get();

                expensesList.innerHTML = '';

                if (expensesSnapshot.empty) {
                    expensesList.innerHTML = '<div class="empty-state"><p>💸 No expenses yet.</p><p style="font-size: 0.9em;">Add your first expense to get started.</p></div>';
                    document.getElementById('settlementSummary').classList.add('hidden');
                    document.getElementById('settlementSummary').style.display = 'none';
                    return;
                }

                // Build expenses table
                const table = document.createElement('table');
                table.style.cssText = 'width: 100%; border-collapse: collapse; margin-bottom: 20px;';
                
                const header = table.createTHead();
                const headerRow = header.insertRow();
                headerRow.style.cssText = 'background: #f8f9fa; border-bottom: 2px solid #e0e0e0;';
                ['Date', 'Description', 'Amount (ZAR)', 'Category', 'Paid By', 'Action'].forEach(text => {
                    const th = document.createElement('th');
                    th.textContent = text;
                    th.style.cssText = 'padding: 10px; text-align: left; font-weight: 600; color: #333;';
                    headerRow.appendChild(th);
                });

                const tbody = table.createTBody();
                const expenses = [];

                expensesSnapshot.forEach(doc => {
                    const expense = doc.data();
                    expenses.push(expense);

                    const row = tbody.insertRow();
                    row.style.cssText = 'border-bottom: 1px solid #e0e0e0;';
                    
                    const dateCell = row.insertCell();
                    dateCell.textContent = new Date(expense.date).toLocaleDateString('en-ZA');
                    dateCell.style.cssText = 'padding: 12px 10px;';

                    const descCell = row.insertCell();
                    descCell.innerHTML = `<strong>${expense.description}</strong>${expense.childName ? `<br><small style="color: #666;">Linked to: ${expense.childName}</small>` : ''}`;
                    descCell.style.cssText = 'padding: 12px 10px;';

                    const amountCell = row.insertCell();
                    amountCell.textContent = `R ${expense.amount.toLocaleString('en-ZA', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                    amountCell.style.cssText = 'padding: 12px 10px; font-weight: 600;';

                    const categoryCell = row.insertCell();
                    categoryCell.textContent = expense.category || '-';
                    categoryCell.style.cssText = 'padding: 12px 10px;';

                    const paidCell = row.insertCell();
                    paidCell.textContent = expense.paidBy;
                    paidCell.style.cssText = 'padding: 12px 10px;';

                    const actionCell = row.insertCell();
                    actionCell.innerHTML = `<button class="btn-delete" onclick="deleteExpense('${doc.id}')">Delete</button>`;
                    actionCell.style.cssText = 'padding: 12px 10px;';
                });

                expensesList.appendChild(table);

                // Load and display settlement
                await loadSettlement(expenses);
            } catch (error) {
                expensesList.innerHTML = `<p style="color: #dc3545;">Error loading expenses: ${error.message}</p>`;
            }
        }

        async function deleteExpense(expenseId) {
            if (!confirm('Are you sure you want to delete this expense?')) return;

            try {
                await db.collection('families').doc(currentFamily)
                    .collection('expenses')
                    .doc(expenseId)
                    .delete();

                showNotification('Expense deleted successfully!', 'success');
                loadExpenses();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
```

- [ ] **Step 6b: Update showMainApp to call loadExpenses**

Find the `function showMainApp()` (around line 1011). Add this line inside the function after checking userRole:

```javascript
            loadExpenses();
```

Make it look like:
```javascript
        function showMainApp() {
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('familySetupScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');

            if (userRole === 'helper') {
                document.querySelectorAll('.parent-only').forEach(el => el.classList.add('hidden'));
                switchTab('calendar');
            } else {
                document.querySelectorAll('.parent-only').forEach(el => el.classList.remove('hidden'));
            }

            loadCalendarEvents();
            loadExpenses();  // ADD THIS LINE
            if (userRole === 'parent') {
                loadFamilyMembers();
                loadDocuments();
            }
        }
```

- [ ] **Step 6c: Update switchTab to reload expenses**

Find the `function switchTab(tabName)` (around line 1031). Update it to also reload expenses when switching to expenses tab:

```javascript
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            // Reload data when switching tabs
            if (tabName === 'documents' && userRole === 'parent') {
                loadDocuments();
            }
            if (tabName === 'expenses' && userRole === 'parent') {
                loadExpenses();
            }
        }
```

- [ ] **Step 6d: Update switchFamily to reload expenses**

Find the `function switchFamily()` (around line 1191). Add loadExpenses call:

```javascript
        function switchFamily() {
            const selectedFamily = document.getElementById('familyDropdown').value;
            currentFamily = selectedFamily;
            loadCalendarEvents();
            loadExpenses();  // ADD THIS LINE
            if (userRole === 'parent') {
                loadFamilyMembers();
                loadDocuments();
            }
        }
```

- [ ] **Step 6e: Commit**

```bash
git add index.html
git commit -m "feat: implement load and display expenses with delete"
```

---

### Task 7: Implement Settlement Calculations

**Files:**
- Modify: `index.html` (add loadSettlement function)

**Steps:**

- [ ] **Step 7a: Add loadSettlement function**

Add this function before `</script>`:

```javascript
        async function loadSettlement(expenses) {
            if (!currentFamily) return;

            try {
                const familyDoc = await db.collection('families').doc(currentFamily).get();
                if (!familyDoc.exists) return;

                const family = familyDoc.data();
                const parents = family.parents || [];
                const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

                if (parents.length === 0 || totalExpenses === 0) {
                    document.getElementById('settlementSummary').classList.add('hidden');
                    return;
                }

                // Calculate fair share per parent
                const fairSharePerParent = totalExpenses / parents.length;

                // Calculate how much each parent paid
                const parentPayments = {};
                parents.forEach(p => {
                    parentPayments[p.name] = 0;
                });

                expenses.forEach(expense => {
                    if (parentPayments.hasOwnProperty(expense.paidBy)) {
                        parentPayments[expense.paidBy] += expense.amount;
                    }
                });

                // Calculate who owes whom
                const balances = {};
                parents.forEach(p => {
                    const paid = parentPayments[p.name] || 0;
                    balances[p.name] = paid - fairSharePerParent;
                });

                // Render settlement summary
                const summary = document.getElementById('settlementSummary');
                let html = '<h4>💰 Expense Summary</h4>';
                html += '<div class="settlement-summary">';

                parents.forEach(p => {
                    const paid = parentPayments[p.name] || 0;
                    html += `<div class="settlement-item">
                        <strong>${p.name}</strong><br>
                        Paid: R ${paid.toLocaleString('en-ZA', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>`;
                });

                html += '</div>';

                // Calculate settlements (who owes whom)
                const settlements = [];
                const owes = Object.entries(balances).filter(([name, balance]) => balance < 0);
                const owed = Object.entries(balances).filter(([name, balance]) => balance > 0);

                owes.forEach(([debtor, debtAmount]) => {
                    const absDebt = Math.abs(debtAmount);
                    owed.forEach(([creditor, creditAmount]) => {
                        if (creditAmount > 0.01) {  // More than 1c
                            const settlement = Math.min(absDebt, creditAmount);
                            if (settlement > 0.01) {
                                settlements.push({debtor, creditor, amount: settlement});
                                debtAmount += settlement;
                            }
                        }
                    });
                });

                if (settlements.length > 0) {
                    html += '<h4 style="margin-top: 15px;">⚖️ Settlement</h4>';
                    settlements.forEach(s => {
                        html += `<div class="settlement-owed">
                            ${s.debtor} owes ${s.creditor} R ${s.amount.toLocaleString('en-ZA', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>`;
                    });
                } else {
                    html += '<div class="settlement-owed" style="background: #d4edda; color: #155724;">✓ All settled up!</div>';
                }

                summary.innerHTML = html;
                summary.classList.remove('hidden');
                summary.style.display = 'block';
            } catch (error) {
                console.error('Error calculating settlement:', error);
            }
        }
```

- [ ] **Step 7b: Verify settlement logic**

Check that:
- Fair share = total expenses / number of parents
- Each parent's balance = what they paid - fair share
- Settlement correctly identifies who owes whom
- ZAR formatting is correct

- [ ] **Step 7c: Commit**

```bash
git add index.html
git commit -m "feat: implement settlement calculations"
```

---

### Task 8: Add Settings - Parent Configuration Section

**Files:**
- Modify: `index.html` (expand Settings tab)

**Steps:**

- [ ] **Step 8a: Add parent configuration HTML to Settings tab**

Find the Settings tab section (around lines 632-661):

```html
            <!-- Settings Tab (Parents Only) -->
            <div id="settings" class="tab-content parent-only">
                <h2>Family Settings</h2>

                <div class="invite-section">
                    <h3>Invite Co-Parent</h3>
                    ...
                </div>
                ...
            </div>
```

Add this section BEFORE the existing invite-section divs (right after `<h2>Family Settings</h2>`):

```html
                <div class="invite-section">
                    <h3>Expense Split Configuration</h3>
                    <p style="color: #666; margin-bottom: 15px;">Adjust how expenses are split between parents.</p>
                    <div id="parentsSplitContainer">
                        <!-- Parent splits rendered here -->
                    </div>
                    <button class="btn btn-success btn-small" onclick="saveSplitChanges()" style="margin-top: 15px;">Save Changes</button>
                </div>
```

- [ ] **Step 8b: Verify HTML is inserted correctly**

Check that the new section appears before the "Invite Co-Parent" section.

- [ ] **Step 8c: Commit**

```bash
git add index.html
git commit -m "feat: add parent split configuration to Settings tab"
```

---

### Task 9: Implement Settings - Load and Edit Parent Splits

**Files:**
- Modify: `index.html` (add settings functions)

**Steps:**

- [ ] **Step 9a: Add loadParentSplitsInSettings function**

Add this function before `</script>`:

```javascript
        async function loadParentSplitsInSettings() {
            try {
                const familyDoc = await db.collection('families').doc(currentFamily).get();
                if (!familyDoc.exists) return;

                const family = familyDoc.data();
                const parents = family.parents || [];

                const container = document.getElementById('parentsSplitContainer');
                container.innerHTML = '';

                parents.forEach((parent, index) => {
                    const group = document.createElement('div');
                    group.className = 'parent-input-group';
                    group.style.cssText = 'background: white; border: 1px solid #e0e0e0; padding: 12px;';
                    group.innerHTML = `
                        <input type="text" value="${parent.name}" placeholder="Parent name" data-parent-index="${index}">
                        <input type="number" value="${parent.split}" min="0" max="100" step="0.1" placeholder="%" data-parent-index="${index}">
                    `;
                    container.appendChild(group);
                });
            } catch (error) {
                console.error('Error loading parent splits:', error);
            }
        }

        async function saveSplitChanges() {
            try {
                const inputs = document.querySelectorAll('#parentsSplitContainer input');
                const parents = [];
                let totalSplit = 0;

                // Group inputs by parent
                for (let i = 0; i < inputs.length; i += 2) {
                    const name = inputs[i].value.trim();
                    const split = parseFloat(inputs[i + 1].value) || 0;

                    if (!name) {
                        showNotification('Please enter all parent names', 'error');
                        return;
                    }

                    if (split <= 0 || split > 100) {
                        showNotification('Split percentages must be between 0 and 100', 'error');
                        return;
                    }

                    parents.push({name, split});
                    totalSplit += split;
                }

                if (Math.abs(totalSplit - 100) > 0.01) {
                    showNotification(`Percentages total ${totalSplit.toFixed(1)}% (must be 100%)`, 'error');
                    return;
                }

                // Update Firestore
                await db.collection('families').doc(currentFamily).update({
                    parents: parents
                });

                showNotification('Split configuration updated!', 'success');
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
```

- [ ] **Step 9b: Update showMainApp to load parent splits in Settings**

Find the `function showMainApp()`. Add this line where loadFamilyMembers() is called:

```javascript
            if (userRole === 'parent') {
                loadFamilyMembers();
                loadDocuments();
                loadParentSplitsInSettings();  // ADD THIS LINE
            }
```

- [ ] **Step 9c: Update switchTab to reload parent splits when viewing Settings**

Find the `function switchTab(tabName)`. Update it:

```javascript
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            if (tabName === 'documents' && userRole === 'parent') {
                loadDocuments();
            }
            if (tabName === 'expenses' && userRole === 'parent') {
                loadExpenses();
            }
            if (tabName === 'settings' && userRole === 'parent') {  // ADD THIS
                loadParentSplitsInSettings();
            }
        }
```

- [ ] **Step 9d: Commit**

```bash
git add index.html
git commit -m "feat: implement settings for editing parent splits"
```

---

### Task 10: Update Firestore Security Rules

**Files:**
- Firebase Console (Firestore Rules tab)

**Steps:**

- [ ] **Step 10a: Update Firestore security rules**

Go to Firebase Console → Firestore Database → Rules tab. Replace all rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Families collection
    match /families/{familyId} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.uid == resource.data.createdBy;

      // Members subcollection
      match /members/{userId} {
        allow read: if request.auth.uid != null;
        allow write: if request.auth.uid != null;
      }

      // Events subcollection
      match /events/{eventId} {
        allow read: if request.auth.uid != null;
        allow create, update: if request.auth.uid != null;
        allow delete: if request.auth.uid == resource.data.createdBy;
      }

      // Documents subcollection
      match /documents/{docId} {
        allow read: if request.auth.uid != null;
        allow create, update: if request.auth.uid != null;
        allow delete: if request.auth.uid == resource.data.createdBy;
      }

      // Expenses subcollection - PARENTS ONLY
      match /expenses/{expenseId} {
        allow read: if isParentInFamily(familyId);
        allow create: if isParentInFamily(familyId);
        allow update: if isParentInFamily(familyId) && request.auth.uid == resource.data.createdBy;
        allow delete: if isParentInFamily(familyId) && request.auth.uid == resource.data.createdBy;
      }
    }

    // Invitations collection
    match /invitations/{invitationId} {
      allow read: if request.auth.uid != null;
      allow create: if request.auth.uid != null;
      allow update, delete: if request.auth.uid == resource.data.invitedBy;
    }

    // Helper function to check if user is parent in family
    function isParentInFamily(familyId) {
      return exists(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid)).data.role == 'parent';
    }
  }
}
```

- [ ] **Step 10b: Publish the rules**

Click the blue **Publish** button.

- [ ] **Step 10c: Verify rules are deployed**

Check for "Rules published successfully" message.

---

### Task 11: Test Family Setup Wizard

**Files:**
- `index.html` (test in browser)

**Steps:**

- [ ] **Step 11a: Open the app in browser**

Navigate to: `https://groblerlo-oss.github.io/coparent/`

- [ ] **Step 11b: Test Step 1 → Step 2 transition**

1. Log in with test account
2. Enter Family Name: "Test Family"
3. Enter Children: "Child1" and "Child2"
4. Click "Create Family"
5. Expected: Should go to Step 2 with parent split configuration

- [ ] **Step 11c: Test parent split validation**

1. In Step 2, enter parents:
   - Parent 1: "Alice", 60%
   - Parent 2: "Bob", 50%  (invalid - total is 110%)
2. Click "Next: Review"
3. Expected: Error message "Percentages total 110.0% (must be 100%)"

- [ ] **Step 11d: Test valid split**

1. Correct Bob's split to 40%
2. Click "Next: Review"
3. Expected: Go to Step 3 with review screen showing family, children, and parents with splits

- [ ] **Step 11e: Test Step 3 → Create**

1. Review screen shows all info correctly
2. Click "Create Family"
3. Expected: Family created, app navigates to main screen

- [ ] **Step 11f: Commit test notes**

```bash
git add -A
git commit -m "test: verify family setup wizard with expense splits"
```

---

### Task 12: Test Expenses Tab

**Files:**
- `index.html` (test in browser)

**Steps:**

- [ ] **Step 12a: Add test expense**

1. Go to Expenses tab
2. Click "+ Add Expense"
3. Fill form:
   - Amount: R 500
   - Description: "Groceries"
   - Date: Today
   - Category: "Food"
   - Child: "Child1"
   - Who Paid: "Alice"
   - Notes: "Checkers"
4. Click "Add Expense"
5. Expected: Expense appears in list with correct formatting

- [ ] **Step 12b: Add second expense**

1. Click "+ Add Expense" again
2. Fill form:
   - Amount: R 300
   - Description: "School fees"
   - Date: Today
   - Category: "School"
   - Who Paid: "Bob"
3. Click "Add Expense"
4. Expected: Second expense appears in list

- [ ] **Step 12c: Verify settlement calculation**

1. Look at Settlement section
2. Expected to see:
   - Alice paid: R 500.00
   - Bob paid: R 300.00
   - Settlement: "Bob owes Alice R 100.00 to settle up" (if 50/50 split)
   - Fair share per parent: R 400.00

- [ ] **Step 12d: Test delete expense**

1. Click "Delete" on first expense
2. Confirm deletion
3. Expected: Expense removed, settlement updates

- [ ] **Step 12e: Test helper access**

1. Log out and create test helper account
2. Invite helper to family
3. Log in as helper
4. Expected: Expenses tab not visible, can only see Calendar

- [ ] **Step 12f: Commit test**

```bash
git add -A
git commit -m "test: verify expenses tab with add, delete, and settlement"
```

---

### Task 13: Test Settings - Split Configuration

**Files:**
- `index.html` (test in browser)

**Steps:**

- [ ] **Step 13a: Open Settings tab**

1. As parent, click Settings tab
2. Expected: "Expense Split Configuration" section shows parents with current splits

- [ ] **Step 13b: Modify splits**

1. Change Alice split from 60% to 55%
2. Change Bob split from 40% to 45%
3. Click "Save Changes"
4. Expected: Success notification, settings saved

- [ ] **Step 13c: Verify new split applies to new expenses**

1. Go to Expenses tab
2. Add new expense: R 200, paid by Alice
3. Go back to Settlement section
4. Expected: Settlement calculated with new 55/45 split

- [ ] **Step 13d: Commit test**

```bash
git add -A
git commit -m "test: verify settings split configuration updates"
```

---

### Task 14: Final Integration Test

**Files:**
- `index.html` (full end-to-end test)

**Steps:**

- [ ] **Step 14a: Full scenario test**

1. Create new family: "Smith Family", children: "Emma", "Noah"
2. Configure splits: "Louis" 60%, "Cecilia" 40%
3. Add expenses:
   - R 1000 - "Groceries" paid by Louis
   - R 500 - "Medical" paid by Cecilia
   - R 200 - "School" (Emma), paid by Louis
4. Check settlement:
   - Total: R 1700
   - Fair share each: R 850
   - Louis paid: R 1200 → Owed R 350
   - Cecilia paid: R 500 → Owes R 350
   - Expected: "Cecilia owes Louis R 350.00"

- [ ] **Step 14b: Test across family switch**

1. Create another family with different split (50/50)
2. Switch between families
3. Expected: Expenses and settlements correctly show for each family

- [ ] **Step 14c: Hard refresh browser**

1. Press Ctrl+Shift+R
2. Navigate back to Expenses tab
3. Expected: All data persists, expenses and settlement still show

- [ ] **Step 14d: Final commit**

```bash
git add -A
git commit -m "feat: complete expense splits implementation with full integration testing"
```

---

## Success Criteria

- [x] Family setup is a 3-step wizard with parent split configuration
- [x] Parents can configure splits during setup
- [x] Expenses can be added with all required fields
- [x] Settlement calculation correctly computes who owes whom
- [x] All amounts display in ZAR with proper formatting
- [x] Helpers cannot access Expenses tab
- [x] Parents can modify splits in Settings anytime
- [x] All data persists in Firestore
- [x] App works correctly on page refresh

---

## Testing Checklist

- [ ] Family setup wizard: Step 1 → Step 2 → Step 3 → Create
- [ ] Step 2: Validation of percentage totaling 100%
- [ ] Add expense with all fields
- [ ] Delete expense
- [ ] Settlement calculation is accurate
- [ ] Helper role cannot see Expenses tab
- [ ] Parent can edit splits in Settings
- [ ] New expenses use updated splits
- [ ] Data persists after page refresh
- [ ] ZAR formatting is correct throughout
- [ ] UI responsive on mobile

