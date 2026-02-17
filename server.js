const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// 1. MIDDLEWARE
app.use(cors());
app.use(bodyParser.json());

// 2. SERVE STATIC FILES
// This allows the browser to find CSS/JS inside these specific folders
app.use('/clientSide', express.static(path.join(__dirname, 'clientSide')));
app.use('/adminSide', express.static(path.join(__dirname, 'adminSide')));

// 3. PAGE ROUTES
// Default route (Student Login)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin Dashboard route
app.get("/admin", (req, res) => {
  // Points to your adminSide folder based on your screenshot
  res.sendFile(path.join(__dirname, 'adminSide', 'indexAdmin.html'));
});

// Student Dashboard route
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, 'clientSide', 'studentDashboard.html'));
});

app.get("/api/users", (req, res) => {
    const data = fs.readFileSync(path.join(__dirname, "data", "users.json"), "utf-8");
    res.json(JSON.parse(data || "[]"));
});

app.get("/api/events", (req, res) => {
    const data = fs.readFileSync(path.join(__dirname, "data", "events.json"), "utf-8");
    res.json(JSON.parse(data || "[]"));
});

app.get("/api/attendance", (req, res) => {
    const data = fs.readFileSync(path.join(__dirname, "data", "attendance.json"), "utf-8");
    res.json(JSON.parse(data || "[]"));
});

// Update User Status (For Verify Button)
app.post("/api/users/verify", (req, res) => {
    const { id } = req.body;
    let users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
        users[userIndex].status = "verified";
        writeUsers(users);
        return res.json({ message: "User verified" });
    }
    res.status(404).send("User not found");
});

// 4. DATA HANDLING
const usersFile = path.join(__dirname, "data", "users.json");

function readUsers() {
  try {
    if (!fs.existsSync(usersFile)) return []; 
    const data = fs.readFileSync(usersFile, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// 5. API ENDPOINTS
app.post("/signup", (req, res) => {
  const { fullname, username, email, password } = req.body;
  let users = readUsers();

  const existingUser = users.find(u => u.username === username || u.email === email);
  if (existingUser) return res.status(400).json({ message: "Username or email already exists!" });

  const newUser = {
    id: users.length + 1,
    name: fullname,
    username,
    email,
    password,
    role: "student",
    status: "pending",
    studentId: `2023-${String(users.length + 1).padStart(3, '0')}`
  };

  users.push(newUser);
  writeUsers(users);
  res.json({ message: "Account created successfully!" });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid username or password!" });

  res.json({
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role
  });
});

// 6. START SERVER
app.listen(PORT, () => {
  console.log(`
  🚀 Server running!
  -----------------------------------------
  Login : http://localhost:${PORT}
  -----------------------------------------
  `);
});