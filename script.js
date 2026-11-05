// ==========================================
// Expense Manager Dashboard Script
// Supabase Integration
// ==========================================

// ==========================================
// Authentication Check
// ==========================================

const AUTH_API =
    "https://personal-expense-tracker-7qhy.onrender.com";

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
        console.error("Authentication check failed:", error);
        alert("Unable to verify your login. Please try again.");
        return false;
    }
}

const EXPENSE_API =
  "https://personal-expense-tracker-7qhy.onrender.com/api/expenses";
const INCOME_API =
  "https://personal-expense-tracker-7qhy.onrender.com/api/income";

let dashboardExpenses = [];
let dashboardIncomes = [];

let overviewChartInstance = null;
let categoryChartInstance = null;

// ==========================================
// Currency
// ==========================================


// ==========================================
// Currency Conversion System
// ==========================================

let exchangeRates = null;
let exchangeRateReady = false;

function getCurrency() {
    return localStorage.getItem("currency") || "INR";
}

const currencyLocales = {
    INR: "en-IN",
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB"
};

function convertAmount(amount) {
    const value = Number(amount || 0);
    const currency = getCurrency();

    if (currency === "INR") return value;

    if (!exchangeRateReady || !exchangeRates) {
        return value;
    }

    return value * (exchangeRates[currency] || 1);
}

function formatCurrency(amount) {
    const currency = getCurrency();

    // If rates are unavailable, show INR rather than a wrong conversion.
    const displayCurrency =
        currency === "INR" || !exchangeRateReady ? "INR" : currency;

    const convertedAmount =
        displayCurrency === "INR"
            ? Number(amount || 0)
            : convertAmount(amount);

    return new Intl.NumberFormat(
        currencyLocales[displayCurrency] || "en-IN",
        {
            style: "currency",
            currency: displayCurrency,
            maximumFractionDigits: 2
        }
    ).format(convertedAmount);
}

async function loadExchangeRates() {
    if (getCurrency() === "INR") {
        exchangeRateReady = true;
        return;
    }

    try {
        const response = await fetch(
            "https://open.er-api.com/v6/latest/INR"
        );

        if (!response.ok) {
            throw new Error("Could not fetch exchange rates");
        }

        const data = await response.json();

        if (data.result !== "success" || !data.rates) {
            throw new Error("Invalid exchange rate data");
        }

        exchangeRates = data.rates;
        exchangeRateReady = true;

        window.dispatchEvent(new Event("currencyRatesReady"));

    } catch (error) {
        console.error("Currency conversion error:", error);
        exchangeRateReady = false;
    }
}

window.currencyReady = loadExchangeRates();

window.getCurrency = getCurrency;
window.formatCurrency = formatCurrency;
window.convertAmount = convertAmount;


// ==========================================
// Sidebar Toggle
// ==========================================

const menuIcon = document.querySelector(".menu-icon");
const sidebar = document.querySelector(".sidebar");
const main = document.querySelector(".main");

if (menuIcon && sidebar && main) {
  menuIcon.addEventListener("click", () => {
    sidebar.classList.toggle("show");
    main.classList.toggle("shift");
  });
}

// ==========================================
// Active Sidebar Menu
// ==========================================

const menuItems = document.querySelectorAll(".menu li");

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    menuItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
  });
});

// ==========================================
// Greeting Date
// ==========================================

const dateElement = document.querySelector(".greeting p");

const today = new Date();

if (dateElement) {
  dateElement.textContent = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ==========================================
// Fetch Dashboard Data from Supabase
// ==========================================

async function fetchDashboardData() {
    await window.currencyReady;
  try {
    const [expenseResponse, incomeResponse] = await Promise.all([
      fetch(EXPENSE_API),
      fetch(INCOME_API),
    ]);

    if (!expenseResponse.ok || !incomeResponse.ok) {
      throw new Error("Unable to fetch dashboard data.");
    }

    const expenseResult = await expenseResponse.json();
    const incomeResult = await incomeResponse.json();

    // Convert database records into dashboard format
    dashboardExpenses = (expenseResult.data || []).map((expense) => ({
      id: expense.id,
      category: expense.category || "Other",
      amount: Number(expense.amount),
      date: expense.transaction_date,
      time: expense.transaction_time || "",
      notes: expense.notes || "",
    }));

    dashboardIncomes = (incomeResult.data || []).map((income) => ({
      id: income.id,
      source: income.category || "Income",
      amount: Number(income.amount),
      date: income.transaction_date,
      time: income.transaction_time || "",
      receivedFrom: income.received_from || "",
      notes: income.notes || "",
    }));

    // Update all dashboard sections
    updateDashboardSummary();
    updateOverviewChart();
    updateCategoryChart();
    updateRecentTransactions();
  } catch (error) {
    console.error("Dashboard loading error:", error);

    alert(
      "Unable to load dashboard data. Please check whether Flask is running.",
    );
  }
}

// ==========================================
// Update Dashboard Summary
// ==========================================

function updateDashboardSummary() {
  const totalExpense = dashboardExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );

  const totalIncome = dashboardIncomes.reduce(
    (total, income) => total + income.amount,
    0,
  );

  const balance = totalIncome - totalExpense;
  const savings = balance;

  const incomeElement = document.getElementById("dashboardIncome");
  const expenseElement = document.getElementById("dashboardExpense");
  const balanceElement = document.getElementById("dashboardBalance");
  const savingsElement = document.getElementById("dashboardSavings");

  if (incomeElement) {
    incomeElement.textContent = formatCurrency(totalIncome);
  }

  if (expenseElement) {
    expenseElement.textContent = formatCurrency(totalExpense);
  }

  if (balanceElement) {
    balanceElement.textContent = formatCurrency(balance);
  }

  if (savingsElement) {
    savingsElement.textContent = formatCurrency(savings);
  }
}

// ==========================================
// Monthly Overview Chart
// ==========================================

function updateOverviewChart() {
  const canvas = document.getElementById("overviewChart");

  if (!canvas || typeof Chart === "undefined") return;

  const monthlyIncome = new Array(12).fill(0);
  const monthlyExpense = new Array(12).fill(0);

  const currentYear = new Date().getFullYear();

  dashboardIncomes.forEach((income) => {
    const date = new Date(income.date + "T00:00:00");

    if (date.getFullYear() === currentYear) {
      monthlyIncome[date.getMonth()] += income.amount;
    }
  });

  dashboardExpenses.forEach((expense) => {
    const date = new Date(expense.date + "T00:00:00");

    if (date.getFullYear() === currentYear) {
      monthlyExpense[date.getMonth()] += expense.amount;
    }
  });

  if (overviewChartInstance) {
    overviewChartInstance.destroy();
  }

  overviewChartInstance = new Chart(canvas, {
    type: "line",

    data: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],

      datasets: [
        {
          label: "Income",
          data: monthlyIncome,
          borderColor: "#16a34a",
          backgroundColor: "rgba(22,163,74,.15)",
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: "#16a34a",
        },

        {
          label: "Expenses",
          data: monthlyExpense,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,.12)",
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: "#ef4444",
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "top",
        },
      },

      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// ==========================================
// Expense Category Chart
// ==========================================

function updateCategoryChart() {
  const canvas = document.getElementById("categoryChart");

  if (!canvas || typeof Chart === "undefined") return;

  const categoryTotals = {};

  dashboardExpenses.forEach((expense) => {
    const category = expense.category || "Others";

    categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
  });

  const categories = Object.keys(categoryTotals);
  const amounts = Object.values(categoryTotals);

  if (categories.length === 0) {
    categories.push("No Expenses");
    amounts.push(0);
  }

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  categoryChartInstance = new Chart(canvas, {
    type: "doughnut",

    data: {
      labels: categories,

      datasets: [
        {
          data: amounts,

          backgroundColor: [
            "#ef4444",
            "#3b82f6",
            "#8b5cf6",
            "#f59e0b",
            "#10b981",
            "#94a3b8",
            "#ec4899",
            "#14b8a6",
            "#6366f1",
            "#f97316",
          ],

          borderWidth: 0,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",

      animation: {
        animateRotate: true,
        duration: 1500,
      },

      plugins: {
        legend: {
          position: "right",
        },
      },
    },
  });
}

// ==========================================
// Recent Transactions
// ==========================================

function updateRecentTransactions() {
  const container = document.getElementById("recentTransactions");

  if (!container) return;

  const transactions = [
    ...dashboardIncomes.map((income) => ({
      category: income.source,
      description: income.receivedFrom || income.notes || "Income",
      date: income.date,
      time: income.time,
      amount: income.amount,
      type: "Income",
    })),

    ...dashboardExpenses.map((expense) => ({
      category: expense.category,
      description: expense.notes || "Expense",
      date: expense.date,
      time: expense.time,
      amount: expense.amount,
      type: "Expense",
    })),
  ];

  // Newest transactions first
  transactions.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || "00:00"}`);

    const dateB = new Date(`${b.date}T${b.time || "00:00"}`);

    return dateB - dateA;
  });

  // Display latest four transactions
  const recent = transactions.slice(0, 4);

  container.innerHTML = "";

  if (recent.length === 0) {
    container.innerHTML = `
            <div class="transaction">
                <div class="left">
                    <i class="fa-solid fa-receipt"></i>
                    <div>
                        <h4>No transactions</h4>
                        <small>Add an income or expense</small>
                    </div>
                </div>
            </div>
        `;

    return;
  }

  recent.forEach((transaction) => {
    const isIncome = transaction.type === "Income";

    const sign = isIncome ? "+" : "-";
    const amountClass = isIncome ? "green" : "red";

    let icon = "fa-solid fa-receipt";

    if (isIncome) {
      icon = "fa-solid fa-briefcase";
    } else if (transaction.category === "Food") {
      icon = "fa-solid fa-burger";
    } else if (transaction.category === "Transport") {
      icon = "fa-solid fa-car";
    } else if (transaction.category === "Shopping") {
      icon = "fa-solid fa-cart-shopping";
    }

    const date = new Date(transaction.date + "T00:00:00");

    const dateText = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const timeText = transaction.time ? " • " + transaction.time : "";

    const transactionElement = document.createElement("div");

    transactionElement.className = "transaction";

    const left = document.createElement("div");
    left.className = "left";

    const iconElement = document.createElement("i");
    iconElement.className = icon;

    const details = document.createElement("div");

    const heading = document.createElement("h4");
    heading.textContent = transaction.category || "Other";

    const description = document.createElement("small");
    description.textContent = `${transaction.description} • ${dateText}${timeText}`;

    details.append(heading, description);
    left.append(iconElement, details);

    const amountElement = document.createElement("span");
    amountElement.className = amountClass;
    amountElement.textContent =
      sign + formatCurrency(Math.abs(transaction.amount));

    transactionElement.append(left, amountElement);

    container.appendChild(transactionElement);
  });
}

// ==========================================
// Card Hover Animation
// ==========================================

const cards = document.querySelectorAll(".card");

cards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-8px)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0px)";
  });
});

// ==========================================
// Notification Bell
// ==========================================

const bell = document.querySelector(".fa-bell");

if (bell) {
  bell.addEventListener("click", () => {
    alert("No new notifications.");
  });
}

// ==========================================
// Profile
// ==========================================

const profile = document.querySelector(".profile");

if (profile) {
  profile.addEventListener("click", () => {
    alert("Profile menu coming soon.");
  });
}

// ==========================================
// Initial Dashboard Load
// ==========================================

// ==========================================
// Initial Dashboard Load
// ==========================================

async function initializeDashboard() {
    const isLoggedIn = await checkLogin();

    if (!isLoggedIn) return;

    updateGlobalProfile();
    await fetchDashboardData();
}

initializeDashboard();


// Refresh dashboard when transactions change
window.addEventListener("storage", function (event) {
    if (event.key === "transactionsUpdated") {
        fetchDashboardData();
    }
});

window.addEventListener("transactionsUpdated", function () {
    fetchDashboardData();
});

// ==========================================
// Global Profile Name and Dashboard Greeting
// ==========================================

function updateGlobalProfile() {
    const savedName = localStorage.getItem("profileName") || "Hiten";

    // Update profile name
    document.querySelectorAll("#topProfileName").forEach(element => {
        element.textContent = savedName;
    });

    // Update avatar initial
    document.querySelectorAll(".profile .avatar").forEach(element => {
        element.textContent = savedName.charAt(0).toUpperCase();
    });

    // Update dashboard greeting
    const greetingHeading = document.querySelector(".greeting h1");

    if (greetingHeading) {
        const hour = new Date().getHours();

        let greeting = "Good Evening";

        if (hour < 12) {
            greeting = "Good Morning";
        } else if (hour < 17) {
            greeting = "Good Afternoon";
        }

        greetingHeading.textContent = `${greeting}, ${savedName}`;
    }
}

document.addEventListener("DOMContentLoaded", updateGlobalProfile);



// ==========================================
// Global Theme System
// ==========================================

function applyTheme(theme) {
    const selectedTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", selectedTheme);

    localStorage.setItem("theme", selectedTheme);
}

window.applyTheme = applyTheme;

// Apply saved theme on every page
applyTheme(localStorage.getItem("theme") || "light");
