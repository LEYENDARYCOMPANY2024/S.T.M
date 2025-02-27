document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("session_token");

    // 📌 Si no hay token, redirigir al login
    if (!token) {
        window.location.href = "/login";
        return;
    }

    // 📌 Decodificar el token para obtener el id_terapeuta
    function parseJwt(token) {
        try {
            return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
            return null;
        }
    }

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.sub) {
        localStorage.removeItem("session_token"); // Eliminar token corrupto
        window.location.href = "/login";
        return;
    }

    const idTerapeuta = decodedToken.sub; // ID del terapeuta desde el token
    const nombreUsuario = decodedToken.nombre_usuario;

    // 📌 Mostrar el nombre del usuario en la interfaz
    const userIcon = document.querySelector(".user-icon");
    if (nombreUsuario) {
        userIcon.innerHTML = `<i class="fas fa-user-circle"></i> <span>${nombreUsuario}</span>`;
    }

    // 📌 Evento para abrir el modal
    const openModalBtn = document.getElementById("openModalBtn");
    const modal = document.getElementById("addPatientModal");
    const closeModalBtn = document.querySelector(".close-modal-btn");
    const addPatientForm = document.getElementById("addPatientForm");
    const successAlert = document.getElementById("successAlert");
    const patientsList = document.querySelector(".patients-list");

    openModalBtn.addEventListener("click", () => modal.style.display = "flex");
    closeModalBtn.addEventListener("click", () => modal.style.display = "none");

    window.addEventListener("click", (event) => {
        if (event.target === modal) modal.style.display = "none";
    });

    // 📌 Manejar el envío del formulario con el token
    addPatientForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = new FormData(addPatientForm);
        const patientData = Object.fromEntries(formData.entries());

        const response = await fetch(`/pacientes?id_terapeuta=${idTerapeuta}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // 🔹 Enviar token en la petición
            },
            body: JSON.stringify(patientData)
        });

        if (response.ok) {
            const newPatient = await response.json();
            const newPatientCard = document.createElement("div");
            newPatientCard.className = "patient-card";
            newPatientCard.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <span><strong>${newPatient.nombre} ${newPatient.primer_apellido} ${newPatient.segundo_apellido || ""}</strong></span>
                <span class="code">Código: ${newPatient.codigo}</span>
                <button class="enter-btn"><i class="fas fa-arrow-right"></i></button>
            `;
            patientsList.appendChild(newPatientCard);
            successAlert.classList.add("show");
            setTimeout(() => successAlert.classList.remove("show"), 3000);
            modal.style.display = "none";
            addPatientForm.reset();
        } else {
            alert("Error al agregar paciente.");
        }
    });

    // 📌 Redirigir al perfil cuando se hace clic en el icono de usuario
    document.getElementById("profileIcon").addEventListener("click", function () {
        window.location.href = "/perfil";
    });

    // 📌 Cerrar sesión eliminando el token
    document.getElementById("logoutBtn")?.addEventListener("click", function () {
        localStorage.removeItem("session_token");
        window.location.href = "/login";
    });
});
