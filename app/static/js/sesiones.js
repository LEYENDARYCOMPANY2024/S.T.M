let currentPage = 1;
const sessionsPerPage = 4;
let currentDate = new Date();

// 📌 Función para mostrar mensajes de éxito o error
function mostrarMensaje(mensaje, tipo = "success") {
    const alertBox = document.createElement("div");
    alertBox.classList.add("alert", tipo === "success" ? "success" : "error");
    alertBox.innerHTML = `
        <span class="alert-icon">${tipo === "success" ? "✅" : "❌"}</span> 
        ${mensaje}
    `;
    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.classList.add("show");
    }, 100);

    setTimeout(() => {
        alertBox.classList.remove("show");
        setTimeout(() => alertBox.remove(), 300);
    }, 3000);
}

// 📌 Obtener ID del paciente desde localStorage
const idPaciente = localStorage.getItem("id_paciente");
if (!idPaciente) {
    mostrarMensaje("No hay paciente seleccionado.", "error");
    window.location.href = "/principal";
    throw new Error("No hay paciente seleccionado.");
}

// 📌 Función para obtener sesiones con paginación
async function fetchSesiones(page) {
    try {
        const response = await fetch(`/sesiones/?id_paciente=${idPaciente}&page=${page}&per_page=${sessionsPerPage}`);
        if (!response.ok) throw new Error("No se pudieron obtener las sesiones");

        const data = await response.json();
        renderSesiones(data.sesiones);
        updatePagination(data.total_pages, data.page);
    } catch (error) {
        mostrarMensaje("Error al obtener sesiones", "error");
        console.error(error);
    }
}

// 📌 Renderizar sesiones en la interfaz con botones interactivos
function renderSesiones(sesiones) {
    const sessionContainer = document.getElementById("sessions-container");
    sessionContainer.innerHTML = ""; // Limpiar sesiones previas

    if (sesiones.length === 0) {
        sessionContainer.innerHTML = "<p>No hay sesiones registradas.</p>";
        return;
    }

    sesiones.forEach((sesion, index) => {
        const sessionDiv = document.createElement("button"); // Convertir en botón
        sessionDiv.classList.add("session-button");
        sessionDiv.innerHTML = `
            <span>Sesión ${index + 1 + (currentPage - 1) * sessionsPerPage}: ${sesion.fecha_inicio} a las ${sesion.hora_inicio}</span>
        `;

        // 📌 Redirige al detalle de la sesión al hacer clic
        sessionDiv.addEventListener("click", () => {
            localStorage.setItem("id_sesion", sesion.id_sesion);  // ✅ Guardar el ID correctamente
            localStorage.setItem("nombre_sesion", `Sesión ${index + 1 + (currentPage - 1) * sessionsPerPage}`);  // ✅ Guardar el nombre correctamente
            console.log(`📝 ID de sesión guardado: ${sesion.id_sesion}`);
            console.log(`📌 Nombre de sesión guardado: Sesión ${index + 1 + (currentPage - 1) * sessionsPerPage}`);
            window.location.href = "/detalle_sesiones";  // ✅ Redirigir al detalle
        });

        sessionContainer.appendChild(sessionDiv);
    });
}



// 📌 Verificar si hay sesión activa al cargar sesiones
document.addEventListener("DOMContentLoaded", () => {
    const idSesion = localStorage.getItem("id_sesion");
    const currentPath = window.location.pathname;
    const sessionContainer = document.getElementById("sessions-container");

    // 📌 Si hay sesión activa y el usuario está en "/sesiones", ocultar solo la lista de sesiones antes de redirigir
    if (currentPath === "/sesiones" && idSesion) {
        console.log("🔄 Sesión activa detectada, redirigiendo a detalle_sesiones.");
        if (sessionContainer) {
            sessionContainer.style.display = "none";  // 🔹 Oculta solo la lista de sesiones
        }
        window.location.replace("/detalle_sesiones"); // ✅ Redirección sin pantallazo
    }
});





// 📌 Actualizar los controles de paginación
function updatePagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    if (totalPages > 1) {
        let maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (currentPage > 1) {
            let firstPageBtn = document.createElement("button");
            firstPageBtn.textContent = "«";
            firstPageBtn.classList.add("pagination-btn", "pagination-nav");
            firstPageBtn.addEventListener("click", () => fetchSesiones(1));
            paginationContainer.appendChild(firstPageBtn);
        }

        if (startPage > 1) {
            let dots = document.createElement("span");
            dots.textContent = "...";
            dots.classList.add("pagination-dots");
            paginationContainer.appendChild(dots);
        }

        for (let i = startPage; i <= endPage; i++) {
            const button = document.createElement("button");
            button.textContent = i;
            button.classList.add("pagination-btn");
            if (i === currentPage) {
                button.classList.add("active");
            }
            button.addEventListener("click", () => fetchSesiones(i));
            paginationContainer.appendChild(button);
        }

        if (endPage < totalPages) {
            let dots = document.createElement("span");
            dots.textContent = "...";
            dots.classList.add("pagination-dots");
            paginationContainer.appendChild(dots);
        }

        if (currentPage < totalPages) {
            let lastPageBtn = document.createElement("button");
            lastPageBtn.textContent = "»";
            lastPageBtn.classList.add("pagination-btn", "pagination-nav");
            lastPageBtn.addEventListener("click", () => fetchSesiones(totalPages));
            paginationContainer.appendChild(lastPageBtn);
        }
    }
}


async function crearSesion() {
    const desc = document.getElementById("session-desc").value;
    let date = document.getElementById("session-date").value;
    const time = document.getElementById("session-time").value;

    if (!desc || !date || !time) {
        mostrarMensaje("Por favor, completa todos los campos.", "error");
        return;
    }

    // ✅ Ajustar la fecha para evitar conversión incorrecta de zona horaria
    const selectedDate = new Date(date + "T00:00:00");  // Convertir a Date en la zona horaria del navegador
    selectedDate.setMinutes(selectedDate.getMinutes() - selectedDate.getTimezoneOffset());  // Ajustar a UTC
    date = selectedDate.toISOString().split("T")[0];  // Convertir de nuevo a YYYY-MM-DD

    console.log(`📌 Fecha corregida antes de enviarla al backend: ${date}`);

    try {
        const response = await fetch(
            `/sesiones/?id_paciente=${idPaciente}&descripcion=${encodeURIComponent(desc)}&fecha=${date}&hora=${time}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error: ${errorData.detail}`);
        }

        mostrarMensaje("Sesión creada exitosamente", "success");
        fetchSesiones(currentPage);

    } catch (error) {
        console.error("❌ Error al crear la sesión:", error);
        mostrarMensaje("Error al crear sesión: " + error.message, "error");
    }
}






// 📌 Alternar visibilidad del calendario
function toggleCalendar() {
    document.getElementById("calendar-container").classList.toggle("hidden");
}

// 📌 Renderizar el calendario
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function renderCalendar() {
    const monthYear = document.getElementById("month-year");
    const calendarDays = document.getElementById("calendar-days");

    if (!monthYear || !calendarDays) {
        console.error("No se encontró el contenedor del calendario.");
        return;
    }

    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

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

        // 📌 Bloquear fechas anteriores a hoy
        if (year < todayYear || (year === todayYear && month < todayMonth) || (year === todayYear && month === todayMonth && i < todayDate)) {
            dayCell.classList.add("disabled"); // 🔴 Bloquear días pasados
        } else {
            dayCell.addEventListener("click", () => {
                document.getElementById("session-date").value = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
                toggleCalendar();
            });
        }

        calendarDays.appendChild(dayCell);
    }
}



// 📌 Cambiar mes en el calendario
function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

// 📌 Cargar calendario y sesiones al inicio
renderCalendar();
fetchSesiones(currentPage);