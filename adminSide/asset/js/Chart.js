// **************************
//    CHART INITIALIZER
// **************************
let attendanceChart;
let verificationChart;

function loadCharts() {
    const attendanceCtx = document.getElementById("attendanceChart");
    const verificationCtx = document.getElementById("verificationChart");

    if (!attendanceCtx || !verificationCtx) return;

    // Destroy existing charts (important when switching tabs)
    if (attendanceChart) attendanceChart.destroy();
    if (verificationChart) verificationChart.destroy();

    attendanceChart = new Chart(attendanceCtx, {
        type: "bar",
        data: {
            labels: events.map(e => e.name),
            datasets: [{
                label: "Attendance Count",
                data: events.map(
                    e => attendance.filter(a => a.eventId === e.id).length
                ),
                borderWidth: 1,
                tension: 0.3
            }]
        }
    });

    verificationChart = new Chart(verificationCtx, {
        type: "doughnut",
        data: {
            labels: ["Verified", "Pending"],
            datasets: [{
                data: [
                    users.filter(u => u.status === "verified").length,
                    users.filter(u => u.status === "pending").length
                ]
            }]
        }
    });
}


// **************************
//    CREATE EVENT TOGGLE
// **************************

const openButton = document.getElementById('open-button');
const closeButton = document.getElementById('close-container');
const eventContainer = document.querySelector('.event-container');
const backdrop = document.getElementById('modal-backdrop');

function openModal() {
    eventContainer.style.display = "flex";
    backdrop.style.display = "block";
    document.body.classList.add("modal-open");
}

function closeModal() {
    eventContainer.style.display = "none";
    backdrop.style.display = "none";
    document.body.classList.remove("modal-open");
}

openButton.onclick = openModal;
closeButton.onclick = closeModal;

// Click outside = close
backdrop.onclick = closeModal;

// Optional: ESC key closes modal (classic UX)
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && eventContainer.style.display === "flex") {
        closeModal();
    }
});