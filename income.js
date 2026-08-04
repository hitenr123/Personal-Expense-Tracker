// ==========================================
// Income Page Script
// ==========================================

// ---------- Sidebar ----------

const menuIcon = document.querySelector(".menu-icon");
const sidebar = document.querySelector(".sidebar");
const main = document.querySelector(".main");

if (menuIcon) {
    menuIcon.addEventListener("click", () => {
        sidebar.classList.toggle("show");
        main.classList.toggle("shift");
    });
}

// ---------- Today's Date ----------

const dateInput = document.getElementById("date");

if (dateInput) {
    dateInput.value = new Date().toISOString().split("T")[0];
}

// ---------- Current Time ----------

const timeInput = document.getElementById("time");

if (timeInput) {

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    timeInput.value = `${hours}:${minutes}`;
}

// ---------- Live Preview ----------

const amount = document.getElementById("amount");
const source = document.getElementById("source");
const payment = document.getElementById("payment");

const previewAmount = document.getElementById("previewAmount");
const previewSource = document.getElementById("selectedSource");
const previewPayment = document.getElementById("selectedPayment");

if (amount) {

    amount.addEventListener("input", () => {

        const value = amount.value || 0;

        previewAmount.innerHTML =
            "₹" + Number(value).toLocaleString("en-IN");

    });

}

if (source) {

    source.addEventListener("change", () => {

        previewSource.innerHTML = source.value;

    });

}

if (payment) {

    payment.addEventListener("change", () => {

        previewPayment.innerHTML = payment.value;

    });

}

// ---------- Save Form ----------

const form = document.querySelector("form");

if (form) {

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        if (amount.value.trim() === "") {

            alert("Please enter income amount.");

            amount.focus();

            return;

        }

        const income = {

            amount: amount.value,
            source: source.value,
            payment: payment.value,
            account: document.getElementById("account").value,
            date: dateInput.value,
            time: timeInput.value,
            notes: document.getElementById("notes").value

        };

        let incomes =
            JSON.parse(localStorage.getItem("incomeList")) || [];

        incomes.push(income);

        localStorage.setItem(
            "incomeList",
            JSON.stringify(incomes)
        );

        alert("Income Added Successfully!");

        form.reset();

        dateInput.value =
            new Date().toISOString().split("T")[0];

        previewAmount.innerHTML = "₹0";
        previewSource.innerHTML = "-";
        previewPayment.innerHTML = "-";

    });

}

// ---------- Reset ----------

const resetBtn = document.querySelector(".reset-btn");

if (resetBtn) {

    resetBtn.addEventListener("click", () => {

        previewAmount.innerHTML = "₹0";
        previewSource.innerHTML = "-";
        previewPayment.innerHTML = "-";

    });

}

// ---------- Notification ----------

const bell = document.querySelector(".fa-bell");

if (bell) {

    bell.addEventListener("click", () => {

        alert("No new notifications.");

    });

}

// ---------- Profile ----------

const profile = document.querySelector(".profile");

if (profile) {

    profile.addEventListener("click", () => {

        alert("Profile section coming soon.");

    });

}

// ---------- History Button ----------

const historyBtn = document.querySelector(".history-btn");

if (historyBtn) {

    historyBtn.addEventListener("click", () => {

        alert("Income History page will be added next.");

    });

}