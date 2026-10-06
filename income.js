// ==========================================
// Income Page
// ==========================================

const incomeForm = document.getElementById("incomeForm");

const amountInput = document.getElementById("amount");
const sourceSelect = document.getElementById("source");
const paymentSelect = document.getElementById("payment");
const accountSelect = document.getElementById("account");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const receivedFromInput = document.getElementById("receivedFrom");
const notesInput = document.getElementById("notes");
const attachmentInput = document.getElementById("attachment");
const tagsInput = document.getElementById("tags");
const recurringInput = document.getElementById("recurringIncome");

// Summary
const todayIncome = document.getElementById("todayIncome");
const monthIncome = document.getElementById("monthIncome");
const totalIncomeElement = document.getElementById("totalIncome");
const highestIncome = document.getElementById("highestIncome");

// ==========================================
// Default Date and Time
// ==========================================

const now = new Date();

dateInput.value = now.toISOString().split("T")[0];

timeInput.value =
    now.toTimeString().slice(0, 5);

// ==========================================
// Get Incomes
// ==========================================

function getIncomes() {

    return JSON.parse(
        localStorage.getItem("incomes")
    ) || [];

}

// ==========================================
// Update Income Summary
// ==========================================

function updateIncomeSummary() {

    const incomes = getIncomes();

    const currentDate =
        new Date();

    const today =
        currentDate.toISOString().split("T")[0];

    const currentMonth =
        currentDate.getMonth();

    const currentYear =
        currentDate.getFullYear();

    // Today's income
    const todayTotal =
        incomes
            .filter(income =>
                income.date === today
            )
            .reduce(
                (total, income) =>
                    total + Number(income.amount),
                0
            );

    // This month's income
    const monthTotal =
        incomes
            .filter(income => {

                const date =
                    new Date(income.date);

                return (
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear
                );

            })
            .reduce(
                (total, income) =>
                    total + Number(income.amount),
                0
            );

    // Total income
    const total =
        incomes.reduce(
            (total, income) =>
                total + Number(income.amount),
            0
        );

    // Highest income
    const highest =
        incomes.length > 0
            ? Math.max(
                ...incomes.map(
                    income => Number(income.amount)
                )
            )
            : 0;

    todayIncome.textContent =
        formatCurrency(todayTotal);

    monthIncome.textContent =
        formatCurrency(monthTotal);

    totalIncomeElement.textContent =
        formatCurrency(total);

    highestIncome.textContent =
        formatCurrency(highest);
}

// ==========================================
// Save Income
// ==========================================

incomeForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const amount =
        Number(amountInput.value);

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (
        !sourceSelect.value ||
        sourceSelect.value === "Select Source"
    ) {
        alert("Please select an income source.");
        return;
    }

    const income = {

        id: Date.now(),

        amount: amount,

        source:
            sourceSelect.value,

        payment:
            paymentSelect.value,

        account:
            accountSelect.value,

        date:
            dateInput.value,

        time:
            timeInput.value,

        receivedFrom:
            receivedFromInput.value,

        notes:
            notesInput.value,

        tags:
            tagsInput.value,

        recurring:
            recurringInput.checked,

        attachment:
            attachmentInput.files.length
                ? attachmentInput.files[0].name
                : ""

    };

    const incomes =
        getIncomes();

    incomes.push(income);

    localStorage.setItem(
        "incomes",
        JSON.stringify(incomes)
    );

    updateIncomeSummary();

    alert("Income saved successfully!");

    incomeForm.reset();

    // Set today's date/time again
    dateInput.value =
        new Date().toISOString().split("T")[0];

    timeInput.value =
        new Date().toTimeString().slice(0, 5);

});

// ==========================================
// Initial Load
// ==========================================

updateIncomeSummary();