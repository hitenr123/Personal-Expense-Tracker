
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
// Budget Page - API Integration
// ==========================================

const API_URL = "https://personal-expense-tracker-7qhy.onrender.com/api/budget";

const budgetForm = document.getElementById("budgetForm");
const budgetInput = document.getElementById("budgetAmount");

const monthlyBudget = document.getElementById("monthlyBudget");
const budgetSpent = document.getElementById("budgetSpent");
const budgetRemaining = document.getElementById("budgetRemaining");

const budgetPercentage = document.getElementById("budgetPercentage");
const budgetProgressBar = document.getElementById("budgetProgressBar");

// Category budget elements
const categoryBudgetForm = document.getElementById("categoryBudgetForm");
const categoryBudgetCategory = document.getElementById("categoryBudgetCategory");
const categoryBudgetAmount = document.getElementById("categoryBudgetAmount");
const categoryBudgetList = document.getElementById("categoryBudgetList");


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
// Escape HTML
// ==========================================

function escapeBudgetHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


// ==========================================
// Load Budget From Database
// ==========================================

async function loadBudget() {
    try {
        const response = await fetch(
            `${API_URL}?month=${getBudgetMonth()}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load budget");
        }

        const result = await response.json();

        if (result.status !== "success") {
            throw new Error(result.message || "Could not load budget");
        }

        const data = result.data;

        // Update monthly summary cards
        monthlyBudget.textContent = formatBudgetCurrency(data.budget);
        budgetSpent.textContent = formatBudgetCurrency(data.spent);
        budgetRemaining.textContent = formatBudgetCurrency(data.remaining);

        // Update monthly budget input
        budgetInput.value = data.budget > 0 ? data.budget : "";

        // Update monthly progress
        const percentage = Number(data.percentage || 0);

        budgetPercentage.textContent = percentage + "%";

        budgetProgressBar.style.width =
            Math.min(percentage, 100) + "%";

        if (percentage >= 100) {
            budgetProgressBar.style.background = "#ef4444";
        } else if (percentage >= 80) {
            budgetProgressBar.style.background = "#f59e0b";
        } else {
            budgetProgressBar.style.background = "#16a34a";
        }

        // Load category budgets from the same response
        renderCategoryBudgets(data.category_budgets || []);

    } catch (error) {
        console.error("Budget loading error:", error);
        alert("Unable to load budget. Please try again.");
    }
}


// ==========================================
// Save Monthly Budget
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
            credentials: "include",
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
            throw new Error(
                result.error || result.message || "Failed to save budget"
            );
        }

        alert("Monthly budget saved successfully!");

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
// Reset Monthly Budget Input
// ==========================================

budgetForm.addEventListener("reset", function() {
    setTimeout(() => {
        loadBudget();
    }, 0);
});


// ==========================================
// Render Category Budgets
// ==========================================

function renderCategoryBudgets(categories) {

    if (!categoryBudgetList) return;

    if (!categories || categories.length === 0) {
        categoryBudgetList.innerHTML = `
            <p class="category-budget-loading">
                No category budgets added yet.
            </p>
        `;
        return;
    }

    categoryBudgetList.innerHTML = categories.map(budget => {

        const amount = Number(budget.amount || 0);
        const spent = Number(budget.spent || 0);
        const remaining = Number(budget.remaining || 0);
        const percentage = Number(budget.percentage || 0);

        let progressColor = "#16a34a";

        if (percentage >= 100) {
            progressColor = "#ef4444";
        } else if (percentage >= 80) {
            progressColor = "#f59e0b";
        }

        return `
            <div class="category-budget-item">

                <div class="category-budget-info">

                    <div>
                        <h3>
                            ${escapeBudgetHTML(budget.category)}
                        </h3>

                        <p>
                            ${formatBudgetCurrency(spent)}
                            spent of
                            ${formatBudgetCurrency(amount)}
                        </p>
                    </div>

                    <div class="category-budget-actions">

                        <button
                            type="button"
                            class="edit-category-budget"
                            data-id="${escapeBudgetHTML(budget.id)}"
                            title="Edit budget"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            type="button"
                            class="delete-category-budget"
                            data-id="${escapeBudgetHTML(budget.id)}"
                            title="Delete budget"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                </div>

                <div class="category-budget-progress">
                    <div
                        class="category-budget-progress-bar"
                        style="
                            width: ${Math.min(percentage, 100)}%;
                            background: ${progressColor};
                        "
                    ></div>
                </div>

                <div class="category-budget-details">

                    <span>
                        ${percentage}% used
                    </span>

                    <span>
                        ${formatBudgetCurrency(remaining)} remaining
                    </span>

                </div>

            </div>
        `;

    }).join("");
}


// ==========================================
// Add Category Budget
// ==========================================

categoryBudgetForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const category = categoryBudgetCategory.value;
    const amount = Number(categoryBudgetAmount.value);

    if (!category) {
        alert("Please select a category.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid category budget.");
        return;
    }

    const saveButton = categoryBudgetForm.querySelector(".save-btn");

    saveButton.disabled = true;
    saveButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        const response = await fetch(`${API_URL}/categories`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                category: category,
                amount: amount,
                month: getBudgetMonth()
            })
        });

        const result = await response.json();

        if (!response.ok || result.status !== "success") {
            throw new Error(
                result.error || result.message ||
                "Failed to save category budget"
            );
        }

        alert("Category budget saved successfully!");

        categoryBudgetForm.reset();

        await loadBudget();

    } catch (error) {
        console.error("Category budget saving error:", error);
        alert(error.message || "Unable to save category budget.");

    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML =
            '<i class="fa-solid fa-plus"></i> Add Category Budget';
    }
});


// ==========================================
// Edit Category Budget
// ==========================================

categoryBudgetList.addEventListener("click", async function(event) {

    const editButton = event.target.closest(".edit-category-budget");

    if (!editButton) return;

    const budgetId = editButton.dataset.id;

    const newAmount = prompt("Enter the new budget amount:");

    if (newAmount === null) return;

    const amount = Number(newAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid budget amount.");
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/categories/${encodeURIComponent(budgetId)}`,
            {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    amount: amount
                })
            }
        );

        const result = await response.json();

        if (!response.ok || result.status !== "success") {
            throw new Error(
                result.error || result.message ||
                "Failed to update category budget"
            );
        }

        alert("Category budget updated successfully!");

        await loadBudget();

    } catch (error) {
        console.error("Category budget update error:", error);
        alert(error.message || "Unable to update category budget.");
    }
});


// ==========================================
// Delete Category Budget
// ==========================================

categoryBudgetList.addEventListener("click", async function(event) {

    const deleteButton = event.target.closest(".delete-category-budget");

    if (!deleteButton) return;

    const budgetId = deleteButton.dataset.id;

    const confirmDelete = confirm(
        "Are you sure you want to delete this category budget?"
    );

    if (!confirmDelete) return;

    try {
        const response = await fetch(
            `${API_URL}/categories/${encodeURIComponent(budgetId)}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        const result = await response.json();

        if (!response.ok || result.status !== "success") {
            throw new Error(
                result.error || result.message ||
                "Failed to delete category budget"
            );
        }

        alert("Category budget deleted successfully!");

        await loadBudget();

    } catch (error) {
        console.error("Category budget deletion error:", error);
        alert(error.message || "Unable to delete category budget.");
    }
});


// ==========================================
// Initial Load
// ==========================================

async function initializeBudgetPage() {

    const isLoggedIn = await checkLogin();

    if (!isLoggedIn) return;

    await loadBudget();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeBudgetPage);
} else {
    initializeBudgetPage();
}


// ==========================================
// Refresh When Transactions Change
// ==========================================

window.addEventListener("storage", function(event) {
    if (event.key === "transactionsUpdated") {
        loadBudget();
    }
});

window.addEventListener("transactionsUpdated", function() {
    loadBudget();
});
