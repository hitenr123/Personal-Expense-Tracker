// ==========================================
// Transactions Page
// ==========================================

const transactionBody = document.querySelector("table tbody");

const searchInput = document.querySelector(".search input");

const filters = document.querySelectorAll(
    ".transaction-tools select"
);

const categoryFilter = filters[0];
const typeFilter = filters[1];


// ==========================================
// Get Data
// ==========================================

function getExpenses() {
    return JSON.parse(
        localStorage.getItem("expenses")
    ) || [];
}

function getIncomes() {
    return JSON.parse(
        localStorage.getItem("incomes")
    ) || [];
}


// ==========================================
// Combine Transactions
// ==========================================

function getTransactions() {

    const expenses = getExpenses();
    const incomes = getIncomes();

    const expenseTransactions =
        expenses.map(expense => ({
            id: expense.id,
            category: expense.category,
            description: expense.notes || "Expense",
            date: expense.date,
            amount: -Number(expense.amount),
            type: "Expense"
        }));

    const incomeTransactions =
        incomes.map(income => ({
            id: income.id,
            category: income.source,
            description:
                income.receivedFrom ||
                income.notes ||
                "Income",
            date: income.date,
            amount: Number(income.amount),
            type: "Income"
        }));

    return [
        ...incomeTransactions,
        ...expenseTransactions
    ].sort(
        (a, b) =>
            new Date(b.date) -
            new Date(a.date)
    );
}


// ==========================================
// Format Date
// ==========================================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date =
        new Date(dateString);

    return date.toLocaleDateString(
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
                <td colspan="5"
                    style="text-align:center;">
                    No transactions found
                </td>
            </tr>
        `;

        return;
    }

    transactions.forEach(transaction => {

        const row =
            document.createElement("tr");

        const isIncome =
            transaction.type === "Income";

        const sign =
            isIncome ? "+" : "-";

        const amountClass =
            isIncome ? "income" : "expense";

        const badgeClass =
            isIncome ? "green" : "red";

        row.innerHTML = `
            <td>
                <i class="fa-solid fa-receipt"></i>
                ${transaction.category}
            </td>

            <td>
                ${transaction.description}
            </td>

            <td>
                ${formatDate(transaction.date)}
            </td>

            <td class="${amountClass}">
                ${formatCurrency(Math.abs(transaction.amount))}
            </td>

            <td>
                <span class="badge ${badgeClass}">
                    ${transaction.type}
                </span>
            </td>
        `;

        transactionBody.appendChild(row);
    });
}


// ==========================================
// Update Summary
// ==========================================

function updateSummary() {

    const expenses = getExpenses();
    const incomes = getIncomes();

    const totalExpense =
        expenses.reduce(
            (total, expense) =>
                total + Number(expense.amount),
            0
        );

    const totalIncome =
        incomes.reduce(
            (total, income) =>
                total + Number(income.amount),
            0
        );

    const balance =
        totalIncome - totalExpense;


    document.getElementById("totalIncome")
        .textContent =
        "₹" +
        totalIncome.toLocaleString("en-IN");

    document.getElementById("totalExpense")
        .textContent =
        "₹" +
        totalExpense.toLocaleString("en-IN");

    document.getElementById("totalBalance")
        .textContent =
        "₹" +
        balance.toLocaleString("en-IN");
}


// ==========================================
// Filter Transactions
// ==========================================

function filterTransactions() {

    const transactions =
        getTransactions();

    const search =
        searchInput.value.toLowerCase();

    const category =
        categoryFilter.value;

    const type =
        typeFilter.value;


    const filtered =
        transactions.filter(transaction => {

            const categoryText =
                transaction.category
                    .toLowerCase();

            const descriptionText =
                transaction.description
                    .toLowerCase();

            const searchMatch =
                categoryText.includes(search) ||
                descriptionText.includes(search);

            const categoryMatch =
                category === "All Categories" ||
                transaction.category === category;

            const typeMatch =
                type === "All Types" ||
                transaction.type === type;

            return (
                searchMatch &&
                categoryMatch &&
                typeMatch
            );
        });


    displayTransactions(filtered);
}


// ==========================================
// Events
// ==========================================

searchInput.addEventListener(
    "input",
    filterTransactions
);

categoryFilter.addEventListener(
    "change",
    filterTransactions
);

typeFilter.addEventListener(
    "change",
    filterTransactions
);


// ==========================================
// Initial Load
// ==========================================

displayTransactions(
    getTransactions()
);

updateSummary();