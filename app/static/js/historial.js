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

    function actualizarSeccionMujeres() {
        const genero = document.getElementById("sexo").value;
        const seccionMujeres = document.querySelector(".women-section");
        seccionMujeres.style.display = (genero === "femenino") ? "block" : "none";
    }

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

                actualizarSeccionMujeres();
            } else {
                mostrarMensaje("No se encontraron datos del paciente.", "error");
            }
        } catch (error) {
            mostrarMensaje("Error al cargar datos del paciente.", "error");
            console.error("❌ Error al cargar datos del paciente:", error);
        }
    }

    async function cargarHistorial() {
        try {
            const response = await fetch(`/historial/${idPaciente}`);
            if (response.ok) {
                const data = await response.json();
                const historial = data.datos_historial_clinico || {};

                Object.keys(historial).forEach(key => {
                    const inputElement = document.getElementById(key);
                    if (inputElement) inputElement.value = historial[key];
                });

            } else {
                mostrarMensaje("No se encontró historial para este paciente.", "error");
            }
        } catch (error) {
            mostrarMensaje("Error al cargar historial clínico.", "error");
            console.error("❌ Error al cargar historial clínico:", error);
        }
    }

    async function guardarDatosPaciente() {
        const payloadPaciente = {
            nombre: document.getElementById("nombre").value,
            primer_apellido: document.getElementById("primer_apellido").value,
            segundo_apellido: document.getElementById("segundo_apellido").value,
            edad: parseInt(document.getElementById("edad").value),
            genero: document.getElementById("sexo").value,
            estado_civil: document.getElementById("estadoCivil").value,
            escolaridad: document.getElementById("escolaridad").value || null,  
            ocupacion: document.getElementById("ocupacion").value || null  
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

    function configurarCamposCondicionales() {
        document.querySelectorAll(".inline-field").forEach(contenedor => {
            const radioSi = contenedor.querySelector("input[type='radio'][id$='Si']");
            const radioNo = contenedor.querySelector("input[type='radio'][id$='No']");
            const campoTexto = contenedor.querySelector("input[type='text']");

            if (!radioSi || !radioNo || !campoTexto) return;

            function actualizarCampoTexto() {
                campoTexto.disabled = !radioSi.checked;
                campoTexto.value = radioNo.checked ? "No aplica" : campoTexto.value;
            }

            radioSi.addEventListener("change", actualizarCampoTexto);
            radioNo.addEventListener("change", actualizarCampoTexto);
            actualizarCampoTexto();
        });
    }

    async function guardarHistorial() {
        const datosHistorial = {};
        const excluirCampos = ["nombre", "primer_apellido", "segundo_apellido", "sexo", "edad", "estadoCivil", "ocupacion", "escolaridad"];

        document.querySelectorAll("input, textarea, select").forEach(input => {
            if (input.id && input.type !== "radio" && !excluirCampos.includes(input.id)) {
                datosHistorial[input.id] = input.value;
            } else if (input.type === "radio" && input.checked && !excluirCampos.includes(input.name)) {
                datosHistorial[input.name] = input.id.includes("Si") ? "Sí" : "No";
            }
        });

        document.querySelectorAll(".inline-field input[type='text']").forEach(input => {
            if (input.disabled) {
                datosHistorial[input.id] = "No aplica";
            }
        });

        const payloadHistorial = {
            id_paciente_hc_fk: parseInt(idPaciente),
            datos_historial_clinico: datosHistorial
        };

        try {
            const res = await fetch(`/historial/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

    document.getElementById("guardarPaciente").addEventListener("click", function (event) {
        event.preventDefault();
        guardarDatosPaciente();
    });

    document.getElementById("guardarHistorial").addEventListener("click", function (event) {
        event.preventDefault();
        guardarHistorial();
    });

    document.getElementById("peso").addEventListener("input", calcularIMC);
    document.getElementById("estatura").addEventListener("input", calcularIMC);

    function calcularIMC() {
        const peso = parseFloat(document.getElementById("peso").value);
        const estatura = parseFloat(document.getElementById("estatura").value);
        
        if (peso > 0 && estatura > 0) {
            document.getElementById("imc").value = (peso / ((estatura / 100) ** 2)).toFixed(1);
        }
    }

    document.getElementById("sexo").addEventListener("change", actualizarSeccionMujeres);

    cargarDatosPaciente();
    cargarHistorial();
    configurarCamposCondicionales();
});
