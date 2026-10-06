// ==========================================
// Expense Page Script
// ==========================================

// -----------------------------
// Elements
// -----------------------------

const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const paymentSelect = document.getElementById("payment");
const accountSelect = document.getElementById("account");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const notesInput = document.getElementById("notes");
const recurringInput = document.getElementById("recurring");
const receiptInput = document.getElementById("receipt");

const previewAmount = document.getElementById("previewAmount");
const selectedCategory = document.getElementById("selectedCategory");
const selectedPayment = document.getElementById("selectedPayment");

const form = document.querySelector("form");

// -----------------------------
// Default Date & Time
// -----------------------------

const now = new Date();

if (dateInput) {
  dateInput.value = now.toISOString().split("T")[0];
}

if (timeInput) {
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  timeInput.value = `${hours}:${minutes}`;
}

// -----------------------------
// Live Expense Summary
// -----------------------------

function updateLiveSummary() {
  // Amount
  const amount = Number(amountInput.value) || 0;

  previewAmount.innerHTML = "₹" + amount.toLocaleString("en-IN");

  // Category
  if (categorySelect.value && categorySelect.value !== "Select Category") {
    selectedCategory.innerHTML = categorySelect.value;
  } else {
    selectedCategory.innerHTML = "Not Selected";
  }

  // Payment
  if (paymentSelect.value && paymentSelect.value !== "Select Method") {
    selectedPayment.innerHTML = paymentSelect.value;
  } else {
    selectedPayment.innerHTML = "Not Selected";
  }
}

// Amount changes
amountInput.addEventListener("input", updateLiveSummary);

// Category changes
categorySelect.addEventListener("change", updateLiveSummary);

// Payment method changes
paymentSelect.addEventListener("change", updateLiveSummary);

// -----------------------------
// Save Expense
// -----------------------------

form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (amountInput.value === "") {
    alert("Please enter expense amount.");

    amountInput.focus();

    return;
  }

  const expense = {
    id: Date.now(),

    amount: Number(amountInput.value),

    category: categorySelect.value,

    payment: paymentSelect.value,

    account: accountSelect.value,

    date: dateInput.value,

    time: timeInput.value,

    notes: notesInput.value,

    recurring: recurringInput.checked,

    receipt: receiptInput.files.length ? receiptInput.files[0].name : "",
  };

  const expenses = JSON.parse(localStorage.getItem("expenses")) || [];

  expenses.push(expense);

  localStorage.setItem("expenses", JSON.stringify(expenses));

  updateExpenseSummary();

  alert("Expense Saved Successfully!");

  form.reset();

  previewAmount.innerHTML = "₹0";

  selectedCategory.innerHTML = "Not Selected";
  selectedPayment.innerHTML = "Not Selected";

  dateInput.value = now.toISOString().split("T")[0];

  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");

  timeInput.value = `${h}:${m}`;
});

// -----------------------------
// Reset Button
// -----------------------------

document.querySelector(".reset-btn").addEventListener("click", () => {
  previewAmount.innerHTML = "₹0";

  selectedCategory.innerHTML = "Food";

  selectedPayment.innerHTML = "Cash";
});

// -----------------------------
// Dynamic Expense Summary
// -----------------------------

const todayExpense = document.getElementById("todayExpense");
const monthExpense = document.getElementById("monthExpense");
const remainingBudget = document.getElementById("remainingBudget");

function updateExpenseSummary() {
  const expenses = JSON.parse(localStorage.getItem("expenses")) || [];

  const now = new Date();

  const today = now.toISOString().split("T")[0];

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Today's expense
  const todayTotal = expenses
    .filter((expense) => expense.date === today)
    .reduce((total, expense) => total + Number(expense.amount), 0);

  // Current month's expense
  const monthTotal = expenses
    .filter((expense) => {
      const date = new Date(expense.date);

      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    })
    .reduce((total, expense) => total + Number(expense.amount), 0);

  // Budget
  const budget = Number(localStorage.getItem("monthlyBudget")) || 0;

  const remaining = budget - monthTotal;

  // Display
  todayExpense.textContent = "₹" + todayTotal.toLocaleString("en-IN");

  monthExpense.textContent = "₹" + monthTotal.toLocaleString("en-IN");

  remainingBudget.textContent =
    "₹" + Math.max(remaining, 0).toLocaleString("en-IN");
}

// Run when page loads
updateExpenseSummary();
