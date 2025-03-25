document.addEventListener("DOMContentLoaded", async function () {

    const token = localStorage.getItem("session_token");

    // Función para mostrar mensajes de forma uniforme
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

    // 📌 Función para mostrar mensajes de error antes de redirigir
    function mostrarMensajeYRedirigir(mensaje) {
        mostrarMensaje(mensaje, "error"); // 🔥 Muestra el mensaje en pantalla

        setTimeout(() => {
            localStorage.removeItem("session_token");
            window.location.href = "/";
        }, 3000); // 🔥 Espera 3 segundos antes de redirigir
    }


    // Función para mostrar una ventana de confirmación estilizada
    function mostrarConfirmacionEstilizada(mensaje) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.classList.add("modal-overlay");

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


    function mostrarConfirmacionEstilizada2(mensaje) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.classList.add("modal-overlay");

            const confirmBox = document.createElement("div");
            confirmBox.classList.add("modal-content", "confirm-box");
            confirmBox.innerHTML = `
                <h2>Confirmación</h2>
                <p>${mensaje}</p>
                <div class="confirm-buttons">
                    <button id="confirmYes" class="btn-confirm">Enterado</button>
                </div>
            `;
    
            overlay.appendChild(confirmBox);
            document.body.appendChild(overlay);
    
            document.getElementById("confirmYes").addEventListener("click", () => {
                resolve(true);
                overlay.remove();
            });
        });
    }


    
    // Función para solicitar un motivo de reactivación con opción de cancelar.
    // Si se pulsa "Cancelar" se muestra un mensaje y no se activa al paciente.
    function solicitarMotivoReactivacion(mensaje) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.classList.add("modal-overlay");

            const confirmBox = document.createElement("div");
            confirmBox.classList.add("modal-content", "confirm-box");
            confirmBox.innerHTML = `
                <h2>Reactivación Requerida</h2>
                <p>${mensaje}</p>
                <input type="text" id="motivoReactivacionInput" class="input-field" placeholder="Ingrese motivo" required>
                <div class="confirm-buttons">
                    <button id="confirmMotivo" class="btn-confirm">Confirmar</button>
                    <button id="cancelMotivo" class="btn-cancel">Cancelar</button>
                </div>
            `;
    
            overlay.appendChild(confirmBox);
            document.body.appendChild(overlay);
    
            document.getElementById("confirmMotivo").addEventListener("click", () => {
                const motivo = document.getElementById("motivoReactivacionInput").value.trim();
                if (!motivo) {
                    mostrarMensaje("Debes proporcionar un motivo para la reactivación.", "error");
                    return;
                }
                resolve(motivo);
                overlay.remove();
            });
    
            document.getElementById("cancelMotivo").addEventListener("click", () => {
                mostrarMensaje("Cancelaste la reactivación. El paciente permanecerá inactivo.", "error");
                resolve(null);
                overlay.remove();
            });
        });
    }

    if (!token) {
        console.warn("⚠️ No hay token en localStorage, redirigiendo a login...");
        mostrarMensajeYRedirigir("⚠️ Tu sesión ha expirado. Inicia sesión nuevamente.");
        return;
    }

    console.log("📌 Token detectado en `principal.js`:", token);

    // 📌 Función para decodificar el token y obtener el ID del terapeuta
    function parseJwt(token) {
        try {
            return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
            console.error("❌ Error al decodificar el token:", e);
            return null;
        }
    }

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.sub || !decodedToken.exp) {
        console.warn("⚠️ Token inválido o corrupto, eliminando...");
        mostrarMensajeYRedirigir("⚠️ Tu sesión es inválida. Inicia sesión nuevamente.");
        return;
    }

    // 📌 Verificar si el token ha expirado
    const currentTime = Math.floor(Date.now() / 1000);
    if (decodedToken.exp < currentTime) {
        console.warn("⏳ Token expirado, redirigiendo a login...");
        mostrarMensajeYRedirigir("⏳ Tu sesión ha expirado. Inicia sesión nuevamente.");
        return;
    }
    const idTerapeuta = decodedToken.sub;
    
    let currentPageActivos = 1;
    let currentPageInactivos = 1;
    let patientsPerPage = 6; // Explicitly set to 6
    
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

    // 📌 Guardar el ID del terapeuta en localStorage
    localStorage.setItem("id_terapeuta", idTerapeuta); // ✅ Guardamos el id del terapeuta
    console.log(`📌 Usuario autenticado - ID Terapeuta: ${idTerapeuta}`);
    
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
            let action = estadoActual === "activo" ? "inactivate" : "reactivate";
            let bodyData = { action, motivo: null, create_new_record: false };
    
            const confirmacion = await mostrarConfirmacionEstilizada(
                estadoActual === "activo"
                    ? "¿Estás seguro de desactivar al paciente?"
                    : "¿Estás seguro de activar al paciente?"
            );
    
            if (!confirmacion) return;
    
            if (action === "reactivate") {
                // Solicitar motivo y reactivar sin mostrar una segunda confirmación
                let motivoReactivacion = await solicitarMotivoReactivacion(
                    "Motivo de reactivación (obligatorio):"
                );
                if (!motivoReactivacion) return; // Si se cancela, no se activa
                bodyData.motivo = motivoReactivacion;
    
                const deseaNuevoPeriodo = await mostrarConfirmacionEstilizada2(
                    "Cuando actives al paciente activarás un nuevo periodo."
                );
                if (deseaNuevoPeriodo) {
                    bodyData.create_new_record = true;
                }
            }
    
            const response = await fetch(
                `/pacientes/${idPaciente}/estado?id_terapeuta=${idTerapeuta}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(bodyData),
                }
            );
    
            if (!response.ok) throw new Error("❌ Error al cambiar el estado del paciente.");
            await response.json();
    
            button.classList.add("toggle-anim");
            setTimeout(() => {
                button.classList.toggle("active");
                button.classList.toggle("inactive");
                button.setAttribute("data-estado", action === "inactivate" ? "inactivo" : "activo");
                button.classList.remove("toggle-anim");
    
                cargarPacientesActivos(1);
                cargarPacientesInactivos(1);
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
            patientCard.setAttribute("data-id", paciente.id_paciente);
    
            // 🔹 Hacer que toda la tarjeta redirija al historial
            patientCard.addEventListener("click", () => seleccionarPaciente(paciente.id_paciente));
    
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
                <div class="toggle-container">
                    ${estadoBoton} <!-- 🔹 Botón de activación/desactivación -->
                </div>
            `;
    
            patientsList.appendChild(patientCard);
        });
    
        // 🔹 Mantener funcionalidad del botón de estado
        document.querySelectorAll(`${selector} .toggle-btn`).forEach(button => {
            button.addEventListener("click", async function (event) {
                event.stopPropagation(); // 🔹 Evita que se active la redirección al historial
                const idPaciente = this.getAttribute("data-id");
                const estadoActual = this.getAttribute("data-estado");
                await cambiarEstadoPaciente(this, idPaciente, estadoActual);
            });
        });
    }
    
    // 🔹 Función para seleccionar un paciente y cargar su historial clínico
    async function seleccionarPaciente(id_paciente) {
        try {
            // Guardar el ID del paciente en localStorage
            localStorage.setItem("id_paciente", id_paciente);

            // 🔹 Redirigir a la página de historial clínico
            window.location.href = "/historial_clinico";
        } catch (error) {
            console.error("❌ Error al obtener historial clínico:", error);
        }
    }

    function actualizarPaginacion(totalPages, currentPage, cargarFuncion, selector) {
        const paginationContainer = document.querySelector(selector);
        if (!paginationContainer) return;
        paginationContainer.innerHTML = "";
    
        if (totalPages > 1) {
            let maxVisiblePages = 6; // Limit to 6 visible pages
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
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
            mostrarMensaje("Introduce un código de paciente.", "error");
            return;
        }
    
        console.log("🔍 Buscando paciente con código:", codigo);
    
        try {
            const response = await fetch(`/pacientes/buscar?codigo=${codigo}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });
    
            if (!response.ok) {
                throw new Error("Paciente no encontrado.");
            }
    
            const data = await response.json();
            console.log("📥 Paciente encontrado:", data);
    
            if (data.estado_paciente === "activo") {
                mostrarMensaje("Este paciente ya está activo con otro terapeuta.", "error");
                return;
            }
    
            console.log("📤 Enviando solicitud para asignar paciente:");
            console.log("id_paciente:", data.id_paciente);
            console.log("id_terapeuta:", idTerapeuta);
    
            const asignarResponse = await fetch(`/pacientes/asignar?id_paciente=${data.id_paciente}&id_terapeuta=${idTerapeuta}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
    
            if (!asignarResponse.ok) {
                const errorMessage = await asignarResponse.json();
                throw new Error(errorMessage.detail || "Error al asignar paciente.");
            }
    
            mostrarMensaje(`Paciente ${data.nombre} ${data.primer_apellido} agregado como inactivo.`, "success");
    
            cargarPacientesInactivos();
    
            // Mostrar ventana de motivo para reactivar
            const confirmMotivo = await solicitarMotivoReactivacion(`El paciente ${data.nombre} ${data.primer_apellido} está inactivo. ¿Deseas activarlo?`);
            if (confirmMotivo) {
                await reactivarPaciente(data.id_paciente, confirmMotivo);
            }
    
            modal.style.display = "none";
    
        } catch (error) {
            console.error("❌ Error en la búsqueda:", error);
            mostrarMensaje(error.message, "error");
        }
    });
    
    
    addPatientForm?.addEventListener("submit", async function (event) {
        event.preventDefault();
        const formData = new FormData(addPatientForm);
        const patientData = Object.fromEntries(formData.entries());
        const codigoPaciente = document.getElementById("codigoPaciente").value.trim();
    
        // Eliminar campos innecesarios
        delete patientData.nombre_usuario_p;
        delete patientData.contrasena_p;
        delete patientData.correo;
    
        if (codigoPaciente) {
            console.log("🔍 Buscando paciente con código:", codigoPaciente);
    
            try {
                const response = await fetch(`/pacientes/buscar?codigo=${codigoPaciente}`, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` }
                });
    
                if (!response.ok) throw new Error("Paciente no encontrado.");
                const data = await response.json();
                console.log("📥 Paciente encontrado:", data);
    
                if (data.estado_paciente === "activo") {
                    mostrarMensaje("Este paciente ya está activo con otro terapeuta y no puede ser reasignado.", "error");
                    return;
                }
    
                console.log("📤 Enviando solicitud para asignar paciente:");
                console.log("id_paciente:", data.id_paciente);
                console.log("id_terapeuta:", idTerapeuta);
    
                const asignarResponse = await fetch(`/pacientes/asignar?id_paciente=${data.id_paciente}&id_terapeuta=${idTerapeuta}`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
    
                if (!asignarResponse.ok) {
                    const errorMessage = await asignarResponse.json();
                    throw new Error(errorMessage.detail || "Error al asignar paciente.");
                }
    
                mostrarMensaje("Paciente asignado con éxito.", "success");
    
                const confirmMotivo = await solicitarMotivoReactivacion(`El paciente ${data.nombre} ${data.primer_apellido} está inactivo. ¿Deseas activarlo?`);
                if (confirmMotivo) {
                    await reactivarPaciente(data.id_paciente, confirmMotivo);
                }
    
                modal.style.display = "none";
    
            } catch (error) {
                console.error("❌ Error en la búsqueda:", error);
                mostrarMensaje(error.message, "error");
            }
    
        } else {
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
    
                const searchValue = searchInput.value.trim();
                cargarPacientesActivos(1, searchValue);
    
                mostrarMensaje("Paciente registrado con éxito.", "success");
                modal.style.display = "none";
    
            } catch (error) {
                console.error("❌ Error en la solicitud:", error);
                mostrarMensaje("❌ " + error.message, "error");
            }
        }
    });
    
    
    function iniciarPestañas() {
        cambiarPestaña("activos");
        cargarPacientesActivos();
        cargarPacientesInactivos();
    }
    iniciarPestañas();
    
    profileIcon?.addEventListener("click", () => {
        window.location.href = "/perfil";
    });
    
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("session_token");
            window.location.href = "/login";
        });
    }
});