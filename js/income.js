// ==========================================
// Authentication Check
// ==========================================

async function checkLogin() {
  try {
    const response = await fetch(`${AUTH_API}/api/me`, {
      method: "GET",
      credentials: "include",
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

  const previousMonthDate = new Date(
    currentYear,
    currentMonth - 1,
    1
  );

  const previousMonth = previousMonthDate.getMonth();
  const previousYear = previousMonthDate.getFullYear();

  // Today's income
  const todayTotal = incomes
    .filter(income => income.date === today)
    .reduce((total, income) => total + income.amount, 0);

  // Current month's income
  const monthTotal = incomes
    .filter(income => {
      const date = new Date(income.date + "T00:00:00");

      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce((total, income) => total + income.amount, 0);

  // Previous month's income
  const previousMonthTotal = incomes
    .filter(income => {
      const date = new Date(income.date + "T00:00:00");

      return (
        date.getMonth() === previousMonth &&
        date.getFullYear() === previousYear
      );
    })
    .reduce((total, income) => total + income.amount, 0);

  // Total income
  const total = incomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  // Highest income
  const highest = incomes.length
    ? Math.max(...incomes.map(income => income.amount))
    : 0;

  // Calculate growth
  let growthText;

  if (previousMonthTotal === 0) {
    growthText = monthTotal > 0 ? "New" : "0%";
  } else {
    const growth =
      ((monthTotal - previousMonthTotal) / previousMonthTotal) * 100;

    growthText =
      `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`;
  }

  // Update bottom summary
  todayIncome.textContent = formatCurrency(todayTotal);
  monthIncome.textContent = formatCurrency(monthTotal);
  totalIncomeElement.textContent = formatCurrency(total);
  highestIncome.textContent = formatCurrency(highest);

  // Update top quick statistics
  if (quickMonthIncome) {
    quickMonthIncome.textContent = formatCurrency(monthTotal);
  }

  if (incomeGrowth) {
    incomeGrowth.textContent = growthText;
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

  await getIncomes();
}

initializeIncomePage();


// ==========================================
// Update Profile Information
// ==========================================

function updateIncomeProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const name = user.full_name || user.name || "User";

  const profileName = document.getElementById("profileName");
  const profileAvatar = document.getElementById("profileAvatar");

  if (profileName) {
    profileName.textContent = name;
  }

  if (profileAvatar) {
    profileAvatar.textContent = name.charAt(0).toUpperCase();
  }
}