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

// 📌 Función para obtener sesiones con paginación
async function fetchSesiones(page) {
    try {
        const response = await fetch(`/sesiones/?page=${page}&per_page=${sessionsPerPage}`);
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
            <span>Sesión ${index + 1 + (currentPage - 1) * sessionsPerPage}: ${sesion.descripcion_sesion} - ${sesion.fecha_inicio} a las ${sesion.hora_inicio}</span>
        `;

        // 📌 Evento de clic (por ahora no redirige)
        sessionDiv.addEventListener("click", () => {
            console.log(`Sesión seleccionada: ${sesion.descripcion_sesion}`);
            mostrarMensaje(`Seleccionaste: ${sesion.descripcion_sesion}`, "success");
        });

        sessionContainer.appendChild(sessionDiv);
    });
}


// 📌 Actualizar los controles de paginación
function updatePagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    if (totalPages > 1) {
        let maxVisiblePages = 5; // Número máximo de páginas visibles antes de mostrar "..."
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

// 📌 Crear sesión
async function crearSesion() {
    const desc = document.getElementById("session-desc").value;
    const date = document.getElementById("session-date").value;
    const time = document.getElementById("session-time").value;
    const id_paciente = 1;  // ⚠️ Cambiar según el paciente actual

    if (!desc || !date || !time) {
        mostrarMensaje("Por favor, completa todos los campos.", "error");
        return;
    }

    try {
        const response = await fetch("/sesiones/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_paciente, descripcion: desc, fecha: date, hora: time })
        });

        if (!response.ok) throw new Error("Error al crear la sesión");

        mostrarMensaje("Sesión creada exitosamente", "success");
        fetchSesiones(currentPage); // Recargar sesiones después de agregar
    } catch (error) {
        mostrarMensaje("Error al crear sesión", "error");
        console.error(error);
    }
}

// 📌 Renderizar el calendario dentro de la sección correcta
function renderCalendar() {
    const monthYear = document.getElementById("month-year");
    const calendarDays = document.getElementById("calendar-days");

    if (!monthYear || !calendarDays) {
        console.error("No se encontró el contenedor del calendario. Verifica el HTML.");
        return;
    }

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

// 📌 Cambiar mes en el calendario
function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

// 📌 Cargar calendario y sesiones al inicio
renderCalendar();
fetchSesiones(currentPage);
