// ==========================================
// Expense Manager Dashboard Script
// ==========================================

function getCurrency() {
    return localStorage.getItem("currency") || "₹";
}

function formatCurrency(amount) {
    return getCurrency() + Number(amount || 0).toLocaleString("en-IN");
}

// -------------------------------
// Sidebar Toggle
// -------------------------------

const menuIcon = document.querySelector(".menu-icon");
const sidebar = document.querySelector(".sidebar");
const main = document.querySelector(".main");

if (menuIcon) {
  menuIcon.addEventListener("click", () => {
    sidebar.classList.toggle("show");
    main.classList.toggle("shift");
  });
}

// -------------------------------
// Active Sidebar Menu
// -------------------------------

const menuItems = document.querySelectorAll(".menu li");

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    menuItems.forEach((i) => i.classList.remove("active"));

    item.classList.add("active");
  });
});

// -------------------------------
// Greeting Date
// -------------------------------

const dateElement = document.querySelector(".greeting p");

const options = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

const today = new Date();

if (dateElement) {
  dateElement.innerHTML = today.toLocaleDateString("en-IN", options);
}

// ==========================================
// Dynamic Monthly Overview Chart
// ==========================================

const overviewCanvas = document.getElementById("overviewChart");

if (overviewCanvas) {
  const expenses = getDashboardExpenses();

  const incomes = getDashboardIncomes();

  const monthlyIncome = new Array(12).fill(0);

  const monthlyExpense = new Array(12).fill(0);

  const currentYear = new Date().getFullYear();

  // -------------------------------
  // Calculate Income by Month
  // -------------------------------

  incomes.forEach((income) => {
    const date = new Date(income.date);

    if (date.getFullYear() === currentYear) {
      const month = date.getMonth();

      monthlyIncome[month] += Number(income.amount);
    }
  });

  // -------------------------------
  // Calculate Expenses by Month
  // -------------------------------

  expenses.forEach((expense) => {
    const date = new Date(expense.date);

    if (date.getFullYear() === currentYear) {
      const month = date.getMonth();

      monthlyExpense[month] += Number(expense.amount);
    }
  });

  // -------------------------------
  // Create Chart
  // -------------------------------

  new Chart(overviewCanvas, {
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
// Dynamic Expense Category Chart
// ==========================================

const categoryCanvas =
    document.getElementById("categoryChart");

if (categoryCanvas) {

    const expenses =
        getDashboardExpenses();

    const categoryTotals = {};


    // -------------------------------
    // Calculate Category Totals
    // -------------------------------

    expenses.forEach(expense => {

        const category =
            expense.category || "Others";

        const amount =
            Number(expense.amount) || 0;

        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }

        categoryTotals[category] += amount;

    });


    // -------------------------------
    // Prepare Chart Data
    // -------------------------------

    const categories =
        Object.keys(categoryTotals);

    const amounts =
        Object.values(categoryTotals);


    // If no expenses exist
    if (categories.length === 0) {

        categories.push("No Expenses");
        amounts.push(0);

    }


    // -------------------------------
    // Create Doughnut Chart
    // -------------------------------

    new Chart(categoryCanvas, {

        type: "doughnut",

        data: {

            labels: categories,

            datasets: [{

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
                    "#f97316"
                ],

                borderWidth: 0

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "70%",

            animation: {

                animateRotate: true,

                duration: 1500

            },

            plugins: {

                legend: {

                    position: "right"

                }

            }

        }

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
// Dynamic Dashboard Data
// ==========================================

function getDashboardExpenses() {
  return JSON.parse(localStorage.getItem("expenses")) || [];
}

function getDashboardIncomes() {
  return JSON.parse(localStorage.getItem("incomes")) || [];
}

// ==========================================
// Update Dashboard Summary
// ==========================================

function updateDashboardSummary() {
  const expenses = getDashboardExpenses();

  const incomes = getDashboardIncomes();

  const totalExpense = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );

  const totalIncome = incomes.reduce(
    (total, income) => total + Number(income.amount),
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
// Run Dashboard Update
// ==========================================

updateDashboardSummary();

// ==========================================
// Dynamic Recent Transactions
// ==========================================

function updateRecentTransactions() {
  const container = document.getElementById("recentTransactions");

  if (!container) {
    return;
  }

  const expenses = getDashboardExpenses();

  const incomes = getDashboardIncomes();

  const transactions = [
    ...incomes.map((income) => ({
      category: income.source,
      description: income.receivedFrom || income.notes || "Income",
      date: income.date,
      time: income.time || "",
      amount: Number(income.amount),
      type: "Income",
    })),

    ...expenses.map((expense) => ({
      category: expense.category,
      description: expense.notes || "Expense",
      date: expense.date,
      time: expense.time || "",
      amount: Number(expense.amount),
      type: "Expense",
    })),
  ];

  // Newest first
  transactions.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || "00:00"}`);

    const dateB = new Date(`${b.date}T${b.time || "00:00"}`);

    return dateB - dateA;
  });

  // Show latest 4
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

    if (transaction.type === "Income") {
      icon = "fa-solid fa-briefcase";
    } else if (transaction.category === "Food") {
      icon = "fa-solid fa-burger";
    } else if (transaction.category === "Transport") {
      icon = "fa-solid fa-car";
    } else if (transaction.category === "Shopping") {
      icon = "fa-solid fa-cart-shopping";
    }

    const date = new Date(transaction.date);

    const dateText = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const timeText = transaction.time ? " • " + transaction.time : "";

    const transactionElement = document.createElement("div");

    transactionElement.className = "transaction";

    transactionElement.innerHTML = `
            <div class="left">

                <i class="${icon}"></i>

                <div>
                    <h4>
                        ${transaction.category}
                    </h4>

                    <small>
                        ${transaction.description}
                        • ${dateText}${timeText}
                    </small>
                </div>

            </div>

            <span class="${amountClass}">
                ${sign}₹${Math.abs(transaction.amount).toLocaleString("en-IN")}
            </span>
        `;

    container.appendChild(transactionElement);
  });
}

updateRecentTransactions();
