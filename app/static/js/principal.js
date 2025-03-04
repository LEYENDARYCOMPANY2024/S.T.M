document.addEventListener("DOMContentLoaded", async function () {

    function mostrarConfirmacion(mensaje) {
        return new Promise((resolve) => {
            // Crear el fondo oscuro del modal
            const overlay = document.createElement("div");
            overlay.classList.add("modal-overlay");
    
            // Crear el modal con estilo
            const confirmBox = document.createElement("div");
            confirmBox.classList.add("modal-content", "confirm-box");
            confirmBox.innerHTML = `
                <h2>Confirmación</h2>
                <p>${mensaje}</p>
                <div class="confirm-buttons">
                    <button id="confirmYes" class="btn-confirm">Sí</button>
                    <button id="confirmNo" class="btn-cancel">No</button>
                </div>
            `;
    
            overlay.appendChild(confirmBox);
            document.body.appendChild(overlay);
    
            document.getElementById("confirmYes").addEventListener("click", () => {
                resolve(true);
                overlay.remove();
            });
    
            document.getElementById("confirmNo").addEventListener("click", () => {
                resolve(false);
                overlay.remove();
            });
        });
    }



    function mostrarMensajeEnFormulario(mensaje, tipo = "success") {
        const formContainer = document.querySelector("#addPatientModal .modal-content");
    
        if (!formContainer) return;
    
        const alertBox = document.createElement("div");
        alertBox.classList.add("alert", tipo === "success" ? "success" : "error");
        alertBox.innerHTML = `
            <span class="alert-icon">${tipo === "success" ? "✅" : "❌"}</span> 
            ${mensaje}
        `;
    
        formContainer.insertBefore(alertBox, formContainer.firstChild);
    
        setTimeout(() => {
            alertBox.classList.add("show");
        }, 100);
    
        setTimeout(() => {
            alertBox.classList.remove("show");
            setTimeout(() => alertBox.remove(), 300);
        }, 3000);
    }
    
        



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

    // Referencias del DOM
    const btnActivos       = document.getElementById("btn-activos");
    const btnInactivos     = document.getElementById("btn-inactivos");
    const sectionActivos   = document.getElementById("section-activos");
    const sectionInactivos = document.getElementById("section-inactivos");

    // Barra de búsqueda
    const searchInput = document.getElementById("searchInput");
    const searchBtn   = document.getElementById("searchBtn");
    const resetBtn    = document.getElementById("resetBtn");

    // Modal "Agregar paciente"
    const openModalBtn   = document.getElementById("openModalBtn");
    const modal          = document.getElementById("addPatientModal");
    const closeModalBtn  = document.querySelector(".close-modal-btn");
    const addPatientForm = document.getElementById("addPatientForm");
    const successAlert   = document.getElementById("successAlert");

    // Perfil
    const profileIcon    = document.getElementById("profileIcon");

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

    async function cargarPacientesActivos(page = currentPageActivos, search = "") {
        try {
            const response = await fetch(
                `/pacientes/activos?id_terapeuta=${idTerapeuta}&page=${page}&per_page=${patientsPerPage}&search=${search}`,
                { method: "GET", headers: { "Authorization": `Bearer ${token}` } }
            );
            if (!response.ok) throw new Error("❌ Error al obtener pacientes activos.");
            const data = await response.json();
            renderPacientes(data.pacientes, "#patients-list-activos", "activos", search);
            actualizarPaginacion(data.total_pages, page, (newPage) => cargarPacientesActivos(newPage, search), "#pagination-activos");
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
                { method: "GET", headers: { "Authorization": `Bearer ${token}` } }
            );
            if (!response.ok) throw new Error("❌ Error al obtener pacientes inactivos.");
            const data = await response.json();
            renderPacientes(data.pacientes, "#patients-list-inactivos", "inactivos", search);
            actualizarPaginacion(data.total_pages, page, (newPage) => cargarPacientesInactivos(newPage, search), "#pagination-inactivos");
            currentPageInactivos = page;
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    }

    searchBtn.addEventListener("click", () => {
        const searchValue = searchInput.value.trim();
        currentPageActivos   = 1;
        currentPageInactivos = 1;
        cargarPacientesActivos(1, searchValue);
        cargarPacientesInactivos(1, searchValue);
    });

    resetBtn.addEventListener("click", () => {
        searchInput.value = "";
        currentPageActivos = 1;
        currentPageInactivos = 1;
        cargarPacientesActivos();
        cargarPacientesInactivos();
    });

    // Función para cambiar el estado (inactivar/activar)
    async function cambiarEstadoPaciente(button, idPaciente, estadoActual) {
        try {
            let action = "";
            let bodyData = { action: "", motivo: null, create_new_record: false };
    
            // ✅ Mostrar modal de confirmación en lugar de `window.confirm()`
            const confirmacion = await mostrarConfirmacion(
                estadoActual === "activo"
                    ? "¿Estás seguro de desactivar al paciente?"
                    : "¿Estás seguro de activar al paciente?"
            );
    
            if (!confirmacion) return; // ⛔ No hace nada si el usuario cancela
    
            action = estadoActual === "activo" ? "inactivate" : "reactivate";
            bodyData.action = action;
    
            if (action === "reactivate") {
                const motivoReactivacion = prompt("Motivo de reactivación (puede ser breve):");
                if (motivoReactivacion && motivoReactivacion.trim() !== "") {
                    bodyData.motivo = motivoReactivacion.trim();
                }
            }
    
            const response = await fetch(`/pacientes/${idPaciente}/estado?id_terapeuta=${idTerapeuta}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });
    
            if (!response.ok) throw new Error("❌ Error al cambiar el estado del paciente.");
            await response.json();
    
            button.classList.add("toggle-anim");
            setTimeout(() => {
                button.classList.toggle("active");
                button.classList.toggle("inactive");
                button.setAttribute("data-estado", action === "inactivate" ? "inactivo" : "activo");
                button.classList.remove("toggle-anim");
            }, 500);
    
            mostrarMensaje("Estado del paciente actualizado correctamente.", "success");
        } catch (error) {
            mostrarMensaje(error.message, "error");
        }
    }
    
    
    
    

    function renderPacientes(pacientes, selector, tipo, search) {
        const patientsList = document.querySelector(selector);
        if (!patientsList) return;
        
        patientsList.innerHTML = "";
    
        if (pacientes.length === 0) {
            patientsList.innerHTML = `<div class="no-results">No hay pacientes ${tipo} registrados aún.</div>`;
            return;
        }
    
        pacientes.forEach(paciente => {
            const patientCard = document.createElement("div");
            patientCard.className = "patient-card";
    
            let estadoActivo = paciente.estado_paciente === "activo";
            let estadoBoton = `
                <button class="toggle-btn ${estadoActivo ? 'active' : 'inactive'}" 
                    data-id="${paciente.id_paciente}" 
                    data-estado="${paciente.estado_paciente}">
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
    
        // Evento para cambiar estado SOLO si el usuario confirma la acción
        document.querySelectorAll(`${selector} .toggle-btn`).forEach(button => {
            button.addEventListener("click", async function () {
                const idPaciente = this.getAttribute("data-id");
                const estadoActual = this.getAttribute("data-estado");
                await cambiarEstadoPaciente(this, idPaciente, estadoActual);  // 🔹 Pasamos `this` (el botón)
            });
        });
    }
    
    

    function actualizarPaginacion(totalPages, currentPage, cargarFuncion, selector) {
        const paginationContainer = document.querySelector(selector);
        if (!paginationContainer) return;
        paginationContainer.innerHTML = "";

        if (totalPages > 1) {
            let maxVisiblePages = 10;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage   = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            if (currentPage > 1) {
                let firstPageBtn = document.createElement("button");
                firstPageBtn.textContent = "«";
                firstPageBtn.classList.add("pagination-btn", "pagination-nav");
                firstPageBtn.addEventListener("click", () => cargarFuncion(1));
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
                button.addEventListener("click", () => cargarFuncion(i));
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
                lastPageBtn.addEventListener("click", () => cargarFuncion(totalPages));
                paginationContainer.appendChild(lastPageBtn);
            }
        }
    }

    // Modal "Agregar Paciente"
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


    const codigoPacienteInput = document.getElementById("codigoPaciente");
    const searchPacienteBtn = document.getElementById("searchPacienteBtn");

    searchPacienteBtn.addEventListener("click", async function () {
        const codigo = codigoPacienteInput.value.trim();
        if (!codigo) {
            mostrarMensajeEnFormulario("Introduce un código de paciente.", "error");
            return;
        }
    
        try {
            const response = await fetch(`/pacientes/buscar?codigo=${codigo}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
    
            if (!response.ok) throw new Error("Paciente no encontrado.");
            const data = await response.json();
            mostrarMensajeEnFormulario(`Paciente encontrado: ${data.nombre} ${data.primer_apellido}. Será asignado a este terapeuta.`, "success");
    
            await fetch(`/pacientes/asignar?id_paciente=${data.id_paciente}&id_terapeuta=${idTerapeuta}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
    
            modal.style.display = "none";
        } catch (error) {
            mostrarMensajeEnFormulario(error.message, "error");
        }
    });
    
    



    addPatientForm?.addEventListener("submit", async function (event) {
        event.preventDefault();
        const formData = new FormData(addPatientForm);
        const patientData = Object.fromEntries(formData.entries());
        const codigoPaciente = document.getElementById("codigoPaciente").value.trim();
    
        // ✅ Eliminar campos innecesarios antes de enviar
        delete patientData.nombre_usuario_p;
        delete patientData.contrasena_p;
        delete patientData.correo;
    
        if (codigoPaciente) {
            // ✅ Caso 1: Se ingresó un código → Buscar y asignar paciente
            console.log("🔍 Buscando paciente con código:", codigoPaciente);
    
            try {
                const response = await fetch(`/pacientes/buscar?codigo=${codigoPaciente}`, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` }
                });
    
                if (!response.ok) throw new Error("Paciente no encontrado.");
                const data = await response.json();
                console.log("📥 Paciente encontrado:", data);
    
                // ✅ Asignar paciente al terapeuta en lugar de registrarlo
                await fetch(`/pacientes/asignar?id_paciente=${data.id_paciente}&id_terapeuta=${idTerapeuta}`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
    
                mostrarMensaje("Paciente asignado con éxito.", "success");
                modal.style.display = "none";
    
            } catch (error) {
                console.error("❌ Error en la búsqueda:", error);
                mostrarMensaje("❌ " + error.message, "error");
            }
    
        } else {
            // ✅ Caso 2: No se ingresó código → Registrar nuevo paciente
            console.log("📤 Registrando nuevo paciente:", patientData);
    
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
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "❌ Error al agregar paciente.");
                }
    
                console.log("✅ Paciente registrado con éxito");
                addPatientForm.reset();
    
                // Recargar lista de pacientes activos
                const searchValue = searchInput.value.trim();
                cargarPacientesActivos(1, searchValue);
    
                // Cerrar modal y mostrar mensaje de éxito
                mostrarMensaje("Paciente registrado con éxito.", "success");
                modal.style.display = "none";
    
            } catch (error) {
                console.error("❌ Error en la solicitud:", error);
                mostrarMensaje("❌ " + error.message, "error");
            }
        }
    });    
    

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
    


    // Inicialización
    function iniciarPestañas() {
        cambiarPestaña("activos");
        cargarPacientesActivos();
        cargarPacientesInactivos();
    }
    iniciarPestañas();

    profileIcon?.addEventListener("click", () => {
        window.location.href = "/perfil";
    });

    // Opcional: si tienes un botón de logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("session_token");
            window.location.href = "/login";
        });
    }
});