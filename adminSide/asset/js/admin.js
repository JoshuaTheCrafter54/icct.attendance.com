// ==========================
// JSON LOADER
// ==========================

let users = [];
let events = [];
let attendance = [];

async function loadData() {
    try {
        // Use the absolute path provided by your server
        const usersRes = await fetch("/api/users");
        const eventsRes = await fetch("/api/events");
        const attendanceRes = await fetch("/api/attendance");

        users = await usersRes.json();
        events = await eventsRes.json();
        attendance = await attendanceRes.json();

        console.log("Data successfully fetched from server!");

        // The rest of your rendering functions...
        loadSection("dashboard");
        loadUser("allUser");
        loadDashboardCounters();
        renderEvents();
        renderEventCards();
        reportList();
    } catch (err) {
        console.error("Failed to load data:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadData();

    const savedSection = localStorage.getItem("activeSection") || "dashboard";

    const activeLink = document.querySelector(
        `nav a[onclick*="${savedSection}"]`
    );

    loadSection(savedSection, activeLink);
});



// saving changes
function saveUsersJSON() {
    const dataStr = JSON.stringify(users, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "users.json";
    link.click();
}

// ==========================
// SECTION LOADER
// ==========================
function loadSection(sectionId, link) {
    document.querySelectorAll(".content").forEach(sec => sec.style.display = "none");
    document.getElementById(sectionId).style.display = "block";

    document.querySelectorAll("header a").forEach(a => a.classList.remove("active"));
    if (link) link.classList.add("active");

    // 🔥 SAVE ACTIVE SECTION
    localStorage.setItem("activeSection", sectionId);

    if (sectionId === "dashboard") {
        setTimeout(loadCharts, 0);
    }
}

// ==========================
// USER FILTER LOADER
// ==========================
function loadUser(divId, link) {
    document.querySelectorAll(".data-container").forEach(d => d.style.display = "none");
    document.getElementById(divId).style.display = "block";

    document.querySelectorAll(".user-nav a").forEach(a => a.classList.remove("active"));
    if (link) link.classList.add("active");

    const search = document.getElementById("search")?.value || "";

    if (divId === "allUser") renderUsers({ targetBodyId: "usersTableBody", search });
    if (divId === "pending") renderUsers({ targetBodyId: "pendingUsers", role: "student", status: "pending", search });
    if (divId === "verified") renderUsers({ targetBodyId: "verifiedUsers", role: "student", status: "verified", search });
    if (divId === "admin") renderUsers({ targetBodyId: "adminUsers", role: "admin", search });
}

// ==========================
// DASHBOARD COUNTERS
// ==========================
function animateCounter(id, target, speed = 15) {
    const el = document.getElementById(id);
    if (!el) return;

    let current = 0;
    const timer = setInterval(() => {
        current++;
        el.textContent = current;
        if (current >= target) clearInterval(timer);
    }, speed);
}

function loadDashboardCounters() {
    const students = users.filter(u => u.role === "student");
    animateCounter("totalStudents", students.length);
    animateCounter("pendingStudents", students.filter(u => u.status === "pending").length);
    animateCounter("veridiedStudents", students.filter(u => u.status === "verified").length);
    animateCounter("totalEvents", events.length);
    animateCounter("totalAttendance", attendance.length);
}

// ==========================
// USER RENDERER
// ==========================
function renderUsers({ targetBodyId, role = null, status = null, search = "" }) {
    const tbody = document.getElementById(targetBodyId);
    if (!tbody) return;

    tbody.innerHTML = "";
    const keyword = search.toLowerCase();

    const filtered = users.filter(u => {
        if (role && u.role !== role) return false;
        if (status && u.status !== status) return false;
        return `${u.name} ${u.studentId || ""} ${u.role}`.toLowerCase().includes(keyword);
    });

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No data found</td></tr>`;
        return;
    }

    filtered.forEach(u => {
        const email = `${u.name.toLowerCase().replace(/\s/g, "")}@gmail.com`;
        const tr = document.createElement("tr");

        tr.innerHTML = u.role === "admin"
            ? `
                <td>🛡️</td>
                <td>${u.name}</td>
                <td>${email}</td>
                <td>${u.position}</td>
                <td>${u.status}</td>
                <td><button>Manage</button></td>
            `
            : `
                <td>👤</td>
                <td>${u.studentId}</td>
                <td>${u.name}</td>
                <td>${email}</td>
                <td>${u.status}</td>
                <td>
                    ${u.status === "pending"
                        ? `<button onclick="verifyUser(${u.id})">Verify</button>`
                        : `<button disabled>Verified</button>`
                    }
                </td>
            `;

        tbody.appendChild(tr);
    });
}

function verifyUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    user.status = "verified";
    loadDashboardCounters();
    renderUsers({ targetBodyId: "usersTableBody" });
}

// ==========================
// EVENTS RENDER
// ==========================
function renderEvents() {
    const container = document.querySelector(".event-list-content");
    if (!container) return;

    container.innerHTML = "";

    events.forEach(e => {
        const today = new Date();
        const status = new Date(e.date) < today ? "Completed" : "Upcoming";

        container.innerHTML += `
            <div class="event-row">
                <img class="profile" src="asset/img/">
                <p>${e.name}</p>
                <p>${e.date}</p>
                <p>${e.startTime}</p>
                <p>${e.endTime}</p>
                <p>${status}</p>
                <p>
                    <button class="edit" onclick="editEvent(${e.id})">Edit</button>
                    <button class="delete" onclick="deleteEvent(${e.id})">Delete</button>
                    <button class="view" onclick="viewEvent(${e.id})">View</button>
                </p>
            </div>
        `;
    });
}

// ==========================
// VIEW EVENT MODAL
// ==========================
// View Event Container
function openViewEvent() {
    viewModal.style.display = "flex";
}
function closeViewEvent() {
    viewModal.style.display = "none";
}

// View Events
const viewModal = document.querySelector(".view-event-container");
const viewClose = document.querySelector(".close-btn");

viewClose.onclick = closeViewEvent;
viewModal.onclick = e => e.target === viewModal && closeViewEvent();

function viewEvent(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;
    
    const status = new Date(event.endTime) < new Date()
    ? "Completed"
    : new Date(event.startTime) > new Date()
    ? "Upcoming"
    : "Ongoing";
    
    // Container
    const detailsContainer = document.querySelector(".view-event-details");
    
    // Elements inside
    const posterImg = detailsContainer.querySelector(".event-poster img");
    const titleEl = detailsContainer.querySelector(".event-details h3");
    const descriptionEl = detailsContainer.querySelector(".event-details p:nth-of-type(1)");
    const startTimeEl = detailsContainer.querySelector(".event-details p:nth-of-type(2)");
    const endTimeEl = detailsContainer.querySelector(".event-details p:nth-of-type(3)");
    const statusEl = detailsContainer.querySelector(".event-details p:nth-of-type(4)");
    
    // Update content
    posterImg.src = event.poster || "asset/img/Seminar.jpg";
    
    titleEl.innerHTML = `<strong>Title:</strong> ${event.name}`;
    descriptionEl.innerHTML = `<strong>Description:</strong> ${event.description}`;
    startTimeEl.innerHTML = `<strong>Start Time:</strong> ${event.startTime}`;
    endTimeEl.innerHTML = `<strong>End Time:</strong> ${event.endTime}`;
    statusEl.innerHTML = `<strong>Status:</strong> ${status}`;
    
    openViewEvent();
}

// ==========================
// DELETE EVENTS
// ==========================
const deleteModal = document.querySelector('.delete-event-overlay');
const modalBox = document.querySelector('.delete-modal-box');

let deleteEventId = null;

// Open delete modal
function deleteEvent(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;

    deleteEventId = id;

    modalBox.innerHTML = `
        <h4 id="event-name">${event.name}</h4>
        <h2>Are you sure you want to delete this event?</h2>
        <div class="button">
            <button class="delete">Delete</button>
            <button class="cancel-delete">Cancel</button>
        </div>
    `;

    deleteModal.style.display = "flex";

    // Attach listeners AFTER rendering
    modalBox.querySelector('.delete').addEventListener('click', confirmDelete);
    modalBox.querySelector('.cancel-delete').addEventListener('click', closeDeleteEvent);
}

// Confirm delete
function confirmDelete() {
    if (deleteEventId === null) return;

    events = events.filter(e => e.id !== deleteEventId);
    deleteEventId = null;

    deleteModal.style.display = "none";
    renderEvents(); // re-render your events list
}

// Close modal
function closeDeleteEvent() {
    deleteModal.style.display = "none";
    deleteEventId = null;
}

// ==========================
// EDIT EVENTS
// ==========================
const editOverlay = document.querySelector('.edit-event-overlay');

const editName = document.getElementById('edit-event-name');
const editDescription = document.getElementById('edit-event-description');
const editDate = document.getElementById('edit-event-date');
const editPlace = document.getElementById('edit-event-place');
const editStart = document.getElementById('edit-event-start');
const editEnd = document.getElementById('edit-event-end');

// edit event poster
const editPoster = document.getElementById('edit-event-poster');
const editPosterInput = document.getElementById('edit-poster-input');

let newPosterFile = null;
let editEventId = null;

// Edit Events Modal
function editEvent(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;

    editEventId = id;

    editName.value = event.name;
    editDescription.value = event.description;
    editDate.value = event.date;
    editPlace.value = event.place;
    editStart.value = event.startTime;
    editEnd.value = event.endTime;

    // Load old poster
    editPoster.src = event.poster;

    // Reset newPosterFile
    newPosterFile = null;

    document.querySelector('.edit-event-overlay').style.display = "flex";
}

// live Preview of the poster
editPoster.addEventListener('click', () => {
    editPosterInput.click();
});

editPosterInput.addEventListener('change', () => {
    const file = editPosterInput.files[0];
    if (!file) return;
    editPoster.src = URL.createObjectURL(file);
});


// saving the edited data
function saveEdit() {
    const event = events.find(e => e.id === editEventId);
    if (!event) return;

    event.name = editName.value.trim();
    event.description = editDescription.value.trim();
    event.place = editPlace.value.trim();
    event.date = editDate.value.trim();
    event.startTime = editStart.value;
    event.endTime = editEnd.value;

    // 🖼️ Save poster
    if (newPosterFile) {
        event.poster = editPoster.src;
    }

    closeEdit();
    renderEvents();
}

// Close Edits
function closeEdit() {
    document.querySelector('.edit-event-overlay').style.display = "none";
    editEventId = null;
    editPosterInput.value = "";
    newPosterFile = null;
}

// ==========================
// ATTENDANCE SYSTEM
// ==========================

// Event Cards
function renderEventCards() {
    const eventCardContainer = document.querySelector(".event-card-container");
    eventCardContainer.innerHTML = ""; // clear old cards
    
    events.forEach(e => {
        const card = document.createElement("div");
        card.classList.add("event-card");
        card.innerHTML = `
        <img src="${e.poster}" alt="event image" class="event-image">
        <div class="action-container">
        <h1>${e.name}</h1>
        <p>${e.description}</p>
        <button onclick="viewAttendance(${e.id})">View Attendance</button>
        </div>
        `;
        eventCardContainer.appendChild(card);
    });
}

// -------------------------
// Global Variables
// -------------------------
let html5QrcodeScanner = null;
let currentEventId = null;

// -------------------------
// Open / Close Overlay
// -------------------------
const attendanceOverlay = document.querySelector(".event-attendance-overlay");

document.getElementById("closeAttendance").addEventListener("click", () => {
    stopScanner();
    attendanceOverlay.style.display = "none";
});

function viewAttendance(eventId) {
    currentEventId = eventId;
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    attendanceOverlay.querySelector(".header h1").textContent = event.name;
    renderAttendanceLogs(eventId);
    
    attendanceOverlay.style.display = "flex";
}

// -------------------------
// Render Attendance Logs
// -------------------------
function renderAttendanceLogs(eventId) {
    const logsContainer = attendanceOverlay.querySelector(".logs");
    logsContainer.innerHTML = "";
    
    const eventAttendance = attendance.filter(a => a.eventId === eventId);
    
    if (!eventAttendance.length) {
        logsContainer.innerHTML = `<p style="text-align:center;">No attendance yet.</p>`;
        return;
    }
    
    eventAttendance.forEach(a => {
        const student = users.find(u => u.id === a.userId);
        if (!student) return;
        
        const div = document.createElement("div");
        div.classList.add("log");
        div.innerHTML = `
        <div class="log-data">${student.studentId}</div>
        <div class="log-data">${student.name}</div>
        <div class="log-data">${a.timeIn}</div>
        <div class="log-data">${a.timeOut}</div>
        <div class="log-data">${a.finalStatus || a.status}</div>
        <div class="log-data">
        <button onclick="deleteAttendance(${a.id})">Remove</button>
        </div>
        `;
        logsContainer.appendChild(div);
    });
}

// -------------------------
// CRUD Functions
// -------------------------
function updateTimeIn(attId, value) {
    const att = attendance.find(a => a.id === attId);
    if (att) att.timeIn = value;
}

function updateTimeOut(attId, value) {
    const att = attendance.find(a => a.id === attId);
    if (att) att.timeOut = value;
}

function updateStatus(attId, value) {
    const att = attendance.find(a => a.id === attId);
    if (att) att.status = value;
}

function deleteAttendance(attId) {
    attendance = attendance.filter(a => a.id !== attId);
    renderAttendanceLogs(currentEventId);
}

// -------------------------
// QR Code Scanner (Create Attendance)
// -------------------------
function startScanner() {
    if (!currentEventId) return;

    if (html5QrcodeScanner) stopScanner();

    html5QrcodeScanner = new Html5Qrcode("reader");
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        qrCodeMessage => {

            const student = users.find(
                u => u.studentId === qrCodeMessage && u.role === "student"
            );
            if (!student) return alert("Student not found!");

            const event = events.find(e => e.id === currentEventId);
            if (!event) return;

            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const startMinutes = toMinutes(event.startTime);
            const endMinutes = toMinutes(event.endTime);

            let record = attendance.find(
                a => a.eventId === currentEventId && a.userId === student.id
            );

            // ======================
            // TIME IN
            // ======================
            if (!record) {
                const timeInStatus =
                    currentMinutes <= startMinutes ? "Present" : "Late";

                record = {
                    id: attendance.length + 1,
                    userId: student.id,
                    eventId: currentEventId,
                    timeIn: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    timeOut: "",
                    status: timeInStatus,
                    timeOutStatus: "",
                    finalStatus: timeInStatus
                };

                attendance.push(record);
                renderAttendanceLogs(currentEventId);
                return;
            }

            // ======================
            // TIME OUT
            // ======================
            if (!record.timeOut) {
                const timeOutStatus =
                    currentMinutes < endMinutes ? "Early Out" : "Present";

                record.timeOut = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                record.timeOutStatus = timeOutStatus;
                record.finalStatus = getFinalStatus(record, event);

                renderAttendanceLogs(currentEventId);
                return;
            }

            alert("Attendance already completed.");
        }
    ).catch(err => console.error(err));
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            html5QrcodeScanner.clear();
            html5QrcodeScanner = null;
        }).catch(err => console.error(err));
    }
}

// -------------------------
// Buttons
// -------------------------
document.getElementById("startBtn").addEventListener("click", startScanner);
document.getElementById("stopBtn").addEventListener("click", stopScanner);

// ==========================
// REPORT LOGS
// ==========================

// REPORT OVERLAY ELEMENTS
const reportOverlay = document.querySelector(".view-report-overlay");
const reportTitle = reportOverlay.querySelector(".report-header h1");
const reportLogs = reportOverlay.querySelector(".logs");
const closeReportBtn = document.getElementById("close-report");
const searchFinalReports = document.getElementById("search-final-reports");

// Open & close report overlay functions
function openReportOverlay() {
    reportOverlay.style.display = "flex";
}

function closeReportOverlay() {
    reportOverlay.style.display = "none";
    reportLogs.innerHTML = ""; // clean slate
    searchFinalReports.value= "";
}

// Render report logs with search support for Specific Event
function renderReportLogs(eventId, keyword = "") {
    reportLogs.innerHTML = "";

    const filteredAttendance = attendance.filter(a => {
        if (a.eventId !== eventId) return false;

        const student = users.find(u => u.id === a.userId);
        if (!student) return false;

        return (
            student.name.toLowerCase().includes(keyword) ||
            student.studentId.toLowerCase().includes(keyword)
        );
    });

    if (!filteredAttendance.length) {
        reportLogs.innerHTML = `<p style="text-align:center;">No records found.</p>`;
        return;
    }

    filteredAttendance.forEach(a => {
        const student = users.find(u => u.id === a.userId);
        if (!student) return;

        const row = document.createElement("div");
        row.classList.add("log");

        row.innerHTML = `
            <div class="log-data">${student.studentId}</div>
            <div class="log-data">${student.name}</div>
            <div class="log-data">${a.timeIn || "-"}</div>
            <div class="log-data">${a.timeOut || "-"}</div>
            <div class="log-data">${a.finalStatus || a.status}</div>
            <div class="log-data">
                <button onclick="deleteAttendance(${a.id})">Remove</button>
            </div>
        `;

        reportLogs.appendChild(row);
    });
}


// Auto Mark Absent
function markAbsent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    users
        .filter(u => u.role === "student")
        .forEach(student => {
            const exists = attendance.find(
                a => a.eventId === eventId && a.userId === student.id
            );

            if (!exists) {
                attendance.push({
                    id: attendance.length + 1,
                    userId: student.id,
                    eventId: eventId,
                    timeIn: "",
                    timeOut: "",
                    status: "Absent",
                    finalStatus: "Absent"
                });
            }
        });
}

//  Main functions to view reports
function viewReports(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    currentReportEventId = eventId;
    reportTitle.textContent = event.name;
    renderReportLogs(eventId);
    openReportOverlay();
}


// Report List
function reportList() {
    const container = document.querySelector('.report-list-container');

    container.innerHTML = "";

    events.forEach(e => {
        const list = document.createElement("div");
        list.classList.add("report-content");

        list.innerHTML = `
            <img src="${e.poster}" alt="Event Title">
            <h1>${e.name}</h1>
            <div class="report-actions">
                <button onclick="viewReports(${e.id})">View Reports</button>
                
            </div>  
        `;

        // THIS was missing
        container.appendChild(list);
    });
}

// search functions
searchFinalReports.addEventListener("input", e => {
    if (!currentReportEventId) return;
    renderReportLogs(currentReportEventId, e.target.value.toLowerCase());
});

// ==========================
// EXPORT FUNCTIONS (CSV & PDF)
// ==========================

// 📦 Export to CSV
function exportToCSV(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return alert("Event not found!");

    const data = attendance
        .filter(a => a.eventId === eventId)
        .map(a => {
            const student = users.find(u => u.id === a.userId);
            return {
                "Student ID": student?.studentId || "-",
                "Name": student?.name || "-",
                "Time In": a.timeIn || "-",
                "Time Out": a.timeOut || "-",
                "Status": a.status || "-"
            };
        });

    if (!data.length) {
        alert("No attendance records found for this event!");
        return;
    }

    // Convert to CSV format
    const header = Object.keys(data[0]).join(",");
    const rows = data.map(obj => Object.values(obj).join(","));
    const csv = [header, ...rows].join("\n");

    // Download as file
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event.name.replace(/\s+/g, "_")}_attendance.csv`;
    link.click();
}

// 🧾 Export to PDF (using jsPDF)
function exportToPDF(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return alert("Event not found!");

    const data = attendance
        .filter(a => a.eventId === eventId)
        .map(a => {
            const student = users.find(u => u.id === a.userId);
            return [
                student?.studentId || "-",
                student?.name || "-",
                a.timeIn || "-",
                a.timeOut || "-",
                a.status || "-"
            ];
        });

    if (!data.length) {
        alert("No attendance records found for this event!");
        return;
    }

    // create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(`${event.name} - Attendance Report`, 14, 15);

    const headers = ["Student ID", "Name", "Time In", "Time Out", "Status"];
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 25,
        styles: { fontSize: 10, halign: "center" },
        headStyles: { fillColor: [0, 102, 204] }
    });

    doc.save(`${event.name.replace(/\s+/g, "_")}_attendance.pdf`);
}

// ==========================
// EXPORT BUTTON HANDLERS
// ==========================

document.getElementById("export-csv").addEventListener("click", () => {
    if (!currentReportEventId) return alert("No event selected!");
    exportToCSV(currentReportEventId);
});

document.getElementById("export-pdf").addEventListener("click", () => {
    if (!currentReportEventId) return alert("No event selected!");
    exportToPDF(currentReportEventId);
});

// ==========================
// EXPORT BUTTON HANDLERS
// ==========================
function logout() {
    if (confirm("Are you sure you want to logout?")) {
        window.location.href = "../../clientSide/auth.html";
    }
}