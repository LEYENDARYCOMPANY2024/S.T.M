let currentDate = new Date();

function renderCalendar() {
    const monthYear = document.getElementById("month-year");
    const calendarDays = document.getElementById("calendar-days");
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    
    monthYear.textContent = `${monthNames[month]} ${year}`;
    calendarDays.innerHTML = "";
    
    let firstDay = new Date(year, month, 1).getDay();
    let lastDate = new Date(year, month + 1, 0).getDate();
    let startDay = (firstDay === 0) ? 6 : firstDay - 1;
    
    for (let i = 0; i < startDay; i++) {
        let emptyCell = document.createElement("div");
        emptyCell.classList.add("empty");
        calendarDays.appendChild(emptyCell);
    }
    
    for (let i = 1; i <= lastDate; i++) {
        let dayCell = document.createElement("div");
        dayCell.classList.add("day");
        dayCell.textContent = i;
        calendarDays.appendChild(dayCell);
    }
}
//agregar sesiones 
function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

renderCalendar();


let sessionCount = 0;

function crearSesion() {
    sessionCount++;
    const desc = document.getElementById("session-desc").value;
    const date = document.getElementById("session-date").value;
    const time = document.getElementById("session-time").value;

    if (!desc || !date || !time) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const sessionContainer = document.getElementById("sessions-container");
    const sessionDiv = document.createElement("div");
    sessionDiv.classList.add("session-button");
    sessionDiv.innerHTML = `
        <span>Sesión ${sessionCount}: ${desc} - ${date} a las ${time}</span>
    `;
    sessionContainer.appendChild(sessionDiv);
}