
import { verificarSesionYRedirigir } from "./verificar_sesion.js";

document.addEventListener("DOMContentLoaded", () => {
    if (!verificarSesionYRedirigir()) return; // ⛔ Si no hay sesión, no continúa
    let currentPage = 1;
    const sessionsPerPage = 4;
    let currentDate = new Date();
    let contadorPorTerapeuta = {}; // 🔥 Mantendrá el conteo aunque cambie de página

    // 📌 Función para mostrar mensajes de éxito o error
    function showMessage(text, type = "success") {
        // 🔧 Crear el contenedor si no existe
        let container = document.getElementById("message-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "message-container";
            document.body.appendChild(container);
        }
    
        // 🧊 Crear el mensaje
        const message = document.createElement("div");
        message.className = `message ${type}`;
    
        const icon = {
            success: "",
            error: "",
            warning: ""
        }[type] || "";
    
        message.innerHTML = `<span class="message-icon">${icon}</span> ${text}`;
    
        container.appendChild(message);
    
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
    

    // 📌 Obtener ID del paciente desde localStorage
    const idPaciente = localStorage.getItem("id_paciente");
    if (!idPaciente) {
        showMessage("No hay paciente seleccionado.", "error");
        window.location.href = "/principal";
        throw new Error("No hay paciente seleccionado.");
    }

    // 📌 Función para obtener sesiones con paginación
    async function fetchSesiones(page = 1) {
        try {
            let idTerapeuta = localStorage.getItem("id_terapeuta");

            if (!idTerapeuta) {
                console.error("❌ No se encontró id_terapeuta en localStorage.");
                showMessage("Error: No se encontró el terapeuta actual.", "error");
                return;
            }

            const response = await fetch(`/sesiones/?id_paciente=${idPaciente}&id_terapeuta_actual=${idTerapeuta}&page=${page}&per_page=${sessionsPerPage}`);

            if (!response.ok) throw new Error("No se pudieron obtener las sesiones");

            const data = await response.json();
            renderSesionesPorTerapeuta(data.terapeutas);
            updatePagination(data.total_pages, page);
        } catch (error) {
            showMessage("Error al obtener sesiones", "error");
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
    window.renderSesiones = renderSesiones;


    function renderSesionesPorTerapeuta(terapeutas) {
        const sessionContainer = document.getElementById("sessions-container");
        sessionContainer.innerHTML = "";

        if (terapeutas.length === 0) {
            sessionContainer.innerHTML = "<p>No hay sesiones registradas.</p>";
            return;
        }

        const idTerapeutaActual = localStorage.getItem("id_terapeuta");

        // 🔄 Reordenar para que el terapeuta actual esté primero
        terapeutas.sort((a, b) => {
            if (a.id_terapeuta == idTerapeutaActual) return -1;
            if (b.id_terapeuta == idTerapeutaActual) return 1;
            return 0;
        });

        terapeutas.forEach((terapeuta) => {
            const terapeutaSection = document.createElement("div");
            terapeutaSection.classList.add("terapeuta-section");

            // 🎨 Si es el terapeuta actual, agregar clase especial
            if (terapeuta.id_terapeuta == idTerapeutaActual) {
                terapeutaSection.classList.add("mis-sesiones");
            }

            const terapeutaTitle = document.createElement("h3");
            terapeutaTitle.textContent = `Terapeuta: ${terapeuta.terapeuta}`;
            terapeutaSection.appendChild(terapeutaTitle);

            const sesionesContainer = document.createElement("div");
            sesionesContainer.classList.add("terapeuta-sessions");

            const primerasSesiones = terapeuta.sesiones.slice(0, 3);
            primerasSesiones.forEach((sesion, index) => {
                const sessionDiv = document.createElement("div");
                sessionDiv.classList.add("session-grid-item");

                sessionDiv.innerHTML = `
                    <div class="session-content">
                        <h4>Sesión ${index + 1}</h4>
                        <p>Fecha: ${sesion.fecha_inicio}</p>
                        <p>Hora: ${sesion.hora_inicio}</p>
                    </div>
                `;

                sessionDiv.addEventListener("click", () => {
                    localStorage.setItem("id_sesion", sesion.id_sesion);
                    localStorage.setItem("nombre_sesion", `Sesión ${index + 1}`);
                    window.location.href = "/detalle_sesiones";
                });

                sesionesContainer.appendChild(sessionDiv);
            });

            terapeutaSection.appendChild(sesionesContainer);

            if (terapeuta.sesiones.length > 3) {
                const verMasBtn = document.createElement("button");
                verMasBtn.classList.add("ver-mas-btn", "btn");
                verMasBtn.textContent = "Ver más sesiones";
                verMasBtn.addEventListener("click", () => {
                    mostrarModalSesiones(terapeuta);
                });
                terapeutaSection.appendChild(verMasBtn);
            }

            sessionContainer.appendChild(terapeutaSection);
        });
    }





    function mostrarModalSesiones(terapeuta) {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";

        const modal = document.createElement("div");
        modal.className = "modal-confirm modal-sesiones";

        modal.innerHTML = `
            <h2>Sesiones de ${terapeuta.terapeuta}</h2>
            <div class="modal-sesiones-list">
                ${terapeuta.sesiones.map((sesion, i) => `
                    <button class="modal-sesion-btn" data-id="${sesion.id_sesion}">
                        <strong>Sesión ${i + 1}</strong><br>
                        ${sesion.fecha_inicio} - ${sesion.hora_inicio}
                    </button>
                `).join("")}
            </div>
            <div class="modal-buttons">
                <button class="btn-secondary" id="cerrarModalSesiones">Cerrar</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById("cerrarModalSesiones").onclick = () => overlay.remove();

        // Redirigir al hacer clic en una sesión
        modal.querySelectorAll(".modal-sesion-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const idSesion = btn.dataset.id;
                localStorage.setItem("id_sesion", idSesion);
                localStorage.setItem("nombre_sesion", btn.textContent.trim().split("\n")[0]);
                window.location.href = "/detalle_sesiones";
            });
        });
    }


    // 📌 Verificar si hay sesión activa al cargar sesiones
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
        const idTerapeuta = localStorage.getItem("id_terapeuta");

        if (!desc || !date || !time || !idTerapeuta) {
            showMessage("Completa todos los campos.", "warning");
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

            showMessage("Sesión creada exitosamente", "success");
            // Refetch and render sessions to update the container
            fetchSesiones(currentPage);
        } catch (error) {
            showMessage("Error al crear sesión: " + error.message, "error");
        }
    }

    window.crearSesion = crearSesion;





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
    window.changeMonth = changeMonth;

    // 📌 Cargar calendario y sesiones al inicio
    renderCalendar();
    fetchSesiones(currentPage);


    
        const homeButton = document.querySelector(".home-button");

        if (homeButton) {
            homeButton.addEventListener("click", (e) => {
                e.preventDefault();

                const overlay = document.createElement("div");
                overlay.className = "modal-overlay";

                const modal = document.createElement("div");
                modal.className = "modal-confirm";

                modal.innerHTML = `
                    <h2>¿Ir al inicio?</h2>
                    <p>⚠ Al volver al inicio, <strong>se cerrará esta sección</strong> y podrías perder el progreso actual.<br>
                    ¿Deseas continuar?</p>
                    <div class="modal-buttons">
                        <button class="btn-secondary" id="cancelarInicio">Cancelar</button>
                        <button class="btn-danger" id="confirmarInicio">Ir al inicio</button>
                    </div>
                `;

                overlay.appendChild(modal);
                document.body.appendChild(overlay);

                document.getElementById("cancelarInicio").onclick = () => {
                    overlay.remove();
                };

                document.getElementById("confirmarInicio").onclick = async () => {
                    overlay.remove();

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

                    localStorage.removeItem("id_sesion");
                    localStorage.removeItem("nombre_sesion");
                    localStorage.removeItem("sesion_dispositivo_ids");

                    window.location.href = "/principal";
                };
            });
        }

});