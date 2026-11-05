// ==========================================
// LOGIN PAGE JAVASCRIPT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "https://personal-expense-tracker-7qhy.onrender.com";

    const loginForm = document.getElementById("loginForm");

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

    // 3. Login Form and Backend Connection
    loginForm.addEventListener("submit", async event => {

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

        const submitButton = loginForm.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Signing In...";
        }

        try {

            const response = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            // Save user information (never save the password)
            localStorage.setItem("user", JSON.stringify(data.user));

            // Remember Me preference
            localStorage.setItem("rememberMe", rememberMe ? "true" : "false");

            alert("Login successful!");

            window.location.href = "index.html";

        } catch (error) {

            console.error("Login Error:", error);
            alert(error.message || "Unable to connect to the server.");

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Sign In";
            }

        }

    });

});