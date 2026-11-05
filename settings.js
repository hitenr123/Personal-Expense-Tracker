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


console.log("Settings JS loaded");

const settingsForm = document.getElementById("settingsForm");
const profileNameInput = document.getElementById("profileName");
const currencySelect = document.getElementById("currency");
const themeSelect = document.getElementById("themeSelect");
const topProfileName = document.getElementById("topProfileName");
const resetSettingsBtn = document.getElementById("resetSettings");
const exchangeRateStatus = document.getElementById("exchangeRateStatus");

// ==========================================
// Load Saved Settings
// ==========================================

function loadSettings() {
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  const savedName =
    loggedInUser.full_name || localStorage.getItem("profileName") || "User";
  const savedCurrency = localStorage.getItem("currency") || "INR";
  const savedTheme = localStorage.getItem("theme") || "light";

  profileNameInput.value = savedName;
  currencySelect.value = savedCurrency;
  themeSelect.value = savedTheme;

  updateProfileName(savedName);

  if (typeof window.applyTheme === "function") {
    window.applyTheme(savedTheme);
  }
}

// ==========================================
// Update Profile Name
// ==========================================

function updateProfileName(name) {
  // Update profile name everywhere
  document.querySelectorAll("#topProfileName").forEach((element) => {
    element.textContent = name;
  });

  // Update avatar initial everywhere
  document.querySelectorAll(".profile .avatar").forEach((element) => {
    element.textContent = name.charAt(0).toUpperCase();
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

    greetingHeading.textContent = `${greeting}, ${name}`;
  }

  localStorage.setItem("profileName", name);
}

window.updateProfileName = updateProfileName;

// ==========================================
// Save Settings
// ==========================================

settingsForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = profileNameInput.value.trim();
  const currency = currencySelect.value;
  const theme = themeSelect.value;

  if (!name) {
    alert("Please enter your name.");
    return;
  }

  localStorage.setItem("profileName", name);
  localStorage.setItem("currency", currencySelect.value);
  localStorage.setItem("theme", theme);

  updateProfileName(name);

  if (typeof window.applyTheme === "function") {
    window.applyTheme(theme);
  }

  alert("Settings saved successfully!");

  location.reload();
});

// ==========================================
// Reset Settings
// ==========================================

resetSettingsBtn.addEventListener("click", function () {
  const confirmed = confirm("Reset all settings to default?");

  if (!confirmed) return;

  localStorage.setItem("profileName", "Hiten");
  localStorage.setItem("currency", "INR");
  localStorage.setItem("theme", "light");

  alert("Settings restored to default.");

  location.reload();
});

// ==========================================
// Exchange Rate Status
// ==========================================

async function showExchangeRateStatus() {
  if (!exchangeRateStatus) return;

  const currency = currencySelect.value;

  if (currency === "INR") {
    exchangeRateStatus.textContent =
      "INR is your base currency. No conversion is needed.";
    return;
  }

  exchangeRateStatus.textContent = "Loading exchange rates...";

  try {
    await window.currencyReady;

    if (!window.currencyReady || typeof window.formatCurrency !== "function") {
      throw new Error("Currency service unavailable.");
    }

    const testAmount = window.formatCurrency(100);

    if (testAmount.includes("INR") || testAmount.includes("₹")) {
      throw new Error("Using INR fallback.");
    }

    exchangeRateStatus.textContent =
      "Exchange rates loaded successfully. Example: ₹100 = " + testAmount;
  } catch (error) {
    exchangeRateStatus.textContent =
      "Exchange rates unavailable. Please try again later.";
  }
}

function updateCurrencyLabel() {
  const currency = localStorage.getItem("currency") || "INR";

  const currencyNames = {
    INR: "₹ Indian Rupee (INR)",
    USD: "$ US Dollar (USD)",
    EUR: "€ Euro (EUR)",
    GBP: "£ British Pound (GBP)",
  };

  console.log("Selected currency:", currencyNames[currency]);
}

// ==========================================
// Initialize
// ==========================================

async function initializeSettingsPage() {
  const isLoggedIn = await checkLogin();

  if (!isLoggedIn) return;

  loadSettings();
  updateCurrencyLabel();
  await showExchangeRateStatus();
}

initializeSettingsPage();