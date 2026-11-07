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
const quickMonthIncome = document.getElementById("quickMonthIncome");
const incomeGrowth = document.getElementById("incomeGrowth");

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
// Update Profile Information
// ==========================================

function updateIncomeProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const name = user.full_name || localStorage.getItem("profileName") || "User";

  const profileName = document.getElementById("profileName");
  const profileAvatar = document.getElementById("profileAvatar");

  if (profileName) {
    profileName.textContent = name;
  }

  if (profileAvatar) {
    profileAvatar.textContent = name.charAt(0).toUpperCase();
  }
}

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

  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);

  const previousMonth = previousMonthDate.getMonth();
  const previousYear = previousMonthDate.getFullYear();

  const todayTotal = incomes
    .filter((income) => income.date === today)
    .reduce((total, income) => total + income.amount, 0);

  const monthTotal = incomes
    .filter((income) => {
      const date = new Date(income.date + "T00:00:00");

      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    })
    .reduce((total, income) => total + income.amount, 0);

  const previousMonthTotal = incomes
    .filter((income) => {
      const date = new Date(income.date + "T00:00:00");

      return (
        date.getMonth() === previousMonth && date.getFullYear() === previousYear
      );
    })
    .reduce((total, income) => total + income.amount, 0);

  const total = incomes.reduce((sum, income) => sum + income.amount, 0);

  const highest =
    incomes.length > 0
      ? Math.max(...incomes.map((income) => income.amount))
      : 0;

  // Calculate monthly growth
  let growth = "0%";

  if (previousMonthTotal === 0 && monthTotal > 0) {
    growth = "New";
  } else if (previousMonthTotal > 0) {
    const percentage =
      ((monthTotal - previousMonthTotal) / previousMonthTotal) * 100;

    growth = `${percentage > 0 ? "+" : ""}${percentage.toFixed(1)}%`;
  }

  // Bottom summary cards
  if (todayIncome) todayIncome.textContent = formatCurrency(todayTotal);
  if (monthIncome) monthIncome.textContent = formatCurrency(monthTotal);
  if (totalIncomeElement)
    totalIncomeElement.textContent = formatCurrency(total);
  if (highestIncome) highestIncome.textContent = formatCurrency(highest);

  // Top quick statistics
  if (quickMonthIncome) {
    quickMonthIncome.textContent = formatCurrency(monthTotal);
  }

  if (incomeGrowth) {
    incomeGrowth.textContent = growth;
  }
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

  updateIncomeProfile();

  await window.currencyReady;

  updateCurrencySymbols();

  await getIncomes();
}

initializeIncomePage();