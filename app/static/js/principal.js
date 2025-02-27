document.addEventListener("DOMContentLoaded", function () {
    const openModalBtn = document.getElementById("openModalBtn");
    const modal = document.getElementById("addPatientModal");
    const closeModalBtn = document.querySelector(".close-modal-btn");
    const addPatientForm = document.getElementById("addPatientForm");
    const successAlert = document.getElementById("successAlert");
    const patientsList = document.querySelector(".patients-list");

    // 📌 Evento para abrir el modal
    openModalBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    // 📌 Evento para cerrar el modal con el botón X
    closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // 📌 Evento para cerrar el modal al hacer clic fuera de él
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // 📌 Manejar el envío del formulario
    addPatientForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = new FormData(addPatientForm);
        const patientData = Object.fromEntries(formData.entries());

        // Eliminar cualquier código que haya en el formulario (el backend lo generará)
        delete patientData.codigo;

        // Obtener ID del terapeuta desde localStorage
        const idTerapeuta = localStorage.getItem("id_terapeuta");

        if (!idTerapeuta) {
            alert("Error: No se encontró el terapeuta.");
            return;
        }

        const response = await fetch(`/pacientes?id_terapeuta=${idTerapeuta}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patientData)
        });

        if (response.ok) {
            const newPatient = await response.json();

            // 📌 Crear nueva tarjeta de paciente con el código generado
            const newPatientCard = document.createElement("div");
            newPatientCard.className = "patient-card";
            newPatientCard.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <span><strong>${newPatient.nombre} ${newPatient.primer_apellido} ${newPatient.segundo_apellido || ""}</strong></span>
                <span class="code">Código: ${newPatient.codigo}</span>
                <button class="enter-btn"><i class="fas fa-arrow-right"></i></button>
            `;

            // 📌 Añadir la nueva tarjeta a la lista
            patientsList.appendChild(newPatientCard);

            // 📌 Mostrar alerta de éxito
            successAlert.classList.add("show");

            // 📌 Ocultar la alerta después de 3 segundos
            setTimeout(() => successAlert.classList.remove("show"), 3000);

            // 📌 Cerrar modal y resetear formulario
            modal.style.display = "none";
            addPatientForm.reset();
        } else {
            alert("Error al agregar paciente.");
        }
    });
});
