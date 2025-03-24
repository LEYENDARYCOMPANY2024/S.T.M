let currentPage = 1;
const sessionsPerPage = 4;
let currentDate = new Date();
let contadorPorTerapeuta = {}; // 🔥 Mantendrá el conteo aunque cambie de página

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
async function fetchSesiones(page = 1) {
    try {
        let idTerapeuta = localStorage.getItem("id_terapeuta");

        if (!idTerapeuta) {
            console.error("❌ No se encontró id_terapeuta en localStorage.");
            mostrarMensaje("Error: No se encontró el terapeuta actual.", "error");
            return;
        }

        const response = await fetch(`/sesiones/?id_paciente=${idPaciente}&id_terapeuta_actual=${idTerapeuta}&page=${page}&per_page=${sessionsPerPage}`);

        if (!response.ok) throw new Error("No se pudieron obtener las sesiones");

        const data = await response.json();
        renderSesionesPorTerapeuta(data.terapeutas);
        updatePagination(data.total_pages, page);
    } catch (error) {
        mostrarMensaje("Error al obtener sesiones", "error");
        console.error(error);
    }
}




// 📌 Renderizar sesiones en la interfaz con botones interactivos
function renderSesiones(data) {
    const sessionContainer = document.getElementById("sessions-container");
    sessionContainer.innerHTML = "";

    let sesionesAMostrar = mostrarSesionesPropias ? data.propias : data.otros;

    if (sesionesAMostrar.length === 0) {
        sessionContainer.innerHTML = "<p>No hay sesiones registradas.</p>";
        return;
    }

    sesionesAMostrar.forEach((sesion, index) => {
        const sessionDiv = document.createElement("button");
        sessionDiv.classList.add("session-button");

        sessionDiv.innerHTML = `
            <span>
                Sesión ${index + 1}: ${sesion.fecha_inicio} a las ${sesion.hora_inicio}
            </span><br>
            <small>Terapeuta: ${sesion.terapeuta}</small>
        `;

        sessionDiv.addEventListener("click", () => {
            localStorage.setItem("id_sesion", sesion.id_sesion);
            localStorage.setItem("nombre_sesion", `Sesión ${index + 1}`);
            window.location.href = "/detalle_sesiones";
        });

        sessionContainer.appendChild(sessionDiv);
    });

    // 🔥 Botón para alternar entre sesiones propias y de otros terapeutas
    const toggleButton = document.createElement("button");
    toggleButton.classList.add("toggle-sessions-btn");
    toggleButton.textContent = mostrarSesionesPropias ? "Ver sesiones anteriores" : "Ver mis sesiones";
    
    toggleButton.addEventListener("click", () => {
        mostrarSesionesPropias = !mostrarSesionesPropias;
        renderSesiones(data);
    });

    sessionContainer.appendChild(toggleButton);
}


function renderSesionesPorTerapeuta(terapeutas) {
    const sessionContainer = document.getElementById("sessions-container");
    sessionContainer.innerHTML = "";

    if (terapeutas.length === 0) {
        sessionContainer.innerHTML = "<p>No hay sesiones registradas.</p>";
        return;
    }

    terapeutas.forEach((terapeuta) => {
        const terapeutaDiv = document.createElement("div");
        terapeutaDiv.classList.add("terapeuta-container");

        terapeutaDiv.innerHTML = `<h3>Terapeuta: ${terapeuta.terapeuta}</h3>`;

        terapeuta.sesiones.forEach((sesion, index) => {
            const sessionDiv = document.createElement("button");
            sessionDiv.classList.add("session-button");

            sessionDiv.innerHTML = `
                <span>
                    Sesión ${index + 1}: ${sesion.fecha_inicio} a las ${sesion.hora_inicio}
                </span>
            `;

            sessionDiv.addEventListener("click", () => {
                localStorage.setItem("id_sesion", sesion.id_sesion);
                localStorage.setItem("nombre_sesion", `Sesión ${index + 1}`);
                window.location.href = "/detalle_sesiones";
            });

            terapeutaDiv.appendChild(sessionDiv);
        });

        sessionContainer.appendChild(terapeutaDiv);
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
    const idTerapeuta = localStorage.getItem("id_terapeuta"); // 🔥 importante

    if (!desc || !date || !time || !idTerapeuta) {
        mostrarMensaje("Completa todos los campos.", "error");
        return;
    }

    const selectedDate = new Date(date + "T00:00:00");
    selectedDate.setMinutes(selectedDate.getMinutes() - selectedDate.getTimezoneOffset());
    date = selectedDate.toISOString().split("T")[0];

    try {
        const response = await fetch(
            `/sesiones/?id_paciente=${idPaciente}&descripcion=${encodeURIComponent(desc)}&fecha=${date}&hora=${time}&id_terapeuta=${idTerapeuta}`,
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


document.addEventListener("DOMContentLoaded", () => {
    const homeButton = document.querySelector(".home-button");
    if (homeButton) {
        homeButton.addEventListener("click", async (e) => {
            e.preventDefault(); // ✋ prevenir redirección inmediata

            const sesionId = localStorage.getItem("id_sesion");

            if (sesionId) {
                try {
                    await fetch(`/dispositivos/desactivar/${sesionId}`, {
                        method: "PUT"
                    });
                    console.log("🔌 Dispositivos desactivados correctamente.");
                } catch (error) {
                    console.error("❌ Error al desactivar dispositivos:", error);
                }
            }

            console.log("🏠 Limpiando localStorage al volver a principal...");
            localStorage.removeItem("id_sesion");
            localStorage.removeItem("nombre_sesion");
            localStorage.removeItem("sesion_dispositivo_ids");

            // ✅ Redirigir luego de limpiar todo
            window.location.href = "/principal";
        });
    }
});
