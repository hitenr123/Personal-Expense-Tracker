
// ==========================================
// Transactions Page
// ==========================================

const API_URL = "http://127.0.0.1:5000/api/expenses";

const transactionBody = document.querySelector("table tbody");
const searchInput = document.querySelector(".search input");

const filters = document.querySelectorAll(
    ".transaction-tools select"
);

const categoryFilter = filters[0];
const typeFilter = filters[1];

let allTransactions = [];


// ==========================================
// Get Income from Local Storage
// ==========================================

function getIncomes() {
    return JSON.parse(
        localStorage.getItem("incomes") || "[]"
    );
}


// ==========================================
// Fetch Expenses from Supabase
// ==========================================

async function getExpenses() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch expenses");
        }

        const result = await response.json();

        return result.data || [];

    } catch (error) {

        console.error("Expense loading error:", error);

        alert("Unable to load expenses. Check whether Flask is running.");

        return [];
    }
}


// ==========================================
// Combine Transactions
// ==========================================

async function loadTransactions() {

    const expenses = await getExpenses();
    const incomes = getIncomes();

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
        category: income.source || "Income",
        description:
            income.receivedFrom ||
            income.notes ||
            "Income",
        date: income.date,
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


// ==========================================
// Format Date
// ==========================================

function formatDate(dateString) {

    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// ==========================================
// Display Transactions
// ==========================================

function displayTransactions(transactions) {

    transactionBody.innerHTML = "";

    if (transactions.length === 0) {

        transactionBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
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

        row.append(
            categoryCell,
            descriptionCell,
            dateCell,
            amountCell,
            typeCell
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
// Events
// ==========================================

searchInput.addEventListener("input", filterTransactions);

categoryFilter.addEventListener("change", filterTransactions);

typeFilter.addEventListener("change", filterTransactions);


// ==========================================
// Initial Load
// ==========================================

loadTransactions();
