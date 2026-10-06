const goalForm = document.getElementById("goalForm");

const goalNameInput = document.getElementById("goalName");
const goalAmountInput = document.getElementById("goalAmount");
const goalDateInput = document.getElementById("goalDate");

const goalsList = document.getElementById("goalsList");


/* Get all goals */

function getGoals() {
  return JSON.parse(localStorage.getItem("financialGoals")) || [];
}


/* Get current savings */

function getCurrentSavings() {

  const incomes =
    JSON.parse(localStorage.getItem("incomes")) || [];

  const expenses =
    JSON.parse(localStorage.getItem("expenses")) || [];

  const totalIncome = incomes.reduce(
    (total, income) =>
      total + Number(income.amount || 0),
    0
  );

  const totalExpense = expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount || 0),
    0
  );

  return totalIncome - totalExpense;
}


/* Update overall goal summary */

function updateGoalSummary() {

  const goals = getGoals();

  const savings = getCurrentSavings();

  if (goals.length === 0) {

    goalTarget.textContent = "₹0";

    goalSavings.textContent =
      formatCurrency(Math.max(savings, 0));

    goalProgress.textContent = "0%";

    return;
  }


  const totalTarget = goals.reduce(
    (total, goal) =>
      total + Number(goal.amount || 0),
    0
  );


  const progress =
    totalTarget > 0
      ? Math.min((savings / totalTarget) * 100, 100)
      : 0;


  goalTarget.textContent =
    formatCurrency(totalTarget);

  goalSavings.textContent =
    formatCurrency(Math.max(savings, 0));

  goalProgress.textContent =
    progress.toFixed(1) + "%";
}


/* Display all goals */

function displayGoals() {

  const goals = getGoals();
  const savings = getCurrentSavings();

  goalsList.innerHTML = "";

  if (goals.length === 0) {

    goalsList.innerHTML = `
      <div class="no-goals">
        <i class="fa-solid fa-bullseye"></i>
        <h3>No Goals Yet</h3>
        <p>Add your first financial goal above.</p>
      </div>
    `;

    return;
  }


  goals.forEach(goal => {

    const target = Number(goal.amount);

    const progress = target > 0
      ? Math.min((Math.max(savings, 0) / target) * 100, 100)
      : 0;


    let targetDate = "No target date";

    if (goal.date) {

      const date = new Date(goal.date);

      targetDate = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

    }


    const goalCard = document.createElement("div");

    goalCard.className = "goal-card";


    goalCard.innerHTML = `

      <!-- Goal Header -->

      <div class="goal-header">

        <div class="goal-icon">
          <i class="fa-solid fa-bullseye"></i>
        </div>

        <div class="goal-title">

          <h3>${goal.name}</h3>

          <p>
            Target Date: ${targetDate}
          </p>

        </div>

      </div>


      <!-- Goal Statistics -->

      <div class="goal-stats">

        <div class="goal-stat">

          <span>Target Amount</span>

          <strong>
            ₹${target.toLocaleString("en-IN")}
          </strong>

        </div>


        <div class="goal-stat">

          <span>Current Savings</span>

          <strong>
            ₹${Math.max(savings, 0).toLocaleString("en-IN")}
          </strong>

        </div>


        <div class="goal-stat">

          <span>Progress</span>

          <strong>
            ${progress.toFixed(1)}%
          </strong>

        </div>

      </div>


      <!-- Progress Bar -->

      <div class="goal-progress">

        <div class="progress-track">

          <div
            class="progress-fill"
            style="width: ${progress}%"
          ></div>

        </div>

        <span>${progress.toFixed(1)}% completed</span>

      </div>


      <!-- Goal Actions -->

      <div class="goal-actions">

        <button
          type="button"
          class="edit-goal"
          onclick="editGoal(${goal.id})"
        >

          <i class="fa-solid fa-pen"></i>
          Edit

        </button>


        <button
          type="button"
          class="remove-goal"
          onclick="removeGoal(${goal.id})"
        >

          <i class="fa-solid fa-trash"></i>
          Remove

        </button>

      </div>

    `;


    goalsList.appendChild(goalCard);

  });
}


/* Add new goal */

goalForm.addEventListener("submit", function(event) {

  event.preventDefault();


  const name =
    goalNameInput.value.trim();

  const amount =
    Number(goalAmountInput.value);

  const date =
    goalDateInput.value;


  if (!name || amount <= 0) {

    alert("Please enter a valid goal.");

    return;
  }


  const goals = getGoals();


  const newGoal = {

    id: Date.now(),

    name: name,

    amount: amount,

    date: date

  };


  goals.push(newGoal);


  localStorage.setItem(
    "financialGoals",
    JSON.stringify(goals)
  );


  goalForm.reset();

  displayGoals();


  alert("Goal added successfully!");

});


/* Edit goal */

function editGoal(id) {

  const goals = getGoals();

  const goal =
    goals.find(goal => goal.id === id);


  if (!goal) return;


  goalNameInput.value =
    goal.name;

  goalAmountInput.value =
    goal.amount;

  goalDateInput.value =
    goal.date || "";


  goals.splice(
    goals.findIndex(goal => goal.id === id),
    1
  );


  localStorage.setItem(
    "financialGoals",
    JSON.stringify(goals)
  );


  goalNameInput.focus();


  displayGoals();

}


/* Remove goal */

function removeGoal(id) {

  const confirmRemove =
    confirm(
      "Are you sure you want to remove this goal?"
    );


  if (!confirmRemove) return;


  const goals = getGoals();


  const updatedGoals =
    goals.filter(goal => goal.id !== id);


  localStorage.setItem(
    "financialGoals",
    JSON.stringify(updatedGoals)
  );


  displayGoals();

}


/* Initial load */

displayGoals();