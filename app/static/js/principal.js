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

    // -------------------------
    // Capturar elementos del DOM
    // -------------------------
    const btnActivos      = document.getElementById("btn-activos");
    const btnInactivos    = document.getElementById("btn-inactivos");
    const sectionActivos  = document.getElementById("section-activos");
    const sectionInactivos= document.getElementById("section-inactivos");
    
    // Barra de búsqueda
    const searchInput = document.querySelector(".search-bar input");
    const searchBtn   = document.querySelector(".search-bar button.close-btn");

    // -------------------------
    // Funciones de pestañas
    // -------------------------
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

    // -------------------------
    // Funciones para cargar pacientes
    // -------------------------
    async function cargarPacientesActivos(page = currentPageActivos, search = "") {
        try {
            const response = await fetch(
                `/pacientes/activos?id_terapeuta=${idTerapeuta}&page=${page}&per_page=${patientsPerPage}&search=${search}`,
                {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` }
                }
            );
            if (!response.ok) throw new Error("❌ Error al obtener pacientes activos.");
            const data = await response.json();
            renderPacientes(data.pacientes, "#patients-list-activos");
            actualizarPaginacion(
                data.total_pages,
                page,
                (newPage) => cargarPacientesActivos(newPage, search),
                "#pagination-activos"
            );
            currentPageActivos = page;
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    async function cargarPacientesInactivos(page = currentPageInactivos, search = "") {
        try {
            const response = await fetch(
                `/pacientes/inactivos?id_terapeuta=${idTerapeuta}&page=${page}&per_page=${patientsPerPage}&search=${search}`,
                {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` }
                }
            );
            if (!response.ok) throw new Error("❌ Error al obtener pacientes inactivos.");
            const data = await response.json();
            renderPacientes(data.pacientes, "#patients-list-inactivos");
            actualizarPaginacion(
                data.total_pages,
                page,
                (newPage) => cargarPacientesInactivos(newPage, search),
                "#pagination-inactivos"
            );
            currentPageInactivos = page;
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    // -------------------------
    // Evento para buscar pacientes
    // -------------------------
    searchBtn.addEventListener("click", () => {
        const searchValue = searchInput.value.trim();
        // Reiniciamos la página y cargamos ambos tipos
        currentPageActivos = 1;
        currentPageInactivos = 1;
        cargarPacientesActivos(1, searchValue);
        cargarPacientesInactivos(1, searchValue);
    });

    // -------------------------
    // Función para cambiar estado de un paciente
    // -------------------------
    async function cambiarEstadoPaciente(idPaciente) {
        try {
            const responseEstado = await fetch(`/pacientes/${idPaciente}/estado`, {
                method: "PUT",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!responseEstado.ok) throw new Error("❌ Error al cambiar el estado del paciente.");
            await responseEstado.json();
            // Al cambiar el estado, recargamos ambas listas
            // Usamos el valor de búsqueda actual (por si se estaba filtrando)
            const searchValue = searchInput.value.trim();
            cargarPacientesActivos(1, searchValue);
            cargarPacientesInactivos(1, searchValue);
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    // -------------------------
    // Renderizar pacientes (activos o inactivos)
    // -------------------------
    function renderPacientes(pacientes, selector) {
        const patientsList = document.querySelector(selector);
        if (!patientsList) return;
        patientsList.innerHTML = "";

        pacientes.forEach(paciente => {
            const patientCard = document.createElement("div");
            patientCard.className = "patient-card";

            // Verificamos estado
            let estadoActivo = paciente.estado_paciente === "activo";
            let estadoBoton = `
                <button class="toggle-btn ${estadoActivo ? 'active' : 'inactive'}" data-id="${paciente.id_paciente}">
                    <span class="toggle-slider"></span>
                </button>
            `;

            patientCard.innerHTML = `
                <i class="fas fa-user-circle user-icon"></i>
                <div class="patient-info">
                    <span><strong>${paciente.nombre} ${paciente.primer_apellido} ${paciente.segundo_apellido || ""}</strong></span>
                    <span class="patient-code">Código: ${paciente.codigo}</span>
                </div>
                ${estadoBoton}
            `;

            patientsList.appendChild(patientCard);
        });

        // Evento para cambiar estado
        document.querySelectorAll(`${selector} .toggle-btn`).forEach(button => {
            button.addEventListener("click", async function () {
                const idPaciente = this.getAttribute("data-id");
                // Animación
                this.classList.add("toggle-anim");
                setTimeout(async () => {
                    await cambiarEstadoPaciente(idPaciente);
                    this.classList.toggle("active");
                    this.classList.toggle("inactive");
                    this.classList.remove("toggle-anim");
                }, 500);
            });
        });
    }

    // -------------------------
    // Función para la paginación
    // -------------------------
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

            // Puntos suspensivos (inicio)
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

            // Puntos suspensivos (fin)
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

    // -------------------------
    // Manejo del modal "Agregar paciente"
    // -------------------------
    const openModalBtn    = document.getElementById("openModalBtn");
    const modal           = document.getElementById("addPatientModal");
    const closeModalBtn   = document.querySelector(".close-modal-btn");
    const addPatientForm  = document.getElementById("addPatientForm");
    const successAlert    = document.getElementById("successAlert");

    openModalBtn?.addEventListener("click", () => {
        if (modal) modal.style.display = "flex";
    });

    closeModalBtn?.addEventListener("click", () => {
        if (modal) modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (modal && event.target === modal) {
            modal.style.display = "none";
        }
    });

    addPatientForm?.addEventListener("submit", async function (event) {
        event.preventDefault();
        const formData   = new FormData(addPatientForm);
        const patientData= Object.fromEntries(formData.entries());
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

            // Al agregar uno nuevo, recargamos la lista de pacientes activos
            // (su estado inicial es "activo")
            const searchValue = searchInput.value.trim(); 
            cargarPacientesActivos(1, searchValue);

            // Cerrar modal y mostrar mensaje
            successAlert?.classList.add("show");
            setTimeout(() => successAlert?.classList.remove("show"), 3000);
            modal.style.display = "none";

        } catch (error) {
            console.error(error);
            alert("❌ Error al agregar paciente.");
        }
    });

    // -------------------------
    // Logout (si aplica)
    // -------------------------
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("session_token");
            window.location.href = "/login";
        });
    }

    // -------------------------
    // Inicializar la vista
    // -------------------------
    function iniciarPestañas() {
        cambiarPestaña("activos");
        // Sin filtro inicial
        cargarPacientesActivos();
        cargarPacientesInactivos();
    }
    iniciarPestañas();

    // Perfil (si aplica)
    const profileIcon = document.getElementById("profileIcon");
    profileIcon?.addEventListener("click", () => {
        window.location.href = "/perfil";
    });
});
