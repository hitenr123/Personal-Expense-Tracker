// ==========================================
// Expense Manager Dashboard Script
// ==========================================

// -------------------------------
// Sidebar Toggle
// -------------------------------

const menuIcon = document.querySelector(".menu-icon");
const sidebar = document.querySelector(".sidebar");
const main = document.querySelector(".main");



if (menuIcon) {
    menuIcon.addEventListener("click", () => {
        sidebar.classList.toggle("show");
        main.classList.toggle("shift");
    });
}

// -------------------------------
// Active Sidebar Menu
// -------------------------------

const menuItems = document.querySelectorAll(".menu li");

menuItems.forEach(item => {

    item.addEventListener("click", () => {

        menuItems.forEach(i => i.classList.remove("active"));

        item.classList.add("active");

    });

});

// -------------------------------
// Greeting Date
// -------------------------------

const dateElement = document.querySelector(".greeting p");

const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
};

const today = new Date();

if (dateElement) {

    dateElement.innerHTML =
        today.toLocaleDateString("en-IN", options);

}

// ==========================================
// Monthly Overview Chart
// ==========================================

const overviewCanvas = document.getElementById("overviewChart");

if (overviewCanvas) {

new Chart(overviewCanvas,{

type:"line",

data:{

labels:[
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
"Dec"
],

datasets:[

{

label:"Income",

data:[
15000,
18000,
22000,
21000,
25000,
28000,
30000,
29000,
32000,
31000,
34000,
36000
],

borderColor:"#16a34a",

backgroundColor:"rgba(22,163,74,.15)",

fill:true,

tension:.4,

pointRadius:5,

pointBackgroundColor:"#16a34a"

},

{

label:"Expenses",

data:[
9000,
12000,
14000,
13500,
15000,
17000,
18000,
17500,
19000,
21000,
22000,
23000
],

borderColor:"#ef4444",

backgroundColor:"rgba(239,68,68,.12)",

fill:true,

tension:.4,

pointRadius:5,

pointBackgroundColor:"#ef4444"

}

]

},

options:{

responsive:true,

maintainAspectRatio:false,

plugins:{

legend:{

position:"top"

}

},

scales:{

y:{

beginAtZero:true

}

}

}

});

}

// ==========================================
// Expense Category Chart
// ==========================================

const categoryCanvas = document.getElementById("categoryChart");

if(categoryCanvas){

new Chart(categoryCanvas,{

type:"doughnut",

data:{

labels:[

"Food",

"Transport",

"Shopping",

"Utilities",

"Entertainment",

"Others"

],

datasets:[{

data:[28,18,15,12,10,17],

backgroundColor:[

"#ef4444",

"#3b82f6",

"#8b5cf6",

"#f59e0b",

"#10b981",

"#94a3b8"

],

borderWidth:0

}]

},

options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",

    animation: {
    animateRotate: true,
    duration: 2500
},

animations: {
    numbers: {
        type: "number",
        properties: ["circumference", "startAngle"],
        duration: 2500,
        easing: "easeInOutQuart"
    }
},

    plugins: {
        legend: {
            position: "right"
        }
    }
}

});

}

// ==========================================
// Card Hover Animation
// ==========================================

const cards = document.querySelectorAll(".card");

cards.forEach(card=>{

card.addEventListener("mouseenter",()=>{

card.style.transform="translateY(-8px)";

});

card.addEventListener("mouseleave",()=>{

card.style.transform="translateY(0px)";

});

});

// ==========================================
// Quick Action Buttons
// ==========================================

const buttons=document.querySelectorAll(".actions button");

buttons.forEach(button=>{

button.addEventListener("click",()=>{

alert(button.innerText+" Clicked!");

});

});

// ==========================================
// Notification Bell
// ==========================================

const bell=document.querySelector(".fa-bell");

if(bell){

bell.addEventListener("click",()=>{

alert("No new notifications.");

});

}

// ==========================================
// Profile
// ==========================================

const profile=document.querySelector(".profile");

if(profile){

profile.addEventListener("click",()=>{

alert("Profile menu coming soon.");

});

}

const counters = document.querySelectorAll(".counter");

counters.forEach(counter => {

    const target = Number(counter.dataset.target);
    const duration = 2000;
    const start = performance.now();

    function easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function animate(now) {

        const progress = Math.min((now - start) / duration, 1);

        const value = Math.floor(target * easeOut(progress));

        counter.innerHTML =
            "₹" + value.toLocaleString("en-IN");

        if (progress < 1) {

            requestAnimationFrame(animate);

        } else {

            counter.innerHTML =
                "₹" + target.toLocaleString("en-IN");

        }

    }

    requestAnimationFrame(animate);

});