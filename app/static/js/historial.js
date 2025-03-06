document.addEventListener("DOMContentLoaded", async function () {

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
    

    const idPaciente = localStorage.getItem("id_paciente");
    if (!idPaciente) {
        mostrarMensaje("No hay paciente seleccionado.", "error");
        window.location.href = "/principal";
        return;
    }

    // ──────────────────────────────────────────
    // 🔹 Función para obtener y cargar los datos del paciente
    async function cargarDatosPaciente() {
        try {
            const response = await fetch(`/historial/paciente/${idPaciente}`);
            if (response.ok) {
                const pacienteData = await response.json();
                document.getElementById("nombre").value = pacienteData.nombre || "";
                document.getElementById("primer_apellido").value = pacienteData.primer_apellido || "";
                document.getElementById("segundo_apellido").value = pacienteData.segundo_apellido || "";
                document.getElementById("edad").value = pacienteData.edad || "";
                document.getElementById("escolaridad").value = pacienteData.escolaridad || "";
                document.getElementById("sexo").value = pacienteData.genero || "";
                document.getElementById("estadoCivil").value = pacienteData.estado_civil || "";
                document.getElementById("ocupacion").value = pacienteData.ocupacion || "";

            } else {
                mostrarMensaje("No se encontraron datos del paciente.", "error");
            }
        } catch (error) {
            mostrarMensaje("Error al cargar datos del paciente.", "error");
            console.error("❌ Error al cargar datos del paciente:", error);
        }
    }

    // ──────────────────────────────────────────
    // 🔹 Función para obtener y cargar el historial clínico
    async function cargarHistorial() {
        try {
            const response = await fetch(`/historial/${idPaciente}`);
            if (response.ok) {
                const data = await response.json();
                const historial = data.datos_historial_clinico || {};
                document.getElementById("peso").value = historial.peso || "";
                document.getElementById("estatura").value = historial.estatura || "";
                document.getElementById("imc").value = historial.imc || "";

            } else {
                mostrarMensaje("No se encontró historial para este paciente.", "error");
            }
        } catch (error) {
            mostrarMensaje("Error al cargar historial clínico.", "error");
            console.error("❌ Error al cargar historial clínico:", error);
        }
    }

    // ──────────────────────────────────────────
    // 🔹 Función para guardar los datos del paciente en la tabla `pacientes`
    async function guardarDatosPaciente() {
        const escolaridad = document.getElementById("escolaridad").value.trim();
        const ocupacion = document.getElementById("ocupacion").value.trim();

        const payloadPaciente = {
            nombre: document.getElementById("nombre").value,
            primer_apellido: document.getElementById("primer_apellido").value,
            segundo_apellido: document.getElementById("segundo_apellido").value,
            edad: parseInt(document.getElementById("edad").value),
            genero: document.getElementById("sexo").value,
            estado_civil: document.getElementById("estadoCivil").value,
            escolaridad: escolaridad !== "" ? escolaridad : null,  // ✅ Evita errores en ENUM
            ocupacion: ocupacion !== "" ? ocupacion : null         // ✅ Evita errores en ENUM
        };

        try {
            const res = await fetch(`/historial/paciente/${idPaciente}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadPaciente)
            });

            if (res.ok) {
                mostrarMensaje("Datos del paciente guardados con éxito.");
            } else {
                mostrarMensaje("Error al guardar los datos del paciente.", "error");
            }
        } catch (error) {
            mostrarMensaje("Error al guardar los datos del paciente.", "error");
            console.error("❌ Error al guardar los datos del paciente:", error);
        }
    }

    // ──────────────────────────────────────────
    // 🔹 Función para guardar el historial clínico en JSON dentro de `historial_clinico`
    async function guardarHistorial() {
        const datosHistorial = {
            peso: document.getElementById("peso").value,
            estatura: document.getElementById("estatura").value,
            imc: document.getElementById("imc").value
        };

        const payloadHistorial = {
            id_paciente_hc_fk: parseInt(idPaciente),
            datos_historial_clinico: datosHistorial
        };

        try {
            const res = await fetch(`/historial/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payloadHistorial)
            });

            if (res.ok) {
                mostrarMensaje("Historial clínico guardado con éxito.");
            } else {
                mostrarMensaje("Error al guardar el historial clínico.", "error");
            }
        } catch (error) {
            mostrarMensaje("Error al guardar historial clínico.", "error");
            console.error("❌ Error al guardar historial clínico:", error);
        }
    }

    // ──────────────────────────────────────────
    // 🔹 Cargar datos al iniciar la página
    cargarDatosPaciente();
    cargarHistorial();

    // ──────────────────────────────────────────
    // 🔹 Event listeners para guardar datos
    document.getElementById("guardarPaciente").addEventListener("click", function (event) {
        event.preventDefault();
        guardarDatosPaciente();
    });

    document.getElementById("guardarHistorial").addEventListener("click", function (event) {
        event.preventDefault();
        guardarHistorial();
    });

    // ──────────────────────────────────────────
    // 🔹 Cálculo automático del IMC
    document.getElementById('peso').addEventListener('input', calcularIMC);
    document.getElementById('estatura').addEventListener('input', calcularIMC);

    function calcularIMC() {
        const peso = parseFloat(document.getElementById('peso').value);
        const estatura = parseFloat(document.getElementById('estatura').value);
        
        if (peso > 0 && estatura > 0) {
            const estaturaMetros = estatura / 100;
            const imc = (peso / (estaturaMetros * estaturaMetros)).toFixed(1);
            document.getElementById('imc').value = imc;
        }
    }
});
