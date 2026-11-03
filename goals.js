
const API_URL = "http://127.0.0.1:5000/api";

const goalForm = document.getElementById("goalForm");

const goalNameInput = document.getElementById("goalName");
const goalAmountInput = document.getElementById("goalAmount");
const goalDateInput = document.getElementById("goalDate");

const goalsList = document.getElementById("goalsList");

let goals = [];
let currentSavings = 0;
let editingGoalId = null;


// ==========================================
// Fetch Goals from Supabase
// ==========================================

async function getGoals() {
    try {
        const response = await fetch(`${API_URL}/goals`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Unable to fetch goals");
        }

        goals = result.data || [];
        return goals;

    } catch (error) {
        console.error("Goal loading error:", error);
        alert("Unable to load goals. Check whether Flask is running.");
        return [];
    }
}


// ==========================================
// Calculate Current Savings
// ==========================================

async function getCurrentSavings() {
    try {
        const [incomeRes, expenseRes] = await Promise.all([
            fetch(`${API_URL}/income`),
            fetch(`${API_URL}/expenses`)
        ]);

        if (!incomeRes.ok || !expenseRes.ok) {
            throw new Error("Failed to fetch income or expenses");
        }

        const incomeData = await incomeRes.json();
        const expenseData = await expenseRes.json();

        const totalIncome = (incomeData.data || []).reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
        );

        const totalExpense = (expenseData.data || []).reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
        );

        const currentSavings = totalIncome - totalExpense;

        // Debugging values

        return Math.max(0, currentSavings);

    } catch (error) {
        console.error("Error calculating savings:", error);
        return 0;
    }
}


// ==========================================
// Update Overall Goal Summary
// ==========================================

function updateGoalSummary() {
    const totalTarget = goals.reduce(
        (total, goal) => total + Number(goal.target_amount || 0), 0
    );

    const progress = totalTarget > 0
        ? Math.min((currentSavings / totalTarget) * 100, 100)
        : 0;

    if (typeof goalTarget !== "undefined") {
        goalTarget.textContent = formatCurrency(totalTarget);
    }

    if (typeof goalSavings !== "undefined") {
        goalSavings.textContent = formatCurrency(currentSavings);
    }

    if (typeof goalProgress !== "undefined") {
        goalProgress.textContent = progress.toFixed(1) + "%";
    }
}


// ==========================================
// Display Goals
// ==========================================

async function displayGoals() {
    goalsList.innerHTML = "";

    // Fetch the latest savings from Supabase data
    currentSavings = await getCurrentSavings();

    if (goals.length === 0) {
        goalsList.innerHTML = `
            <div class="no-goals">
                <i class="fa-solid fa-bullseye"></i>
                <h3>No Goals Yet</h3>
                <p>Add your first financial goal above.</p>
            </div>
        `;

        updateGoalSummary();
        return;
    }

    goals.forEach(goal => {
        const target = Number(goal.target_amount || 0);

        const progress = target > 0
            ? Math.min((currentSavings / target) * 100, 100)
            : 0;

        const targetDate = goal.target_date
            ? new Date(goal.target_date + "T00:00:00").toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            )
            : "No target date";

        const goalCard = document.createElement("div");
        goalCard.className = "goal-card";

        goalCard.innerHTML = `
            <div class="goal-header">
                <div class="goal-icon">
                    <i class="fa-solid fa-bullseye"></i>
                </div>

                <div class="goal-title">
                    <h3></h3>
                    <p>Target Date: ${targetDate}</p>
                </div>
            </div>

            <div class="goal-stats">
                <div class="goal-stat">
                    <span>Target Amount</span>
                    <strong>${formatCurrency(target)}</strong>
                </div>

                <div class="goal-stat">
                    <span>Current Savings</span>
                    <strong>${formatCurrency(currentSavings)}</strong>
                </div>

                <div class="goal-stat">
                    <span>Progress</span>
                    <strong>${progress.toFixed(1)}%</strong>
                </div>
            </div>

            <div class="goal-progress">
                <div class="progress-track">
                    <div class="progress-fill"
                         style="width: ${progress}%">
                    </div>
                </div>

                <span>${progress.toFixed(1)}% completed</span>
            </div>

            <div class="goal-actions">
                <button type="button" class="edit-goal">
                    <i class="fa-solid fa-pen"></i>
                    Edit
                </button>

                <button type="button" class="remove-goal">
                    <i class="fa-solid fa-trash"></i>
                    Remove
                </button>
            </div>
        `;

        goalCard.querySelector(".goal-title h3").textContent =
            goal.goal_name;

        goalCard.querySelector(".edit-goal").addEventListener(
            "click", () => editGoal(goal.id)
        );

        goalCard.querySelector(".remove-goal").addEventListener(
            "click", () => removeGoal(goal.id)
        );

        goalsList.appendChild(goalCard);
    });

    updateGoalSummary();
}


// ==========================================
// Load All Goal Data
// ==========================================

async function loadGoals() {
    await Promise.all([
        getGoals(),
        getCurrentSavings()
    ]);

    displayGoals();
}


// ==========================================
// Add or Update Goal
// ==========================================

goalForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const name = goalNameInput.value.trim();
    const amount = Number(goalAmountInput.value);
    const date = goalDateInput.value;

    if (!name || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid goal.");
        return;
    }

    const goalData = {
        name: name,
        amount: amount,
        date: date
    };

    try {
        const isEditing = editingGoalId !== null;

        const url = isEditing
            ? `${API_URL}/goals/${editingGoalId}`
            : `${API_URL}/goals`;

        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(goalData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to save goal");
        }

        alert(isEditing
            ? "Goal updated successfully!"
            : "Goal added successfully!"
        );

        editingGoalId = null;
        goalForm.reset();

        await loadGoals();

    } catch (error) {
        console.error("Goal save error:", error);
        alert("Unable to save goal: " + error.message);
    }
});


// ==========================================
// Edit Goal
// ==========================================

function editGoal(id) {
    const goal = goals.find(goal => goal.id === id);

    if (!goal) return;

    editingGoalId = id;

    goalNameInput.value = goal.goal_name;
    goalAmountInput.value = goal.target_amount;
    goalDateInput.value = goal.target_date || "";

    goalNameInput.focus();
}


// ==========================================
// Remove Goal
// ==========================================

async function removeGoal(id) {
    if (!confirm("Are you sure you want to remove this goal?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/goals/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to delete goal");
        }

        alert("Goal removed successfully!");

        await loadGoals();

    } catch (error) {
        console.error("Goal deletion error:", error);
        alert("Unable to remove goal: " + error.message);
    }
}


// ==========================================
// Initial Load
// ==========================================

loadGoals();
