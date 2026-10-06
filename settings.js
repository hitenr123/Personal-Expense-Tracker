console.log("Settings JS loaded");

const settingsForm = document.getElementById("settingsForm");
const profileNameInput = document.getElementById("profileName");
const currencySelect = document.getElementById("currency");
const topProfileName = document.getElementById("topProfileName");
const resetSettingsBtn = document.getElementById("resetSettings");
const clearDataBtn = document.getElementById("clearDataBtn");


function loadSettings() {

    const savedName = localStorage.getItem("profileName") || "Hiten";
    const savedCurrency = localStorage.getItem("currency") || "₹";

    profileNameInput.value = savedName;
    currencySelect.value = savedCurrency;

    if (topProfileName) {
        topProfileName.textContent = savedName;
    }
}


settingsForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = profileNameInput.value.trim();
    const currency = currencySelect.value;

    if (name === "") {
        alert("Please enter your name.");
        return;
    }

    localStorage.setItem("profileName", name);
    localStorage.setItem("currency", currency);
    location.reload();

    if (topProfileName) {
        topProfileName.textContent = name;
    }

    alert("Settings saved successfully!");

});


resetSettingsBtn.addEventListener("click", function() {

    setTimeout(function() {

        profileNameInput.value = "Hiten";
        currencySelect.value = "₹";

    }, 0);

});


clearDataBtn.addEventListener("click", function() {

    const confirmed = confirm(
        "Are you sure you want to delete all financial data?"
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("expenses");
    localStorage.removeItem("incomes");
    localStorage.removeItem("monthlyBudget");
    localStorage.removeItem("financialGoals");

    alert("All financial data has been cleared.");

    location.reload();

});


loadSettings();