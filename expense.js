
// ==========================================
// Expense Page - Supabase Integration
// ==========================================

const API_URL = "http://127.0.0.1:5000/api/expenses";

// Form elements
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const paymentSelect = document.getElementById("payment");
const accountSelect = document.getElementById("account");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const methodSelect = document.getElementById("method");
const notesInput = document.getElementById("notes");
const recurringInput = document.getElementById("recurring");
const receiptInput = document.getElementById("receipt");

const previewAmount = document.getElementById("previewAmount");
const selectedCategory = document.getElementById("selectedCategory");
const selectedPayment = document.getElementById("selectedPayment");

const form = document.querySelector("form");

const todayExpense = document.getElementById("todayExpense");
const monthExpense = document.getElementById("monthExpense");
const remainingBudget = document.getElementById("remainingBudget");

// Local date (avoids UTC date mismatch)
function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatMoney(amount) {
    if (typeof formatCurrency === "function") {
        return formatCurrency(amount);
    }

    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

// Set default date and time
function setDefaultDateTime() {
    const now = new Date();

    if (dateInput) {
        dateInput.value = getLocalDate();
    }

    if (timeInput) {
        timeInput.value =
            String(now.getHours()).padStart(2, "0") +
            ":" +
            String(now.getMinutes()).padStart(2, "0");
    }
}

setDefaultDateTime();

// Live summary
function updateLiveSummary() {
    const amount = Number(amountInput.value) || 0;

    previewAmount.textContent = formatMoney(amount);

    selectedCategory.textContent =
        categorySelect.value || "Not Selected";

    selectedPayment.textContent =
        paymentSelect.value || "Not Selected";
}

amountInput.addEventListener("input", updateLiveSummary);
categorySelect.addEventListener("change", updateLiveSummary);
paymentSelect.addEventListener("change", updateLiveSummary);

// Fetch expenses from Supabase through Flask
async function updateExpenseSummary() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not fetch expenses");
        }

        const result = await response.json();
        const expenses = result.data || [];

        const today = getLocalDate();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const todayTotal = expenses
            .filter(expense => expense.transaction_date === today)
            .reduce((sum, expense) => sum + Number(expense.amount), 0);

        const monthTotal = expenses
            .filter(expense => {
                const date = new Date(
                    expense.transaction_date + "T00:00:00"
                );

                return (
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear
                );
            })
            .reduce((sum, expense) => sum + Number(expense.amount), 0);

        const budget =
            Number(localStorage.getItem("monthlyBudget")) || 0;

        todayExpense.textContent = formatMoney(todayTotal);
        monthExpense.textContent = formatMoney(monthTotal);

        remainingBudget.textContent =
            formatMoney(budget - monthTotal);

    } catch (error) {
        console.error("Summary error:", error);
    }
}

// Save expense to Supabase
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const amount = Number(amountInput.value);

    if (!amount || amount <= 0) {
        alert("Please enter a valid expense amount.");
        amountInput.focus();
        return;
    }

    if (!categorySelect.value || !paymentSelect.value || !dateInput.value) {
        alert("Please complete all required fields.");
        return;
    }

    const expense = {
        amount: amount,
        category: categorySelect.value,
        payment: paymentSelect.value,
        account: accountSelect.value || "",
        date: dateInput.value,
        time: timeInput.value || "",
        method: methodSelect.value || "",
        notes: notesInput.value || "",
        recurring: recurringInput.checked,
        receipt: receiptInput.files.length
            ? receiptInput.files[0].name
            : ""
    };

    const saveButton = form.querySelector(".save-btn");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(expense)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || "Save failed");
        }

        alert("Expense saved successfully!");

        form.reset();
        setDefaultDateTime();

        previewAmount.textContent = formatMoney(0);
        selectedCategory.textContent = "Not Selected";
        selectedPayment.textContent = "Not Selected";

        await updateExpenseSummary();

    } catch (error) {
        console.error("Save error:", error);
        alert("Could not save expense: " + error.message);

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Expense";
    }
});

// Reset button
form.addEventListener("reset", function () {
    setTimeout(() => {
        previewAmount.textContent = formatMoney(0);
        selectedCategory.textContent = "Not Selected";
        selectedPayment.textContent = "Not Selected";
    }, 0);
});

// Initial summary
updateLiveSummary();
updateExpenseSummary();
