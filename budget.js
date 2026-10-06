// ==========================================
// Budget Page
// ==========================================

const budgetForm =
    document.getElementById("budgetForm");

const budgetInput =
    document.getElementById("budgetAmount");

const monthlyBudget =
    document.getElementById("monthlyBudget");

const budgetSpent =
    document.getElementById("budgetSpent");

const budgetRemaining =
    document.getElementById("budgetRemaining");


// ==========================================
// Get Expenses
// ==========================================

function getBudgetExpenses() {

    return JSON.parse(
        localStorage.getItem("expenses")
    ) || [];

}


// ==========================================
// Calculate Monthly Expense
// ==========================================

function getCurrentMonthExpense() {

    const expenses =
        getBudgetExpenses();

    const now = new Date();

    const month =
        now.getMonth();

    const year =
        now.getFullYear();

    return expenses
        .filter(expense => {

            const date =
                new Date(expense.date);

            return (
                date.getMonth() === month &&
                date.getFullYear() === year
            );

        })
        .reduce(
            (total, expense) =>
                total + Number(expense.amount),
            0
        );

}


// ==========================================
// Update Budget
// ==========================================

function updateBudget() {

    const budget =
        Number(
            localStorage.getItem("monthlyBudget")
        ) || 0;

    const spent =
        getCurrentMonthExpense();

    const remaining =
        budget - spent;


    monthlyBudget.textContent =
        "₹" +
        budget.toLocaleString("en-IN");

    budgetSpent.textContent =
        "₹" +
        spent.toLocaleString("en-IN");

    budgetRemaining.textContent =
        "₹" +
        Math.max(
            remaining,
            0
        ).toLocaleString("en-IN");

}


// ==========================================
// Save Budget
// ==========================================

budgetForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const budget =
            Number(budgetInput.value);

        if (budget <= 0) {

            alert(
                "Please enter a valid budget."
            );

            return;
        }

        localStorage.setItem(
            "monthlyBudget",
            budget
        );

        updateBudget();

        alert(
            "Monthly budget saved successfully!"
        );

    }
);


// ==========================================
// Initial Load
// ==========================================

updateBudget();