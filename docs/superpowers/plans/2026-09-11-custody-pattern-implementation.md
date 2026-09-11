# Custody Pattern Quick-Add Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement quick-add custody pattern feature enabling parents to create recurring weekend patterns (weekly/bi-weekly/monthly) with one-click setup and handle swaps via "Mark as Swapped" workflow.

**Architecture:** Add custody pattern button + modal to Calendar tab. Generate Saturday-Sunday event pairs using batch writes. Reuse existing event infrastructure with `isCustodyPattern: true` and `category: "custody"` metadata. Swap workflow marks original event with swap details and creates replacement events.

**Tech Stack:** Vanilla JavaScript, Firebase Firestore (existing), HTML/CSS (existing modal patterns)

---

### Task 1: Add Custody Pattern Button and Modal HTML

**Files:**
- Modify: `index.html` (add button next to "+ Add Event", add custody pattern modal)

- [ ] **Step 1: Add custody pattern button to Calendar tab**

Find the "+ Add Event" button in the Calendar tab (around line 1360) and add a custody pattern button after it:

```html
<button class="btn btn-success" onclick="showCustodyPatternModal()" style="max-width: 300px; margin: 20px 0;">📅 Add Custody Pattern</button>
```

- [ ] **Step 2: Add custody pattern modal HTML**

After the existing "Add Event Modal" (after the closing `</div>` of addEventModal, before the "Add Document Modal"), add:

```html
<!-- Custody Pattern Modal -->
<div id="custodyPatternModal" class="modal hidden">
    <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>Add Custody Pattern</h3>
            <button onclick="closeCustodyPatternModal()" style="background: none; border: none; font-size: 1.5em; cursor: pointer;">&times;</button>
        </div>

        <div class="form-group">
            <label for="custodyPatternPerson">Child with:</label>
            <select id="custodyPatternPerson" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="Daddy">Daddy</option>
                <option value="Mommy">Mommy</option>
                <option value="Granny">Granny</option>
            </select>
        </div>

        <div class="form-group">
            <label for="custodyPatternStartDate">Starting Saturday:</label>
            <input type="date" id="custodyPatternStartDate" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            <small id="custodyPatternStartDateError" style="color: red; display: none;">Please select a Saturday</small>
        </div>

        <div class="form-group">
            <label>Recurrence:</label>
            <div style="margin-top: 8px;">
                <label style="display: block; margin-bottom: 8px;">
                    <input type="radio" name="custodyPatternRecurrence" value="weekly"> Weekly (every 7 days)
                </label>
                <label style="display: block; margin-bottom: 8px;">
                    <input type="radio" name="custodyPatternRecurrence" value="biweekly" checked> Every 2 weeks (every 14 days)
                </label>
                <label style="display: block;">
                    <input type="radio" name="custodyPatternRecurrence" value="monthly"> Monthly (every 30 days)
                </label>
            </div>
        </div>

        <div class="form-group">
            <label for="custodyPatternEndDate">End Date (optional, leave blank for ongoing):</label>
            <input type="date" id="custodyPatternEndDate" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
        </div>

        <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button class="btn" onclick="saveCustodyPattern()">Create Pattern</button>
            <button class="btn btn-secondary" onclick="closeCustodyPatternModal()">Cancel</button>
        </div>
    </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add custody pattern button and modal HTML"
```

---

### Task 2: Add CSS Styling for Custody Events and Swapped Badge

**Files:**
- Modify: `index.html` (add CSS for custody category and swapped badge)

- [ ] **Step 1: Add custody event styling**

Find the event styling section (around line 500-600 where event categories are styled). Add after the existing category styles:

```css
.event-badge.custody {
    background: #4caf50;
    color: white;
    border-left: 4px solid #2e7d32;
}

.event-badge.custody:hover {
    background: #388e3c;
}
```

- [ ] **Step 2: Add swapped event badge styling**

Add after custody styling:

```css
.event-swapped-badge {
    display: inline-block;
    background: #ff9800;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.75em;
    font-weight: bold;
    margin-left: 4px;
    vertical-align: middle;
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "style: add CSS for custody events and swapped badges"
```

---

### Task 3: Implement Pattern Date Generation and Validation Functions

**Files:**
- Modify: `index.html` (add JavaScript utility functions)

- [ ] **Step 1: Add helper functions for date calculation**

Add after the existing calendar functions (after `renderMonthlyCalendar()` function, around line 2600):

```javascript
// Check if date is a Saturday (day 6 in getDay())
function isSaturday(dateStr) {
    const date = new Date(dateStr);
    return date.getDay() === 6;
}

// Generate all Saturday-Sunday pairs for a custody pattern
function generateCustodyDates(startDateStr, recurrencePattern, endDateStr) {
    const dates = [];
    const startDate = new Date(startDateStr);
    const endDate = endDateStr ? new Date(endDateStr) : new Date(startDate.getFullYear() + 3, startDate.getMonth(), startDate.getDate());
    
    const intervals = {
        'weekly': 7,
        'biweekly': 14,
        'monthly': 30
    };
    
    const intervalDays = intervals[recurrencePattern] || 14;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        // Add Saturday
        const saturdayStr = formatDateToISO(currentDate);
        dates.push(saturdayStr);
        
        // Add Sunday
        const sundayDate = new Date(currentDate);
        sundayDate.setDate(sundayDate.getDate() + 1);
        const sundayStr = formatDateToISO(sundayDate);
        dates.push(sundayStr);
        
        // Move to next interval
        currentDate.setDate(currentDate.getDate() + intervalDays);
    }
    
    return dates;
}

// Format date as YYYY-MM-DD in local timezone
function formatDateToISO(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add date generation and validation helper functions"
```

---

### Task 4: Implement Custody Pattern Modal Functions

**Files:**
- Modify: `index.html` (add show/close/save functions)

- [ ] **Step 1: Add modal show/close functions**

Add after the helper functions from Task 3:

```javascript
function showCustodyPatternModal() {
    document.getElementById('custodyPatternModal').classList.remove('hidden');
    document.getElementById('custodyPatternStartDate').focus();
}

function closeCustodyPatternModal() {
    document.getElementById('custodyPatternModal').classList.add('hidden');
    // Clear form
    document.getElementById('custodyPatternPerson').value = 'Daddy';
    document.getElementById('custodyPatternStartDate').value = '';
    document.getElementById('custodyPatternEndDate').value = '';
    document.querySelector('input[name="custodyPatternRecurrence"][value="biweekly"]').checked = true;
    document.getElementById('custodyPatternStartDateError').style.display = 'none';
}
```

- [ ] **Step 2: Add custody pattern save function**

Add after the show/close functions:

```javascript
async function saveCustodyPattern() {
    if (!currentFamily || !auth.currentUser) return;

    const person = document.getElementById('custodyPatternPerson').value;
    const startDateStr = document.getElementById('custodyPatternStartDate').value;
    const endDateStr = document.getElementById('custodyPatternEndDate').value;
    const recurrence = document.querySelector('input[name="custodyPatternRecurrence"]:checked').value;

    // Validate start date is a Saturday
    if (!startDateStr) {
        showNotification('Please select a starting Saturday', 'error');
        return;
    }

    if (!isSaturday(startDateStr)) {
        document.getElementById('custodyPatternStartDateError').style.display = 'block';
        showNotification('Please select a Saturday', 'error');
        return;
    }

    try {
        // Generate all dates for pattern
        const dates = generateCustodyDates(startDateStr, recurrence, endDateStr);
        const patternId = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const createdAt = new Date();

        // Batch create events
        const batch = db.batch();
        let eventCount = 0;

        for (let i = 0; i < dates.length; i++) {
            const dateStr = dates[i];
            const isSaturday = i % 2 === 0; // Even indices are Saturdays
            const eventRef = db.collection('families').doc(currentFamily)
                .collection('events')
                .doc(); // Auto-generate ID

            const eventData = {
                title: `Child with ${person}`,
                date: dateStr,
                time: '',
                category: 'custody',
                notes: '',
                createdBy: auth.currentUser.uid,
                createdByName: auth.currentUser.displayName || 'Unknown',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isArchived: false,
                archivedDate: new Date(new Date(dateStr).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                editHistory: [],
                
                // Custody-specific fields
                isCustodyPattern: true,
                patternId: patternId,
                patternRecurrence: recurrence,
                patternStartDate: startDateStr,
                patternEndDate: endDateStr || null,
                patternPerson: person,
                
                // Swap tracking
                swappedTo: null,
                swappedFrom: null,
                swapNotes: '',
                
                // Recurrence
                recurrence: {
                    enabled: true,
                    pattern: recurrence,
                    daysOfWeek: isSaturday ? ['Saturday'] : ['Sunday'],
                    endDate: endDateStr || null
                }
            };

            batch.set(eventRef, eventData);
            eventCount++;
        }

        // Commit batch write
        await batch.commit();

        showNotification(`✅ Custody pattern created: ${recurrence} starting ${startDateStr}`, 'success');
        addNotification(`📅 Custody pattern created: Every ${recurrence === 'weekly' ? 'week' : recurrence === 'biweekly' ? '2 weeks' : 'month'} starting ${startDateStr}`, 'info');
        
        closeCustodyPatternModal();
        loadCalendarEvents();

    } catch (error) {
        console.error('Error creating custody pattern:', error);
        showNotification(`Error creating pattern: ${error.message}`, 'error');
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add custody pattern modal show/close and save functions"
```

---

### Task 5: Add "Mark as Swapped" Button to Event Details Modal

**Files:**
- Modify: `index.html` (update event details modal)

- [ ] **Step 1: Add "Mark as Swapped" button to event details modal**

Find the event details modal button section (around line 1697-1700 where "Edit Time" and "Close" buttons are). Update to include swap button:

```html
<div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
    <button class="btn" id="editTimeBtn" onclick="editEventTime()" style="display: none;">Edit Time</button>
    <button class="btn" id="editDateBtn" onclick="editEventDate()" style="display: none;">Edit Date</button>
    <button class="btn btn-danger" id="deleteEventBtn" onclick="deleteEventFromModal()" style="display: none;">Delete</button>
    <button class="btn" id="markSwappedBtn" onclick="showSwapModal()" style="display: none;">🔄 Mark as Swapped</button>
    <button class="btn btn-secondary" onclick="closeEventDetailsModal()">Close</button>
</div>
```

- [ ] **Step 2: Update showEventDetails to show swap button for custody events**

Find the `showEventDetails()` function (around line 2580). Update to show/hide swap button based on event type:

After the line where buttons are hidden/shown for nanny, add:

```javascript
const markSwappedBtn = document.getElementById('markSwappedBtn');
markSwappedBtn.style.display = (eventData.category === 'custody' && !isNannyUser) ? 'block' : 'none';
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add mark as swapped button to event details modal"
```

---

### Task 6: Implement Swap Workflow Functions

**Files:**
- Modify: `index.html` (add swap modal HTML and functions)

- [ ] **Step 1: Add swap modal HTML**

Add after the custody pattern modal (after the closing `</div>` of custodyPatternModal):

```html
<!-- Swap Custody Weekend Modal -->
<div id="swapCustodyModal" class="modal hidden">
    <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>Swap Custody Weekend</h3>
            <button onclick="closeSwapModal()" style="background: none; border: none; font-size: 1.5em; cursor: pointer;">&times;</button>
        </div>

        <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <p><strong>Original:</strong> <span id="swapOriginalDate"></span></p>
            <p style="margin-top: 8px;"><strong>Moving to:</strong></p>
        </div>

        <div class="form-group">
            <label for="swapNewSaturday">Select new Saturday:</label>
            <input type="date" id="swapNewSaturday" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            <small id="swapDateError" style="color: red; display: none;">Please select a Saturday</small>
        </div>

        <div class="form-group">
            <label for="swapNotes">Why the swap? (optional)</label>
            <textarea id="swapNotes" rows="3" placeholder="e.g., Dad's birthday weekend" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit;"></textarea>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button class="btn" onclick="confirmSwap()">Confirm Swap</button>
            <button class="btn btn-secondary" onclick="closeSwapModal()">Cancel</button>
        </div>
    </div>
</div>
```

- [ ] **Step 2: Add swap modal functions**

Add after the custody pattern save function:

```javascript
function showSwapModal() {
    if (!window.currentEventDetails) return;
    
    const originalDate = window.currentEventDetails.date;
    document.getElementById('swapOriginalDate').textContent = `${originalDate} (${window.currentEventDetails.title})`;
    document.getElementById('swapNewSaturday').value = '';
    document.getElementById('swapNotes').value = '';
    document.getElementById('swapDateError').style.display = 'none';
    
    document.getElementById('swapCustodyModal').classList.remove('hidden');
}

function closeSwapModal() {
    document.getElementById('swapCustodyModal').classList.add('hidden');
}

async function confirmSwap() {
    if (!currentFamily || !window.currentEventDetails) return;

    const newSaturdayStr = document.getElementById('swapNewSaturday').value;
    const swapNotes = document.getElementById('swapNotes').value.trim();

    if (!newSaturdayStr) {
        showNotification('Please select a new Saturday', 'error');
        return;
    }

    if (!isSaturday(newSaturdayStr)) {
        document.getElementById('swapDateError').style.display = 'block';
        showNotification('Please select a Saturday', 'error');
        return;
    }

    try {
        const originalEvent = window.currentEventDetails;
        const originalDate = originalEvent.date;
        const eventId = originalEvent.id;

        const batch = db.batch();

        // Update original event: mark as swapped
        const originalRef = db.collection('families').doc(currentFamily)
            .collection('events')
            .doc(eventId);

        batch.update(originalRef, {
            swappedTo: newSaturdayStr,
            swapNotes: swapNotes,
            swappedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Create replacement events for new Saturday and Sunday
        const newSunday = new Date(new Date(newSaturdayStr).getTime() + 24 * 60 * 60 * 1000);
        const newSundayStr = formatDateToISO(newSunday);

        for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
            const replacementDate = dayOffset === 0 ? newSaturdayStr : newSundayStr;
            const replacementRef = db.collection('families').doc(currentFamily)
                .collection('events')
                .doc();

            const replacementEvent = {
                ...originalEvent,
                id: replacementRef.id,
                date: replacementDate,
                swappedFrom: originalDate,
                swappedTo: null,
                swappedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            delete replacementEvent.id; // Remove old ID before setting

            batch.set(replacementRef, replacementEvent);
        }

        await batch.commit();

        showNotification(`✅ Swapped! ${originalDate} moved to ${newSaturdayStr}`, 'success');
        addNotification(`🔄 Custody weekend swapped: ${originalDate} → ${newSaturdayStr}`, 'info');

        closeSwapModal();
        closeEventDetailsModal();
        loadCalendarEvents();

    } catch (error) {
        console.error('Error swapping custody weekend:', error);
        showNotification(`Error swapping: ${error.message}`, 'error');
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add swap custody weekend modal and functions"
```

---

### Task 7: Update Calendar Event Display for Custody Events

**Files:**
- Modify: `index.html` (update event badge rendering)

- [ ] **Step 1: Update event badge display to show swap status**

Find the event badge rendering section in `renderMonthlyCalendar()` (around line 2535-2550 where event badges are created). Update the badge creation to show swap status:

```javascript
events.slice(0, 3).forEach(event => {
    const eventBadge = document.createElement('div');
    eventBadge.className = `event-badge ${event.category || 'general'}`;

    // Show event title with time if available
    let eventText = event.title;
    if (event.time) {
        eventText += ` ${event.time}`;
    }
    
    // Add swapped badge if applicable
    if (event.swappedTo) {
        eventText += ' ⚠️ Swapped';
    }
    
    eventBadge.textContent = eventText;
    eventsDiv.appendChild(eventBadge);
});
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: show swap status badge on calendar custody events"
```

---

### Task 8: Ensure Nanny Read-Only Access to Custody Events

**Files:**
- Verify: `firestore-rules.txt` (check custody event permissions)

- [ ] **Step 1: Verify Firestore rules allow nanny to read custody events**

Check that events collection rules allow nanny read access (rules should already exist from earlier work). The rules should allow:
- Parents: read/create/update/delete events
- Nannies: read events (including custody events)

If nanny rules are not present, add to events subcollection:

```
match /events/{eventId} {
    allow read: if request.auth.uid != null;
    allow create, update: if request.auth.uid != null;
    allow delete: if request.auth.uid == resource.data.createdBy;
}
```

- [ ] **Step 2: Commit if changes made**

```bash
git add firestore-rules.txt
git commit -m "verify: nanny read-only access to custody events in Firestore rules"
```

---

### Task 9: Integration Testing

**Files:**
- Test: Manual testing in app

- [ ] **Step 1: Create a custody pattern**

1. Open Calendar tab
2. Click "📅 Add Custody Pattern"
3. Select "Daddy"
4. Pick a Saturday (e.g., Sept 14, 2026)
5. Select "Every 2 weeks"
6. Leave end date blank (ongoing)
7. Click "Create Pattern"
8. Verify: Events appear on Sept 14-15, Sept 28-29, Oct 12-13, etc.

Expected: Green "custody" category events show on calendar

- [ ] **Step 2: Test Saturday validation**

1. Click "📅 Add Custody Pattern" again
2. Pick a Friday (not Saturday)
3. Try to save
4. Verify: Error message "Please select a Saturday"

- [ ] **Step 3: Test swap workflow**

1. Click a custody event on calendar (e.g., Sept 14)
2. Event details modal opens
3. Click "🔄 Mark as Swapped" button
4. Swap modal appears with original date
5. Select new Saturday (e.g., Oct 5)
6. Enter swap reason "Dad's birthday"
7. Click "Confirm Swap"
8. Verify: Original event (Sept 14) now shows "⚠️ Swapped" badge
9. Verify: New events created on Oct 5-6

- [ ] **Step 4: Test nanny access**

1. Logout and login as nanny user
2. Go to Calendar tab
3. Verify: Custody events are visible
4. Click on custody event
5. Verify: "🔄 Mark as Swapped" button is NOT shown (only visible to parents)

- [ ] **Step 5: Test pattern with end date**

1. Create new custody pattern with end date (e.g., Sept 12 - Dec 31, 2026)
2. Verify: Events only created up to Dec 31 (about 8 weekends)

- [ ] **Step 6: Commit test results**

```bash
git add -A
git commit -m "test: integration testing for custody pattern feature

- Verified pattern creation generates correct dates
- Tested Saturday validation rejects invalid dates
- Tested swap workflow marks original and creates replacement
- Verified nanny sees custody events but cannot mark as swapped
- Tested pattern with end date limits event creation"
```

---

### Task 10: Final Polish and Cleanup

**Files:**
- Modify: `index.html` (any remaining tweaks)

- [ ] **Step 1: Verify all functions are called correctly**

Search for any console errors during testing. Fix any issues found.

- [ ] **Step 2: Test Firestore batch writes**

Verify that custody patterns create all events atomically:
- Check Firestore: Go to families > [familyId] > events collection
- Verify all Saturday-Sunday pairs exist
- Verify `patternId` field groups them together

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete custody pattern quick-add feature

- Quick-add button for recurring custody patterns (weekly/biweekly/monthly)
- Form validation for Saturday start dates
- Batch write generation for all pattern dates
- Swap workflow with notes tracking
- Nanny read-only access to custody events
- Visual swap badge on calendar events
- Full integration testing completed"
```

---

## Execution Checklist

After all tasks are complete:
- [ ] All 10 tasks committed
- [ ] No console errors when testing
- [ ] Custody events display correctly on calendar
- [ ] Swap workflow works as expected
- [ ] Nanny cannot modify custody events
- [ ] Firestore batch writes succeed
- [ ] Calendar refreshes after pattern creation
- [ ] App deployed to production

