// ==========================================
// Authentication Check
// ==========================================

async function checkLogin() {
  try {
    const response = await fetch(`${AUTH_API}/api/me`, {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      localStorage.removeItem("user");
      window.location.replace("login.html");
      return false;
    }

    const data = await response.json();

    if (data.status !== "success" || !data.user) {
      localStorage.removeItem("user");
      window.location.replace("login.html");
      return false;
    }

    localStorage.setItem("user", JSON.stringify(data.user));

    return true;

  } catch (error) {
    console.error("Authentication error:", error);
    alert("Unable to verify login. Please try again.");
    return false;
  }
}

// ==========================================
// Income Page - Supabase Integration
// ==========================================

const API_URL = "https://personal-expense-tracker-7qhy.onrender.com/api/income";

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

// Summary elements
const todayIncome = document.getElementById("todayIncome");
const monthIncome = document.getElementById("monthIncome");
const totalIncomeElement = document.getElementById("totalIncome");
const highestIncome = document.getElementById("highestIncome");

// Store income records fetched from the backend
let incomes = [];

// ==========================================
// Local Date and Time
// ==========================================

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function setDefaultDateTime() {
  dateInput.value = getLocalDate();

  timeInput.value = new Date().toTimeString().slice(0, 5);
}

setDefaultDateTime();

// ==========================================
// Fetch Incomes From Supabase
// ==========================================

async function getIncomes() {
  try {
    const response = await fetch(API_URL);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to fetch income records.");
    }

    // Convert database fields into frontend fields
    incomes = (result.data || []).map((item) => ({
      id: item.id,
      amount: Number(item.amount),
      source: item.category,
      payment: item.payment_method,
      account: item.account,
      date: item.transaction_date,
      time: item.transaction_time,
      receivedFrom: item.received_from,
      notes: item.notes,
      tags: item.tags,
      recurring: item.is_recurring,
      attachment: item.receipt_filename,
    }));

    updateIncomeSummary();
  } catch (error) {
    console.error("Income fetch error:", error);
    alert("Unable to load income records. Please check your backend.");
  }
}

// ==========================================
// Update Income Summary
// ==========================================

function updateIncomeSummary() {
  const today = getLocalDate();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Today's income
  const todayTotal = incomes
    .filter((income) => income.date === today)
    .reduce((total, income) => total + income.amount, 0);

  // This month's income
  const monthTotal = incomes
    .filter((income) => {
      const date = new Date(income.date + "T00:00:00");

      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    })
    .reduce((total, income) => total + income.amount, 0);

  // Total income
  const total = incomes.reduce((sum, income) => sum + income.amount, 0);

  // Highest income
  const highest =
    incomes.length > 0
      ? Math.max(...incomes.map((income) => income.amount))
      : 0;

  todayIncome.textContent = formatCurrency(todayTotal);
  monthIncome.textContent = formatCurrency(monthTotal);
  totalIncomeElement.textContent = formatCurrency(total);
  highestIncome.textContent = formatCurrency(highest);
}

// ==========================================
// Save Income To Supabase
// ==========================================

incomeForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const amount = Number(amountInput.value);

  if (!amount || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  if (!sourceSelect.value || sourceSelect.value === "Select Source") {
    alert("Please select an income source.");
    return;
  }

  if (!dateInput.value) {
    alert("Please select a date.");
    return;
  }

  const income = {
    amount: amount,
    category: sourceSelect.value,
    payment:
      paymentSelect.value === "Select Method" ? null : paymentSelect.value,
    account: accountSelect.value,
    date: dateInput.value,
    time: timeInput.value,
    receivedFrom: receivedFromInput.value,
    notes: notesInput.value,
    tags: tagsInput.value,
    recurring: recurringInput.checked,
    attachment: attachmentInput.files.length
      ? attachmentInput.files[0].name
      : "",
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(income),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save income.");
    }

    alert("Income saved successfully!");

    incomeForm.reset();

    setDefaultDateTime();

    // Reload income records and update summaries
    await getIncomes();
  } catch (error) {
    console.error("Income save error:", error);
    alert("Unable to save income: " + error.message);
  }
});

// ==========================================
// Initial Load
// ==========================================

async function initializeIncomePage() {
  const isLoggedIn = await checkLogin();

  if (!isLoggedIn) return;

  await getIncomes();
}

initializeIncomePage();