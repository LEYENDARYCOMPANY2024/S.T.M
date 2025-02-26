document.addEventListener("DOMContentLoaded", function () {
    const addPatientForm = document.getElementById("addPatientForm");
    const successAlert = document.getElementById("successAlert");

    addPatientForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const formData = new FormData(addPatientForm);
        const patientData = Object.fromEntries(formData.entries());

        // Obtener ID del terapeuta desde localStorage o alguna otra fuente
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
            successAlert.classList.add("show");
            setTimeout(() => successAlert.classList.remove("show"), 3000);
            addPatientForm.reset();
        } else {
            alert("Error al agregar paciente.");
        }
    });
});
