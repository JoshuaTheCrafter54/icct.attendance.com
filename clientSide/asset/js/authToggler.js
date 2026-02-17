// ================================
// TOGGLER SYSTEM
// ================================

const loginOverlay = document.querySelector(".login-container-overlay");
const signupOverlay = document.querySelector(".signup-container-overlay");

const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

if (showSignup) {
    showSignup.addEventListener("click", function (e) {
        e.preventDefault();

        loginOverlay.style.display = "none";
        signupOverlay.style.display = "flex";
    });
}

if (showLogin) {
    showLogin.addEventListener("click", function (e) {
        e.preventDefault();

        signupOverlay.style.display = "none";
        loginOverlay.style.display = "flex";
    });
}
