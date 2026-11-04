
// ==========================================
// LOGIN PAGE JAVASCRIPT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // 1. Apply Saved Theme
    const savedTheme = localStorage.getItem("theme") || "light";

    if (savedTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }


    // 2. Show / Hide Password
    document.querySelectorAll(".password-toggle").forEach(button => {

        button.addEventListener("click", () => {

            const targetId = button.dataset.target;
            const input = document.getElementById(targetId);
            const icon = button.querySelector("i");

            if (!input || !icon) return;

            if (input.type === "password") {
                input.type = "text";
                icon.classList.replace("fa-eye", "fa-eye-slash");
            } else {
                input.type = "password";
                icon.classList.replace("fa-eye-slash", "fa-eye");
            }

        });

    });


    // 3. Login Form Validation
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", event => {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const rememberMe = document.getElementById("rememberMe").checked;

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        if (password.length < 8) {
            alert("Please enter a valid password.");
            return;
        }

        alert("Form validation successful!");

        // Actual login will be connected to Flask backend later.

    });

});
