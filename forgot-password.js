// FORGOT PASSWORD PAGE JAVASCRIPT

document.addEventListener("DOMContentLoaded", () => {

    // Apply saved theme
    const savedTheme = localStorage.getItem("theme") || "light";

    if (savedTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }

    // Form validation
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");

    forgotPasswordForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();

        if (!email) {
            alert("Please enter your email address.");
            return;
        }

        alert("Email validation successful! Password reset will be connected to the backend later.");

        forgotPasswordForm.reset();
    });

});