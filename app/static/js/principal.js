document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("session_token");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    function parseJwt(token) {
        try {
            return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
            return null;
        }
    }

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.sub) {
        localStorage.removeItem("session_token");
        window.location.href = "/login";
        return;
    }
    const idTerapeuta = decodedToken.sub;

    let currentPageActivos = 1;
    let currentPageInactivos = 1;
    let patientsPerPage = 5;

    // Elementos de las pestañas y secciones
    const btnActivos = document.getElementById("btn-activos");
    const btnInactivos = document.getElementById("btn-inactivos");
    const sectionActivos = document.getElementById("section-activos");
    const sectionInactivos = document.getElementById("section-inactivos");

    // Función para cambiar de pestaña
    function cambiarPestaña(tipo) {
        if (tipo === "activos") {
            btnActivos.classList.add("active");
            btnInactivos.classList.remove("active");
            sectionActivos.classList.remove("hidden");
            sectionInactivos.classList.add("hidden");
        } else {
            btnActivos.classList.remove("active");
            btnInactivos.classList.add("active");
            sectionActivos.classList.add("hidden");
            sectionInactivos.classList.remove("hidden");
        }
    }
    btnActivos.addEventListener("click", () => cambiarPestaña("activos"));
    btnInactivos.addEventListener("click", () => cambiarPestaña("inactivos"));

    // Función para cargar pacientes activos
    async function cargarPacientesActivos(page = currentPageActivos) {
        try {
            const response = await fetch(`/pacientes/activos?id_terapeuta=${idTerapeuta}&page=${page}&per_page=${patientsPerPage}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("❌ Error al obtener pacientes activos.");
            const data = await response.json();
            renderPacientes(data.pacientes, "#patients-list-activos");
            actualizarPaginacion(data.total_pages, page, cargarPacientesActivos, "#pagination-activos");
            currentPageActivos = page;
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    // Función para cargar pacientes inactivos
    async function cargarPacientesInactivos(page = currentPageInactivos) {
        try {
            const response = await fetch(`/pacientes/inactivos?id_terapeuta=${idTerapeuta}&page=${page}&per_page=${patientsPerPage}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("❌ Error al obtener pacientes inactivos.");
            const data = await response.json();
            renderPacientes(data.pacientes, "#patients-list-inactivos");
            actualizarPaginacion(data.total_pages, page, cargarPacientesInactivos, "#pagination-inactivos");
            currentPageInactivos = page;
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    // Función para cambiar el estado de un paciente
    async function cambiarEstadoPaciente(idPaciente) {
        try {
            const responseEstado = await fetch(`/pacientes/${idPaciente}/estado`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!responseEstado.ok) throw new Error("❌ Error al cambiar el estado del paciente.");
            const dataEstado = await responseEstado.json();
            // Al cambiar el estado, recargamos ambas secciones para mantener las listas actualizadas
            cargarPacientesActivos();
            cargarPacientesInactivos();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    // Función para renderizar la lista de pacientes
    function renderPacientes(pacientes, selector) {
        const patientsList = document.querySelector(selector);
        if (!patientsList) return;
        patientsList.innerHTML = "";
    
        pacientes.forEach(paciente => {
            const patientCard = document.createElement("div");
            patientCard.className = "patient-card";
    
            // Determinar el icono según el estado
            let estadoIcono = paciente.estado_paciente === "activo" 
                ? '<i class="fas fa-toggle-on status-icon active"></i>' 
                : '<i class="fas fa-toggle-off status-icon inactive"></i>';
    
            patientCard.innerHTML = `
                <i class="fas fa-user-circle user-icon"></i>
                <span><strong>${paciente.nombre} ${paciente.primer_apellido} ${paciente.segundo_apellido || ""}</strong></span>
                <button class="estado-btn" data-id="${paciente.id_paciente}">
                    ${estadoIcono}
                </button>
            `;
    
            patientsList.appendChild(patientCard);
        });
    
        // Agregar evento a cada botón de estado con animación mejorada
        document.querySelectorAll(`${selector} .estado-btn`).forEach(button => {
            button.addEventListener("click", async function () {
                const idPaciente = this.getAttribute("data-id");
                const icon = this.querySelector(".status-icon");
    
                // Aplicar la animación visual antes del cambio
                icon.classList.add("status-flicker");
    
                setTimeout(async () => {
                    // Ejecutar el cambio de estado en el backend
                    await cambiarEstadoPaciente(idPaciente);
    
                    // Remover la animación y cambiar el estado visualmente
                    icon.classList.remove("status-flicker");
                    if (icon.classList.contains("active")) {
                        icon.classList.remove("active");
                        icon.classList.add("inactive");
                        icon.classList.replace("fa-toggle-on", "fa-toggle-off");
                    } else {
                        icon.classList.remove("inactive");
                        icon.classList.add("active");
                        icon.classList.replace("fa-toggle-off", "fa-toggle-on");
                    }
                }, 800); // Duración total de la animación
            });
        });
    }
    

    // Función de paginación dinámica
    function actualizarPaginacion(totalPages, currentPage, cargarFuncion, selector) {
        let paginationContainer = document.querySelector(selector);
        if (!paginationContainer) return;
        
        paginationContainer.innerHTML = ""; // Limpiar la paginación anterior
    
        if (totalPages > 1) {
            let maxVisiblePages = 10;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
    
            // Botón "Primero"
            if (currentPage > 1) {
                let firstPageBtn = document.createElement("button");
                firstPageBtn.textContent = "«";
                firstPageBtn.classList.add("pagination-btn", "pagination-nav");
                firstPageBtn.addEventListener("click", () => cargarFuncion(1));
                paginationContainer.appendChild(firstPageBtn);
            }
    
            // Puntos suspensivos
            if (startPage > 1) {
                let dots = document.createElement("span");
                dots.textContent = "...";
                dots.classList.add("pagination-dots");
                paginationContainer.appendChild(dots);
            }
    
            // Números de página
            for (let i = startPage; i <= endPage; i++) {
                const button = document.createElement("button");
                button.textContent = i;
                button.classList.add("pagination-btn");
                if (i === currentPage) {
                    button.classList.add("active");
                }
                button.addEventListener("click", () => cargarFuncion(i));
                paginationContainer.appendChild(button);
            }
    
            // Puntos suspensivos al final
            if (endPage < totalPages) {
                let dots = document.createElement("span");
                dots.textContent = "...";
                dots.classList.add("pagination-dots");
                paginationContainer.appendChild(dots);
            }
    
            // Botón "Último"
            if (currentPage < totalPages) {
                let lastPageBtn = document.createElement("button");
                lastPageBtn.textContent = "»";
                lastPageBtn.classList.add("pagination-btn", "pagination-nav");
                lastPageBtn.addEventListener("click", () => cargarFuncion(totalPages));
                paginationContainer.appendChild(lastPageBtn);
            }
        }
    }    


    // 📌 Elementos del DOM para el modal de agregar pacientes
    const openModalBtn = document.getElementById("openModalBtn");
    const modal = document.getElementById("addPatientModal");
    const closeModalBtn = document.querySelector(".close-modal-btn");
    const addPatientForm = document.getElementById("addPatientForm");
    const successAlert = document.getElementById("successAlert");

    // 📌 Evento para abrir el modal
    openModalBtn?.addEventListener("click", () => {
        if (modal) modal.style.display = "flex";
    });

    // 📌 Evento para cerrar el modal con el botón de cerrar
    closeModalBtn?.addEventListener("click", () => {
        if (modal) modal.style.display = "none";
    });

    // 📌 Evento para cerrar el modal al hacer clic fuera de él
    window.addEventListener("click", (event) => {
        if (modal && event.target === modal) {
            modal.style.display = "none";
        }
    });

    // 📌 Manejar el envío del formulario para agregar un paciente
    addPatientForm?.addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = new FormData(addPatientForm);
        const patientData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`/pacientes?id_terapeuta=${idTerapeuta}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(patientData)
            });

            if (!response.ok) {
                throw new Error("❌ Error al agregar paciente.");
            }

            console.log("✅ Paciente agregado con éxito");
            addPatientForm.reset();

            // 📌 Recargar la lista de pacientes activos
            cargarPacientesActivos();

            // 📌 Cerrar modal y mostrar mensaje de éxito
            successAlert?.classList.add("show");
            setTimeout(() => successAlert?.classList.remove("show"), 3000);
            modal.style.display = "none";

        } catch (error) {
            console.error(error);
            alert("❌ Error al agregar paciente.");
        }
    });




    // Manejo del logout solo si existe el botón
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("session_token");
            window.location.href = "/login";
        });
    }

    // Función para iniciar la vista: mostrar activos por defecto
    function iniciarPestañas() {
        cambiarPestaña("activos");
        cargarPacientesActivos();
        cargarPacientesInactivos(); // Cargamos ambas para actualizar paginación
    }
    iniciarPestañas();

    profileIcon?.addEventListener("click", () => window.location.href = "/perfil");

    logoutBtn?.addEventListener("click", () => {
        localStorage.removeItem("session_token");
        window.location.href = "/login";
    });
});