const loadBtn = document.getElementById('load-btn');
const loadingMessage = document.getElementById('loading-message');
const errorMessage = document.getElementById('error-message');
const expensesList = document.getElementById('expenses-list');

const addExpenseForm = document.getElementById('add-expense-form');
const descriptionInput = document.getElementById('description-input');
const amountInput = document.getElementById('amount-input');
const categorySelect = document.getElementById('category-select');
const formError = document.getElementById('form-error');

const statCount = document.getElementById('stat-count');
const statTotal = document.getElementById('stat-total');
const statAverage = document.getElementById('stat-average');
const statHighest = document.getElementById('stat-highest');
const statTopCategory = document.getElementById('stat-top-category');

const searchInput = document.getElementById('search-input');
const categoryFilterSelect = document.getElementById('category-filter-select');
const sortSelect = document.getElementById('sort-select');

const exportCsvBtn = document.getElementById('export-csv-btn');

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatCurrency(amount) {
    return currencyFormatter.format(amount);
}

let currentExpenses = [];
let hasLoadedExpenses = false;

function escapeCsvField(value) {
    const stringValue = String(value);

    if (/["\n,]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

function buildCsv(expenses) {
    const rows = expenses.map(expense => [
        escapeCsvField(expense.description),
        expense.amount.toFixed(2),
        escapeCsvField(expense.category)
    ].join(','));

    return ['Description,Amount,Category', ...rows].join('\n');
}

function todayForFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function exportCsv() {
    const csv = buildCsv(currentExpenses);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${todayForFilename()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

function sortComparator(sortValue) {
    switch (sortValue) {
        case 'oldest': return (a, b) => a.id - b.id;
        case 'highest': return (a, b) => b.amount - a.amount;
        case 'lowest': return (a, b) => a.amount - b.amount;
        case 'az': return (a, b) => a.description.localeCompare(b.description);
        case 'za': return (a, b) => b.description.localeCompare(a.description);
        case 'newest':
        default: return (a, b) => b.id - a.id;
    }
}

function computeVisibleExpenses() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const categoryValue = categoryFilterSelect.value;

    let result = currentExpenses;

    if (categoryValue !== 'All') {
        result = result.filter(expense => expense.category === categoryValue);
    }

    if (searchTerm) {
        result = result.filter(expense => expense.description.toLowerCase().includes(searchTerm));
    }

    return [...result].sort(sortComparator(sortSelect.value));
}

function showEmptyMessage(message) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-message';
    emptyItem.textContent = message;
    expensesList.appendChild(emptyItem);
}

function renderList(visibleExpenses) {
    expensesList.innerHTML = '';

    if (!hasLoadedExpenses && currentExpenses.length === 0) {
        showEmptyMessage("Click \"Load Expenses\" to see your expenses, or add one above.");
        return;
    }

    if (currentExpenses.length === 0) {
        showEmptyMessage('No expenses yet. Add your first expense above!');
        return;
    }

    if (visibleExpenses.length === 0) {
        showEmptyMessage('No expenses match your search.');
        return;
    }

    visibleExpenses.forEach(renderExpense);
}

function applyFiltersAndRender() {
    renderList(computeVisibleExpenses());
}

function updateDashboard(currentExpenses) {
    const count = currentExpenses.length;
    const total = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const average = count ? total / count : 0;
    const highest = count ? Math.max(...currentExpenses.map(expense => expense.amount)) : 0;

    statCount.textContent = count;
    statTotal.textContent = formatCurrency(total);
    statAverage.textContent = formatCurrency(average);
    statHighest.textContent = formatCurrency(highest);

    if (count === 0) {
        statTopCategory.textContent = '—';
        return;
    }

    const totalsByCategory = currentExpenses.reduce((totals, expense) => {
        totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
        return totals;
    }, {});

    const [topCategory, topAmount] = Object.entries(totalsByCategory)
        .sort((a, b) => b[1] - a[1])[0];

    statTopCategory.textContent = `${topCategory} (${formatCurrency(topAmount)})`;
}

function categoryOptionsHtml(selected) {
    return CATEGORIES.map(category =>
        `<option value="${category}"${category === selected ? ' selected' : ''}>${category}</option>`
    ).join('');
}

function renderExpense(expense) {
    const item = document.createElement('li');
    item.dataset.id = expense.id;
    setViewMode(item, expense);
    expensesList.appendChild(item);
}

function setViewMode(item, expense) {
    item.dataset.description = expense.description;
    item.dataset.amount = expense.amount;
    item.dataset.category = expense.category;
    item.classList.remove('editing', 'confirming-delete');
    item.innerHTML = `
        <div class="expense-info">
            <span class="expense-description">${expense.description}</span>
            <span class="expense-category">${expense.category}</span>
            <span class="expense-amount">${formatCurrency(expense.amount)}</span>
        </div>
        <div class="expense-actions">
            <button type="button" class="edit-btn btn-sm">Edit</button>
            <button type="button" class="delete-btn btn-sm">Delete</button>
        </div>
    `;
}

function setEditMode(item) {
    item.classList.add('editing');
    item.classList.remove('confirming-delete');
    item.innerHTML = `
        <input type="text" class="edit-description-input" value="${item.dataset.description}">
        <input type="number" step="0.01" class="edit-amount-input" value="${item.dataset.amount}">
        <select class="edit-category-select">${categoryOptionsHtml(item.dataset.category)}</select>
        <button type="button" class="save-btn btn-sm">Save</button>
        <p class="edit-error error" hidden></p>
    `;
}

function setDeleteConfirmMode(item) {
    item.classList.add('confirming-delete');
    item.classList.remove('editing');
    item.innerHTML = `
        <span class="confirm-message">Delete "${item.dataset.description}"?</span>
        <div class="expense-actions">
            <button type="button" class="confirm-delete-btn btn-sm">Delete</button>
            <button type="button" class="cancel-delete-btn btn-sm">Cancel</button>
        </div>
    `;
}

function revertToViewMode(item) {
    setViewMode(item, {
        description: item.dataset.description,
        amount: Number(item.dataset.amount),
        category: item.dataset.category
    });
}

async function saveExpense(item) {
    const descriptionInput = item.querySelector('.edit-description-input');
    const amountInput = item.querySelector('.edit-amount-input');
    const categorySelect = item.querySelector('.edit-category-select');
    const editError = item.querySelector('.edit-error');
    const saveBtn = item.querySelector('.save-btn');

    editError.hidden = true;

    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    if (!description) {
        editError.textContent = 'Description cannot be empty.';
        editError.hidden = false;
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        editError.textContent = 'Amount must be greater than 0.';
        editError.hidden = false;
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const response = await fetch(`/expenses/${item.dataset.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, amount, category })
        });

        if (!response.ok) {
            throw new Error('Server responded with an error');
        }

        const expense = await response.json();
        const index = currentExpenses.findIndex(e => e.id === expense.id);
        currentExpenses[index] = expense;
        updateDashboard(currentExpenses);
        applyFiltersAndRender();
    } catch (err) {
        editError.textContent = 'Could not save changes. Please try again.';
        editError.hidden = false;
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
    }
}

async function deleteExpense(id, confirmBtn) {
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Deleting...';
    }

    try {
        const response = await fetch(`/expenses/${id}`, { method: 'DELETE' });

        if (!response.ok) {
            throw new Error('Server responded with an error');
        }

        errorMessage.hidden = true;
        currentExpenses = currentExpenses.filter(e => e.id !== Number(id));
        updateDashboard(currentExpenses);
        applyFiltersAndRender();
    } catch (err) {
        errorMessage.textContent = 'Could not delete expense. Please try again.';
        errorMessage.hidden = false;

        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Delete';
        }
    }
}

async function loadExpenses() {
    loadingMessage.hidden = false;
    errorMessage.hidden = true;
    loadBtn.disabled = true;
    expensesList.innerHTML = '';

    try {
        const response = await fetch('/expenses');

        if (!response.ok) {
            throw new Error('Server responded with an error');
        }

        const expenses = await response.json();

        currentExpenses = expenses;
        hasLoadedExpenses = true;
        updateDashboard(currentExpenses);
        applyFiltersAndRender();
    } catch (err) {
        errorMessage.textContent = 'Could not load expenses. Please try again.';
        errorMessage.hidden = false;
    } finally {
        loadingMessage.hidden = true;
        loadBtn.disabled = false;
    }
}

function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
}

async function addExpense(event) {
    event.preventDefault();
    formError.hidden = true;

    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    if (!description) {
        showFormError('Description cannot be empty.');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showFormError('Amount must be greater than 0.');
        return;
    }

    const submitBtn = addExpenseForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
        const response = await fetch('/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, amount, category })
        });

        if (!response.ok) {
            throw new Error('Server responded with an error');
        }

        const expense = await response.json();
        currentExpenses.push(expense);
        updateDashboard(currentExpenses);
        applyFiltersAndRender();

        addExpenseForm.reset();
        descriptionInput.focus();
    } catch (err) {
        showFormError('Could not add expense. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Expense';
    }
}

loadBtn.addEventListener('click', loadExpenses);
addExpenseForm.addEventListener('submit', addExpense);
exportCsvBtn.addEventListener('click', exportCsv);

function revertOtherActiveRows(exceptItem) {
    expensesList.querySelectorAll('li.editing, li.confirming-delete').forEach(row => {
        if (row !== exceptItem) {
            revertToViewMode(row);
        }
    });
}

expensesList.addEventListener('click', (event) => {
    const listItem = event.target.closest('li');

    if (!listItem) {
        return;
    }

    if (event.target.classList.contains('delete-btn')) {
        revertOtherActiveRows(listItem);
        setDeleteConfirmMode(listItem);
        return;
    }

    if (event.target.classList.contains('confirm-delete-btn')) {
        deleteExpense(listItem.dataset.id, event.target);
        return;
    }

    if (event.target.classList.contains('cancel-delete-btn')) {
        revertToViewMode(listItem);
        return;
    }

    if (event.target.classList.contains('edit-btn')) {
        revertOtherActiveRows(listItem);
        setEditMode(listItem);
        return;
    }

    if (event.target.classList.contains('save-btn')) {
        saveExpense(listItem);
    }
});

searchInput.addEventListener('input', applyFiltersAndRender);
categoryFilterSelect.addEventListener('change', applyFiltersAndRender);
sortSelect.addEventListener('change', applyFiltersAndRender);

applyFiltersAndRender();