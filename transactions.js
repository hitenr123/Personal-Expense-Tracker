// ==========================================
// Transactions Page
// ==========================================

// Elements
const transactionBody =
    document.querySelector("table tbody");

const searchInput =
    document.querySelector(".search input");

const filters =
    document.querySelectorAll(".transaction-tools select");

const categoryFilter = filters[0];
const typeFilter = filters[1];


// ==========================================
// Get Expenses
// ==========================================

function getExpenses() {

    return JSON.parse(
        localStorage.getItem("expenses")
    ) || [];

}


// ==========================================
// Format Date
// ==========================================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


// ==========================================
// Display Transactions
// ==========================================

function displayTransactions(expenses) {

    transactionBody.innerHTML = "";

    if (expenses.length === 0) {

        transactionBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No transactions found
                </td>
            </tr>
        `;

        return;
    }


    expenses.forEach(expense => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                <i class="fa-solid fa-receipt"></i>
                ${expense.category}
            </td>

            <td>
                ${expense.notes || "Expense"}
            </td>

            <td>
                ${formatDate(expense.date)}
            </td>

            <td class="expense">
                -₹${Number(expense.amount)
                    .toLocaleString("en-IN")}
            </td>

            <td>
                <span class="badge red">
                    Expense
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

    const totalExpense =
        expenses.reduce(
            (total, expense) =>
                total + Number(expense.amount),
            0
        );


    // Income will be connected later
    const totalIncome =
        Number(
            localStorage.getItem("totalIncome")
        ) || 0;


    const balance =
        totalIncome - totalExpense;


    document.getElementById("totalIncome")
        .textContent =
        "₹" + totalIncome.toLocaleString("en-IN");


    document.getElementById("totalExpense")
        .textContent =
        "₹" + totalExpense.toLocaleString("en-IN");


    document.getElementById("totalBalance")
        .textContent =
        "₹" + balance.toLocaleString("en-IN");

}


// ==========================================
// Filter
// ==========================================

function filterTransactions() {

    const expenses = getExpenses();

    const search =
        searchInput.value.toLowerCase();

    const category =
        categoryFilter.value;

    const type =
        typeFilter.value;


    const filtered =
        expenses.filter(expense => {

            const categoryText =
                expense.category.toLowerCase();

            const notesText =
                (expense.notes || "")
                    .toLowerCase();


            const searchMatch =
                categoryText.includes(search) ||
                notesText.includes(search);


            const categoryMatch =
                category === "All Categories" ||
                expense.category === category;


            const typeMatch =
                type === "All Types" ||
                type === "Expense";


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

displayTransactions(getExpenses());

updateSummary();