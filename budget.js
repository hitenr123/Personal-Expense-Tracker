
// ==========================================
// Budget Page - Supabase Integration
// ==========================================

const API_URL = "https://personal-expense-tracker-7qhy.onrender.com/api/budget";

const budgetForm = document.getElementById("budgetForm");
const budgetInput = document.getElementById("budgetAmount");

const monthlyBudget = document.getElementById("monthlyBudget");
const budgetSpent = document.getElementById("budgetSpent");
const budgetRemaining = document.getElementById("budgetRemaining");

const budgetPercentage = document.getElementById("budgetPercentage");
const budgetProgressBar = document.getElementById("budgetProgressBar");

// ==========================================
// Currency Formatter
// ==========================================

function formatBudgetCurrency(amount) {
    if (typeof window.formatCurrency === "function") {
        return window.formatCurrency(amount);
    }

    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

// ==========================================
// Get Current Month
// ==========================================

function getBudgetMonth() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}

// ==========================================
// Load Budget From Database
// ==========================================

async function loadBudget() {
    try {
        const response = await fetch(
            `${API_URL}?month=${getBudgetMonth()}`
        );

        if (!response.ok) {
            throw new Error("Failed to load budget");
        }

        const result = await response.json();

        if (result.status !== "success") {
            throw new Error(result.message || "Could not load budget");
        }

        const data = result.data;

        // Update summary cards
        monthlyBudget.textContent = formatBudgetCurrency(data.budget);
        budgetSpent.textContent = formatBudgetCurrency(data.spent);
        budgetRemaining.textContent = formatBudgetCurrency(data.remaining);

        // Update input
        budgetInput.value = data.budget > 0 ? data.budget : "";

        // Update progress
        const percentage = Number(data.percentage || 0);

        budgetPercentage.textContent = percentage + "%";

        budgetProgressBar.style.width =
            Math.min(percentage, 100) + "%";

        // Change progress color when budget is exceeded
        if (percentage >= 100) {
            budgetProgressBar.style.background = "#ef4444";
        } else if (percentage >= 80) {
            budgetProgressBar.style.background = "#f59e0b";
        } else {
            budgetProgressBar.style.background = "#16a34a";
        }

    } catch (error) {
        console.error("Budget loading error:", error);
        alert("Unable to load budget. Please try again.");
    }
}

// ==========================================
// Save Budget To Supabase
// ==========================================

budgetForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const budget = Number(budgetInput.value);

    if (!Number.isFinite(budget) || budget <= 0) {
        alert("Please enter a valid budget.");
        return;
    }

    const saveButton = budgetForm.querySelector(".save-btn");

    saveButton.disabled = true;
    saveButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: budget,
                month: getBudgetMonth()
            })
        });

        const result = await response.json();

        if (!response.ok || result.status !== "success") {
            throw new Error(result.error || result.message || "Failed to save budget");
        }

        alert("Monthly budget saved successfully!");

        // Reload latest database values
        await loadBudget();

    } catch (error) {
        console.error("Budget saving error:", error);
        alert(error.message || "Unable to save budget.");
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Save Budget';
    }
});

// ==========================================
// Reset Input
// ==========================================

budgetForm.addEventListener("reset", function() {
    setTimeout(() => {
        loadBudget();
    }, 0);
});

// ==========================================
// Initial Load
// ==========================================

document.addEventListener("DOMContentLoaded", loadBudget);

// Refresh budget when transactions are updated
window.addEventListener("storage", function (event) {
    if (event.key === "transactionsUpdated") {
        loadBudget();
    }
});

window.addEventListener("transactionsUpdated", function () {
    loadBudget();
});

// Refresh budget when transaction data changes
window.addEventListener("storage", function (event) {
    if (event.key === "transactionsUpdated") {
        loadBudget();
    }
});

