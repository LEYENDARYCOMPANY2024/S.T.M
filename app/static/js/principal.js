document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("session_token");

    // 📌 Si no hay token, redirigir al login
    if (!token) {
        window.location.href = "/login";
        return;
    }

    // 📌 Función para decodificar el token y obtener el ID del terapeuta
    function parseJwt(token) {
        try {
            return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
            return null;
        }
    }

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.sub) {
        localStorage.removeItem("session_token"); // 🔹 Eliminar token corrupto
        window.location.href = "/login";
        return;
    }

    const idTerapeuta = decodedToken.sub;
    const nombreUsuario = decodedToken.nombre_usuario;

    // 📌 Elementos del DOM
    const openModalBtn = document.getElementById("openModalBtn");
    const modal = document.getElementById("addPatientModal");
    const closeModalBtn = document.querySelector(".close-modal-btn");
    const addPatientForm = document.getElementById("addPatientForm");
    const successAlert = document.getElementById("successAlert");
    const patientsList = document.querySelector(".patients-list");
    const profileIcon = document.getElementById("profileIcon");
    const logoutBtn = document.getElementById("logoutBtn");

    // 📌 Función para obtener los pacientes del backend
    async function cargarPacientes() {
        try {
            const response = await fetch(`/pacientes?id_terapeuta=${idTerapeuta}`, {
                method: "GET",
                headers: { 
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // Si el backend devuelve 404, no mostrar alerta de error
                if (response.status === 404) {
                    console.warn("ℹ️ No hay pacientes registrados para este terapeuta.");
                    patientsList.innerHTML = "<p>No hay pacientes registrados.</p>";
                    return;
                }

                throw new Error(`❌ Error al obtener la lista de pacientes (${response.status}).`);
            }

            const pacientes = await response.json();
            console.log("📋 Pacientes obtenidos:", pacientes);

            // 📌 Limpiar la lista antes de agregar pacientes
            patientsList.innerHTML = "";

            // 📌 Renderizar la lista de pacientes
            if (pacientes.length === 0) {
                patientsList.innerHTML = "<p>No hay pacientes registrados.</p>";
            } else {
                pacientes.forEach(paciente => {
                    const patientCard = document.createElement("div");
                    patientCard.className = "patient-card";
                    patientCard.innerHTML = `
                        <i class="fas fa-user-circle"></i>
                        <span><strong>${paciente.nombre} ${paciente.primer_apellido} ${paciente.segundo_apellido || ""}</strong></span>
                        <span class="code">Código: ${paciente.codigo}</span>
                        <button class="enter-btn"><i class="fas fa-arrow-right"></i></button>
                    `;
                    patientsList.appendChild(patientCard);
                });
            }

        } catch (error) {
            console.error(error);
            alert("❌ Error al cargar la lista de pacientes.");
        }
    }

    // 📌 Llamar a la función para cargar pacientes cuando se cargue la página
    cargarPacientes();

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

            // 📌 Cargar pacientes nuevamente para actualizar la lista
            cargarPacientes();

            // 📌 Cerrar modal y mostrar mensaje de éxito
            successAlert?.classList.add("show");
            setTimeout(() => successAlert?.classList.remove("show"), 3000);
            modal.style.display = "none";

        } catch (error) {
            console.error(error);
            alert("❌ Error al agregar paciente.");
        }
    });

    // 📌 Redirigir al perfil cuando se hace clic en el icono de usuario
    profileIcon?.addEventListener("click", function () {
        window.location.href = "/perfil";
    });

    // 📌 Cerrar sesión eliminando el token y redirigiendo al login
    logoutBtn?.addEventListener("click", function () {
        localStorage.removeItem("session_token");
        localStorage.removeItem("nombre_usuario");
        window.location.href = "/login";
    });
});
