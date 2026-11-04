
// ==========================================
// Transactions Page - Supabase Integration
// Edit, Delete, Search and Filter
// ==========================================

const TRANSACTIONS_EXPENSE_API =
    "https://personal-expense-tracker-7qhy.onrender.com/api/expenses";

const TRANSACTIONS_INCOME_API =
    "https://personal-expense-tracker-7qhy.onrender.com/api/income";

const transactionBody = document.querySelector("table tbody");
const searchInput = document.querySelector(".search input");

const filters = document.querySelectorAll(
    ".transaction-tools select"
);

const categoryFilter = filters[0];
const typeFilter = filters[1];

const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editTransactionForm");

let allTransactions = [];

// Refresh shared dashboard and budget data
function refreshTransactionData() {
    localStorage.setItem("transactionsUpdated", Date.now().toString());

    // Notify pages open in the same tab
    window.dispatchEvent(new Event("transactionsUpdated"));
}


// ==========================================
// API Helper
// ==========================================

async function apiRequest(url, options = {}) {

    const headers = {
        ...options.headers
    };

    if (options.body) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error || result.message || "Request failed"
        );
    }

    return result;
}


// ==========================================
// Fetch Expenses
// ==========================================

async function getExpenses() {

    const result = await apiRequest(
        TRANSACTIONS_EXPENSE_API
    );

    return result.data || [];
}


// ==========================================
// Fetch Income
// ==========================================

async function getIncomes() {

    const result = await apiRequest(
        TRANSACTIONS_INCOME_API
    );

    return result.data || [];
}


// ==========================================
// Load Transactions
// ==========================================

async function loadTransactions() {

    try {

        const [expenses, incomes] = await Promise.all([
            getExpenses(),
            getIncomes()
        ]);

        const expenseTransactions = expenses.map(expense => ({

            id: expense.id,

            category: expense.category || "Other",

            description: expense.notes || "Expense",

            date: expense.transaction_date,

            amount: Number(expense.amount),

            type: "Expense"

        }));


        const incomeTransactions = incomes.map(income => ({

            id: income.id,

            category: income.category || "Income",

            description:
                income.received_from ||
                income.notes ||
                "Income",

            date: income.transaction_date,

            amount: Number(income.amount),

            type: "Income"

        }));


        allTransactions = [
            ...incomeTransactions,
            ...expenseTransactions
        ].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );


        updateSummary();

        filterTransactions();

    }

    catch (error) {

        console.error("Transaction loading error:", error);

        alert("Unable to load transactions: " + error.message);

    }
}


// ==========================================
// Format Date
// ==========================================

function formatDate(dateString) {

    if (!dateString) return "-";

    return new Date(dateString + "T00:00:00")
        .toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

}


// ==========================================
// Display Transactions
// ==========================================

function displayTransactions(transactions) {

    transactionBody.innerHTML = "";

    if (transactions.length === 0) {

        transactionBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No transactions found
                </td>
            </tr>
        `;

        return;
    }


    transactions.forEach(transaction => {

        const row = document.createElement("tr");

        const isIncome = transaction.type === "Income";

        const amountClass = isIncome ? "income" : "expense";

        const badgeClass = isIncome ? "green" : "red";


        const categoryCell = document.createElement("td");
        const descriptionCell = document.createElement("td");
        const dateCell = document.createElement("td");
        const amountCell = document.createElement("td");
        const typeCell = document.createElement("td");
        const actionCell = document.createElement("td");


        categoryCell.textContent = transaction.category;

        descriptionCell.textContent = transaction.description;

        dateCell.textContent = formatDate(transaction.date);

        amountCell.className = amountClass;

        amountCell.textContent =
            (isIncome ? "+" : "-") +
            formatCurrency(Math.abs(transaction.amount));


        const badge = document.createElement("span");

        badge.className = `badge ${badgeClass}`;

        badge.textContent = transaction.type;

        typeCell.appendChild(badge);


        // Edit Button

        const editButton = document.createElement("button");

        editButton.className = "edit-btn";

        editButton.innerHTML =
            '<i class="fa-solid fa-pen"></i> Edit';

        editButton.dataset.action = "edit";

        editButton.dataset.id = transaction.id;


        // Delete Button

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";

        deleteButton.innerHTML =
            '<i class="fa-solid fa-trash"></i> Delete';

        deleteButton.dataset.action = "delete";

        deleteButton.dataset.id = transaction.id;


        actionCell.append(editButton, deleteButton);


        row.append(
            categoryCell,
            descriptionCell,
            dateCell,
            amountCell,
            typeCell,
            actionCell
        );

        transactionBody.appendChild(row);

    });

}


// ==========================================
// Update Summary
// ==========================================

function updateSummary() {

    const totalExpense = allTransactions
        .filter(t => t.type === "Expense")
        .reduce((sum, t) => sum + t.amount, 0);


    const totalIncome = allTransactions
        .filter(t => t.type === "Income")
        .reduce((sum, t) => sum + t.amount, 0);


    const balance = totalIncome - totalExpense;


    document.getElementById("totalIncome").textContent =
        formatCurrency(totalIncome);

    document.getElementById("totalExpense").textContent =
        formatCurrency(totalExpense);

    document.getElementById("totalBalance").textContent =
        formatCurrency(balance);

}


// ==========================================
// Filter Transactions
// ==========================================

function filterTransactions() {

    const search = searchInput.value.toLowerCase();

    const category = categoryFilter.value;

    const type = typeFilter.value;


    const filtered = allTransactions.filter(transaction => {

        const searchMatch =
            transaction.category.toLowerCase().includes(search) ||
            transaction.description.toLowerCase().includes(search);

        const categoryMatch =
            category === "All Categories" ||
            transaction.category === category;

        const typeMatch =
            type === "All Types" ||
            transaction.type === type;


        return searchMatch && categoryMatch && typeMatch;

    });


    displayTransactions(filtered);

}


// ==========================================
// Open Edit Modal
// ==========================================

function openEditModal(transaction) {

    document.getElementById("editTransactionId").value =
        transaction.id;

    document.getElementById("editType").value =
        transaction.type.toLowerCase();

    document.getElementById("editAmount").value =
        transaction.amount;

    document.getElementById("editCategory").value =
        transaction.category;

    document.getElementById("editNotes").value =
        transaction.description;

    document.getElementById("editDate").value =
        transaction.date
            ? transaction.date.substring(0, 10)
            : "";


    editModal.classList.add("active");

}


// ==========================================
// Close Edit Modal
// ==========================================

function closeEditModal() {

    editModal.classList.remove("active");

    editForm.reset();

}


document.getElementById("closeEditModal")
    .addEventListener("click", closeEditModal);

document.getElementById("cancelEdit")
    .addEventListener("click", closeEditModal);


// ==========================================
// Edit Transaction - Update Supabase
// ==========================================

editForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const id = document.getElementById("editTransactionId").value;

    const type = document.getElementById("editType").value;

    const amount = Number(
        document.getElementById("editAmount").value
    );

    const category =
        document.getElementById("editCategory").value.trim();

    const description =
        document.getElementById("editNotes").value.trim();

    const date =
        document.getElementById("editDate").value;


    if (!id || !category || !date || amount <= 0 || !Number.isFinite(amount)) {

        alert("Please enter valid transaction details.");

        return;
    }


    const apiURL = type === "income"
        ? TRANSACTIONS_INCOME_API
        : TRANSACTIONS_EXPENSE_API;


    try {

        const result = await apiRequest(
            `${apiURL}/${encodeURIComponent(id)}`,
            {
                method: "PUT",

                body: JSON.stringify({
                    amount,
                    category,
                    description,
                    date
                })
            }
        );


        alert(result.message || "Transaction updated successfully!");

        closeEditModal();

        await loadTransactions();

        refreshTransactionData();

    }

    catch (error) {

        console.error("Update error:", error);

        alert("Unable to update transaction: " + error.message);

    }

});


// ==========================================
// Delete Transaction - Delete from Supabase
// ==========================================

async function deleteTransaction(transaction) {

    const confirmed = confirm(
        `Are you sure you want to delete this ${transaction.type.toLowerCase()}?`
    );

    if (!confirmed) return;


    const apiURL = transaction.type === "Income"
        ? TRANSACTIONS_INCOME_API
        : TRANSACTIONS_EXPENSE_API;


    try {

        const result = await apiRequest(
            `${apiURL}/${encodeURIComponent(transaction.id)}`,
            {
                method: "DELETE"
            }
        );


        alert(result.message || "Transaction deleted successfully!");

        await loadTransactions();

        refreshTransactionData();

    }

    catch (error) {

        console.error("Delete error:", error);

        alert("Unable to delete transaction: " + error.message);

    }

}


// ==========================================
// Edit / Delete Button Events
// ==========================================

transactionBody.addEventListener("click", function (e) {

    const button = e.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    const action = button.dataset.action;

    const transaction = allTransactions.find(
        t => String(t.id) === String(id)
    );

    if (!transaction) return;


    if (action === "edit") {

        openEditModal(transaction);

    }

    else if (action === "delete") {

        deleteTransaction(transaction);

    }

});


// ==========================================
// Search and Filter Events
// ==========================================

searchInput.addEventListener("input", filterTransactions);

categoryFilter.addEventListener("change", filterTransactions);

typeFilter.addEventListener("change", filterTransactions);


// ==========================================
// Initial Load
// ==========================================

loadTransactions();
