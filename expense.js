// ==========================================
// Expense Page Script
// ==========================================

// -----------------------------
// Elements
// -----------------------------

const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const paymentSelect = document.getElementById("payment");
const accountSelect = document.getElementById("account");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const notesInput = document.getElementById("notes");
const recurringInput = document.getElementById("recurring");
const receiptInput = document.getElementById("receipt");

const previewAmount = document.getElementById("previewAmount");
const selectedCategory = document.getElementById("selectedCategory");
const selectedPayment = document.getElementById("selectedPayment");

const form = document.querySelector("form");

// -----------------------------
// Default Date & Time
// -----------------------------

const now = new Date();

if (dateInput) {
    dateInput.value = now.toISOString().split("T")[0];
}

if (timeInput) {

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    timeInput.value = `${hours}:${minutes}`;
}

// -----------------------------
// Live Amount Preview
// -----------------------------

amountInput.addEventListener("input", () => {

    const value = Number(amountInput.value) || 0;

    previewAmount.innerHTML =
        "₹" + value.toLocaleString("en-IN");

});

// -----------------------------
// Live Category
// -----------------------------

categorySelect.addEventListener("change", () => {

    selectedCategory.innerHTML =
        categorySelect.value;

});

// -----------------------------
// Live Payment Method
// -----------------------------

paymentSelect.addEventListener("change", () => {

    selectedPayment.innerHTML =
        paymentSelect.value;

});

// -----------------------------
// Save Expense
// -----------------------------

form.addEventListener("submit", function(e){

    e.preventDefault();

    if(amountInput.value===""){

        alert("Please enter expense amount.");

        amountInput.focus();

        return;

    }

    const expense={

        id:Date.now(),

        amount:Number(amountInput.value),

        category:categorySelect.value,

        payment:paymentSelect.value,

        account:accountSelect.value,

        date:dateInput.value,

        time:timeInput.value,

        notes:notesInput.value,

        recurring:recurringInput.checked,

        receipt:
            receiptInput.files.length
            ? receiptInput.files[0].name
            : ""

    };

    const expenses=
        JSON.parse(localStorage.getItem("expenses")) || [];

    expenses.push(expense);

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );

    alert("Expense Saved Successfully!");

    form.reset();

    previewAmount.innerHTML="₹0";

    selectedCategory.innerHTML="Food";

    selectedPayment.innerHTML="Cash";

    dateInput.value=now.toISOString().split("T")[0];

    const h=String(now.getHours()).padStart(2,"0");
    const m=String(now.getMinutes()).padStart(2,"0");

    timeInput.value=`${h}:${m}`;

});

// -----------------------------
// Reset Button
// -----------------------------

document.querySelector(".reset-btn")
.addEventListener("click",()=>{

    previewAmount.innerHTML="₹0";

    selectedCategory.innerHTML="Food";

    selectedPayment.innerHTML="Cash";

});

// -----------------------------
// Sidebar Toggle
// -----------------------------

const menuIcon=document.querySelector(".menu-icon");
const sidebar=document.querySelector(".sidebar");
const main=document.querySelector(".main");

if(menuIcon){

    menuIcon.addEventListener("click",()=>{

        sidebar.classList.toggle("show");

        main.classList.toggle("shift");

    });

}

// -----------------------------
// Profile
// -----------------------------

const profile=document.querySelector(".profile");

if(profile){

    profile.addEventListener("click",()=>{

        alert("Profile section coming soon.");

    });

}

// -----------------------------
// Bell
// -----------------------------

const bell=document.querySelector(".fa-bell");

if(bell){

    bell.addEventListener("click",()=>{

        alert("No new notifications.");

    });

}