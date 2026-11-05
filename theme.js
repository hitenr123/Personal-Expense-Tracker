// ==========================================
// Global Light / Dark Mode
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const themeToggle = document.getElementById("themeToggle");

    // Load saved theme
    const savedTheme = localStorage.getItem("theme") || "light";

    applyTheme(savedTheme);

    // Apply theme
    function applyTheme(theme) {

        document.documentElement.setAttribute("data-theme", theme);

        localStorage.setItem("theme", theme);

        updateThemeIcon(theme);
    }

    // Update toggle icon
    function updateThemeIcon(theme) {

        if (!themeToggle) return;

        if (theme === "dark") {

            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
            themeToggle.setAttribute("aria-label", "Switch to light mode");

        } else {

            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
            themeToggle.setAttribute("aria-label", "Switch to dark mode");

        }
    }

    // Toggle theme
    if (themeToggle) {

        themeToggle.addEventListener("click", () => {

            const currentTheme =
                document.documentElement.getAttribute("data-theme") || "light";

            const newTheme = currentTheme === "light" ? "dark" : "light";

            applyTheme(newTheme);

        });

    }

});