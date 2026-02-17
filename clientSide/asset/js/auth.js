// Signup
signupForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const data = {
        fullname: signupForm.fullname.value.trim(),
        username: signupForm.username.value.trim(),
        email: signupForm.email.value.trim(),
        password: signupForm.password.value
    };

    if (data.password !== signupForm.confirmPassword.value) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        alert(result.message);
        showLoginForm();
    } catch (err) {
        alert(err.message);
    }
});

// Login
loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const data = {
        username: loginForm.username.value.trim(),
        password: loginForm.password.value
    };

    try {
        const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const user = await res.json();
        if (!res.ok) throw new Error(user.message);

        sessionStorage.setItem("loggedInUser", JSON.stringify(user));
        if (user.role === "admin") window.location.href = "/adminSide/indexAdmin.html";
        else window.location.href = "/clientSide/studentDashboard.html";
    } catch (err) {
        alert(err.message);
    }
});
