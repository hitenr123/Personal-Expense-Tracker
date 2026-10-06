const reportIncome = document.getElementById("reportIncome");
const reportExpense = document.getElementById("reportExpense");
const reportBalance = document.getElementById("reportBalance");
const reportSavings = document.getElementById("reportSavings");

const summaryIncome = document.getElementById("summaryIncome");
const summaryExpense = document.getElementById("summaryExpense");
const summaryBalance = document.getElementById("summaryBalance");

function getReportIncomes() {
  return JSON.parse(localStorage.getItem("incomes")) || [];
}

function getReportExpenses() {
  return JSON.parse(localStorage.getItem("expenses")) || [];
}

function updateReports() {
  const incomes = getReportIncomes();
  const expenses = getReportExpenses();

  const totalIncome = incomes.reduce(
    (total, income) => total + Number(income.amount || 0),
    0,
  );

  const totalExpense = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0,
  );

  const balance = totalIncome - totalExpense;

  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  reportIncome.textContent = formatCurrency(totalIncome);
  reportExpense.textContent = formatCurrency(totalExpense);
  reportBalance.textContent = formatCurrency(balance);

  reportSavings.textContent = savingsRate.toFixed(1) + "%";

  summaryIncome.textContent = formatCurrency(totalIncome);
  summaryExpense.textContent = formatCurrency(totalExpense);
  summaryBalance.textContent = formatCurrency(balance);
}

updateReports();

const reportCanvas = document.getElementById("reportChart");

if (reportCanvas) {
  const incomes = getReportIncomes();
  const expenses = getReportExpenses();

  const monthlyIncome = new Array(12).fill(0);
  const monthlyExpense = new Array(12).fill(0);

  const currentYear = new Date().getFullYear();

  incomes.forEach((income) => {
    const date = new Date(income.date);

    if (date.getFullYear() === currentYear) {
      monthlyIncome[date.getMonth()] += Number(income.amount || 0);
    }
  });

  expenses.forEach((expense) => {
    const date = new Date(expense.date);

    if (date.getFullYear() === currentYear) {
      monthlyExpense[date.getMonth()] += Number(expense.amount || 0);
    }
  });

  new Chart(reportCanvas, {
    type: "bar",

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
        },

        {
          label: "Expenses",
          data: monthlyExpense,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
