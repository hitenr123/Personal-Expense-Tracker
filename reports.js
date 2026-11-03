const API_URL = "http://127.0.0.1:5000/api";

let reportChart = null;
let expensePieChart = null;
let allIncomes = [];
let allExpenses = [];
let currentStartDate = "";
let currentEndDate = "";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPDFCurrency(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getTotals(incomes, expenses) {
  const totalIncome = incomes.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const totalExpense = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  return { totalIncome, totalExpense, balance, savingsRate };
}

function updateReportCards(incomes, expenses) {
  const totals = getTotals(incomes, expenses);

  document.getElementById("reportIncome").textContent = formatCurrency(
    totals.totalIncome,
  );

  document.getElementById("reportExpense").textContent = formatCurrency(
    totals.totalExpense,
  );

  document.getElementById("reportBalance").textContent = formatCurrency(
    totals.balance,
  );

  document.getElementById("reportSavings").textContent =
    totals.savingsRate.toFixed(1) + "%";

  document.getElementById("summaryIncome").textContent = formatCurrency(
    totals.totalIncome,
  );

  document.getElementById("summaryExpense").textContent = formatCurrency(
    totals.totalExpense,
  );

  document.getElementById("summaryBalance").textContent = formatCurrency(
    totals.balance,
  );
}

function updateReportChart(incomes, expenses, startDate, endDate, period) {
  const labels = [];
  const incomeData = [];
  const expenseData = [];

  if (period === "yearly") {
    const year = parseDate(startDate).getFullYear();

    const monthNames = [
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
    ];

    for (let month = 0; month < 12; month++) {
      labels.push(monthNames[month]);

      const monthlyIncome = incomes
        .filter((item) => {
          const date = parseDate(item.transaction_date);
          return date.getFullYear() === year && date.getMonth() === month;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      const monthlyExpense = expenses
        .filter((item) => {
          const date = parseDate(item.transaction_date);
          return date.getFullYear() === year && date.getMonth() === month;
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      incomeData.push(monthlyIncome);
      expenseData.push(monthlyExpense);
    }
  } else {
    let current = parseDate(startDate);
    const end = parseDate(endDate);

    while (current <= end) {
      const dateString = getLocalDate(current);

      labels.push(
        current.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
      );

      const dayIncome = incomes
        .filter((item) => item.transaction_date === dateString)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      const dayExpense = expenses
        .filter((item) => item.transaction_date === dateString)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      incomeData.push(dayIncome);
      expenseData.push(dayExpense);

      current.setDate(current.getDate() + 1);
    }
  }

  const ctx = document.getElementById("reportChart");

  if (reportChart) {
    reportChart.destroy();
  }

  reportChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          backgroundColor: "#22c55e",
        },
        {
          label: "Expenses",
          data: expenseData,
          backgroundColor: "#ef4444",
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

function updateExpensePieChart(expenses) {
  const categoryTotals = {};

  expenses.forEach((expense) => {
    const category = expense.category || "Other";
    const amount = Number(expense.amount) || 0;

    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  });

  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);

  const ctx = document.getElementById("expensePieChart");

  if (expensePieChart) {
    expensePieChart.destroy();
  }

  expensePieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#3b82f6",
            "#22c55e",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#ec4899",
            "#14b8a6",
            "#64748b",
          ],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.label + ": " + formatCurrency(context.raw);
            },
          },
        },
      },
    },
  });
}

function applyReportFilter() {
  const period = document.getElementById("reportPeriod").value;

  const today = new Date();
  let startDate;
  let endDate;

  if (period === "daily") {
    startDate = getLocalDate(today);
    endDate = startDate;
  } else if (period === "weekly") {
    const day = today.getDay();
    const difference = day === 0 ? 6 : day - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - difference);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    startDate = getLocalDate(monday);
    endDate = getLocalDate(sunday);
  } else if (period === "monthly") {
    startDate = getLocalDate(
      new Date(today.getFullYear(), today.getMonth(), 1),
    );

    endDate = getLocalDate(
      new Date(today.getFullYear(), today.getMonth() + 1, 0),
    );
  } else if (period === "yearly") {
    startDate = getLocalDate(new Date(today.getFullYear(), 0, 1));

    endDate = getLocalDate(new Date(today.getFullYear(), 11, 31));
  } else if (period === "custom") {
    startDate = document.getElementById("reportStartDate").value;
    endDate = document.getElementById("reportEndDate").value;

    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    if (startDate > endDate) {
      alert("Start date cannot be after end date.");
      return;
    }
  }

  currentStartDate = startDate;
  currentEndDate = endDate;

  const filteredIncomes = allIncomes.filter(
    (item) =>
      item.transaction_date >= startDate && item.transaction_date <= endDate,
  );

  const filteredExpenses = allExpenses.filter(
    (item) =>
      item.transaction_date >= startDate && item.transaction_date <= endDate,
  );

  updateReportCards(filteredIncomes, filteredExpenses);
  updateExpensePieChart(filteredExpenses);
  updateReportChart(
    filteredIncomes,
    filteredExpenses,
    startDate,
    endDate,
    period,
  );
}

async function loadReports() {
  try {
    const [incomeResponse, expenseResponse] = await Promise.all([
      fetch(`${API_URL}/income`),
      fetch(`${API_URL}/expenses`),
    ]);

    if (!incomeResponse.ok || !expenseResponse.ok) {
      throw new Error("Could not load report data.");
    }

    const incomeResult = await incomeResponse.json();
    const expenseResult = await expenseResponse.json();

    allIncomes = incomeResult.data || [];
    allExpenses = expenseResult.data || [];

    applyReportFilter();
  } catch (error) {
    console.error("Reports Error:", error);
    alert("Unable to load reports. Please check your backend.");
  }
}

// Show/hide custom date fields
document.getElementById("reportPeriod").addEventListener("change", function () {
  const customFields = document.getElementById("customDateFields");

  customFields.style.display = this.value === "custom" ? "flex" : "none";
});

// Apply selected filter
document
  .getElementById("applyReportFilter")
  .addEventListener("click", applyReportFilter);

loadReports();

async function registerUnicodeFont(doc) {
    const response = await fetch("./fonts/NotoSans[wdth,wght].ttf");

    if (!response.ok) {
        throw new Error("Could not load NotoSans.ttf");
    }

    const fontBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(fontBuffer);

    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    const base64Font = btoa(binary);

    doc.addFileToVFS("NotoSans[wdth,wght].ttf", base64Font);
    doc.addFont("NotoSans[wdth,wght].ttf", "NotoSans", "normal");
    doc.setFont("NotoSans", "normal");
}

async function downloadReportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  await registerUnicodeFont(doc);

  const period = document.getElementById("reportPeriod").value;
  const totals = getTotals(
    allIncomes.filter((item) => {
      const date = item.transaction_date;
      return date >= currentStartDate && date <= currentEndDate;
    }),
    allExpenses.filter((item) => {
      const date = item.transaction_date;
      return date >= currentStartDate && date <= currentEndDate;
    }),
  );

  doc.setFontSize(20);
  doc.text("Smart Expense Tracker", 20, 20);

  doc.setFontSize(15);
  doc.text("Financial Report", 20, 32);

  doc.setFontSize(11);
  doc.text("Report Period: " + period.toUpperCase(), 20, 45);
  doc.text("Generated On: " + getLocalDate(), 20, 53);

  doc.text("Total Income: " + formatCurrency(totals.totalIncome), 20, 70);
  doc.text("Total Expenses: " + formatCurrency(totals.totalExpense), 20, 80);
  doc.text("Balance: " + formatCurrency(totals.balance), 20, 90);
  doc.text("Savings Rate: " + totals.savingsRate.toFixed(1) + "%", 20, 100);

  // Add expense category breakdown
  doc.setFontSize(14);
  doc.text("Expense Breakdown by Category", 20, 120);

  const categoryTotals = {};

  allExpenses
    .filter(
      (item) =>
        item.transaction_date >= currentStartDate &&
        item.transaction_date <= currentEndDate,
    )
    .forEach((item) => {
      const category = item.category || "Other";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + Number(item.amount || 0);
    });

  let y = 132;

  doc.setFontSize(11);

  Object.entries(categoryTotals).forEach(([category, amount]) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(`${category}: ${formatCurrency(amount)}`, 20, y);

    y += 9;
  });

  // Add bar chart image
  const barCanvas = document.getElementById("reportChart");

  if (barCanvas) {
    doc.addPage();
    doc.setFontSize(15);
    doc.text("Income vs Expenses Chart", 20, 20);

    const barImage = barCanvas.toDataURL("image/png");
    doc.addImage(barImage, "PNG", 15, 35, 180, 100);
  }

  // Add pie chart image
  const pieCanvas = document.getElementById("expensePieChart");

  if (pieCanvas) {
    if (!barCanvas) {
      doc.addPage();
    }

    doc.setFontSize(15);
    doc.text("Expense Category Breakdown", 20, 155);

    const pieImage = pieCanvas.toDataURL("image/png");
    doc.addImage(pieImage, "PNG", 40, 165, 130, 110);
  }

  doc.save("Expense_Report.pdf");
}

// Connect download button
document
  .getElementById("downloadReportPDF")
  .addEventListener("click", downloadReportPDF);


// Prepare filtered transactions for export
function getReportExportData() {
    const transactions = [
        ...allIncomes.map(item => ({ ...item, type: "Income" })),
        ...allExpenses.map(item => ({ ...item, type: "Expense" }))
    ];

    return transactions
        .filter(item => {
            const date = item.transaction_date;
            return date >= currentStartDate && date <= currentEndDate;
        })
        .sort((a, b) =>
            a.transaction_date.localeCompare(b.transaction_date)
        )
        .map(item => ({
            Type: item.type,
            Date: item.transaction_date || "",
            Time: item.transaction_time || "",
            Amount: Number(item.amount) || 0,
            Category: item.category || "",
            "Payment Method": item.payment_method || "",
            Account: item.account || "",
            Notes: item.notes || ""
        }));
}

// Download CSV
function downloadReportCSV() {
    const data = getReportExportData();

    if (data.length === 0) {
        alert("No transactions found for the selected period.");
        return;
    }

    const headers = Object.keys(data[0]);

    const csvRows = [
        headers.join(","),
        ...data.map(row =>
            headers.map(header =>
                `"${String(row[header]).replace(/"/g, '""')}"`
            ).join(",")
        )
    ];

    const blob = new Blob(
        ["\uFEFF" + csvRows.join("\n")],
        { type: "text/csv;charset=utf-8;" }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Expense_Report.csv";
    link.click();

    URL.revokeObjectURL(link.href);
}

// Download Excel
function downloadReportExcel() {
    const data = getReportExportData();

    if (data.length === 0) {
        alert("No transactions found for the selected period.");
        return;
    }

    if (typeof XLSX === "undefined") {
        alert("Excel library not loaded.");
        return;
    }

    const workbook = XLSX.utils.book_new();

    // Separate income and expenses
    const incomeData = data.filter(item => item.Type === "Income");
    const expenseData = data.filter(item => item.Type === "Expense");

    const totalIncome = incomeData.reduce(
        (sum, item) => sum + item.Amount, 0
    );

    const totalExpense = expenseData.reduce(
        (sum, item) => sum + item.Amount, 0
    );

    const balance = totalIncome - totalExpense;

    const savingsRate = totalIncome > 0
        ? (balance / totalIncome) * 100
        : 0;

    // Sheet 1: Summary
    const summary = [
        ["Expense Manager Report"],
        ["Start Date", currentStartDate],
        ["End Date", currentEndDate],
        [],
        ["Particulars", "Amount"],
        ["Total Income", totalIncome],
        ["Total Expenses", totalExpense],
        ["Balance", balance],
        ["Savings Rate (%)", Number(savingsRate.toFixed(2))]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Sheet 2: Income
    const incomeSheet = XLSX.utils.json_to_sheet(incomeData);
    XLSX.utils.book_append_sheet(workbook, incomeSheet, "Income");

    // Sheet 3: Expenses
    const expensesSheet = XLSX.utils.json_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(workbook, expensesSheet, "Expenses");

    // Sheet 4: Category Breakdown
    const categoryTotals = {};

    expenseData.forEach(item => {
        const category = item.Category || "Other";
        categoryTotals[category] =
            (categoryTotals[category] || 0) + item.Amount;
    });

    const categoryData = Object.entries(categoryTotals).map(
        ([category, amount]) => ({
            Category: category,
            Total: amount
        })
    );

    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(
        workbook,
        categorySheet,
        "Category Breakdown"
    );

    // Download workbook
    XLSX.writeFile(workbook, "Expense_Report.xlsx");
}

// Button events
document.getElementById("downloadReportCSV")
    .addEventListener("click", downloadReportCSV);

document.getElementById("downloadReportExcel")
    .addEventListener("click", downloadReportExcel);