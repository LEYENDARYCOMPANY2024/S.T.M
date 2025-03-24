document.addEventListener("DOMContentLoaded", async function () {
    // ──────────────────────────────────────────
    //  Mensajes de retroalimentación
    function mostrarMensaje(mensaje, tipo = "success") {
        const alertBox = document.createElement("div");
        alertBox.classList.add("alert", tipo === "success" ? "success" : "error");
        alertBox.innerHTML = `
            <span class="alert-icon">${tipo === "success" ? "✅" : "❌"}</span> 
            ${mensaje}
        `;
        document.body.appendChild(alertBox);

        setTimeout(() => alertBox.classList.add("show"), 100);
        setTimeout(() => {
            alertBox.classList.remove("show");
            setTimeout(() => alertBox.remove(), 300);
        }, 3000);
    }

    // ──────────────────────────────────────────
    //  Verificar id del paciente en localStorage
    const idPaciente = localStorage.getItem("id_paciente");
    if (!idPaciente) {
        mostrarMensaje("No hay paciente seleccionado.", "error");
        window.location.href = "/principal";
        return;
    }

    // ──────────────────────────────────────────
    //  Actualizar visibilidad de la sección de mujeres
    function actualizarSeccionMujeres() {
        const genero = document.getElementById("sexo").value;
        const seccionMujeres = document.querySelector(".women-section");
        seccionMujeres.style.display = (genero === "femenino") ? "block" : "none";
    }

    // ──────────────────────────────────────────
    //  Cargar datos del paciente (tabla pacientes)
    async function cargarDatosPaciente() {
        try {
            const response = await fetch(`/historial/paciente/${idPaciente}`);
            if (!response.ok) {
                mostrarMensaje("No se encontraron datos del paciente.", "error");
                return;
            }
            const pacienteData = await response.json();

            // Asignar campos de la tabla Datos del Paciente
            document.getElementById("nombre").value = pacienteData.nombre || "";
            document.getElementById("primer_apellido").value = pacienteData.primer_apellido || "";
            document.getElementById("segundo_apellido").value = pacienteData.segundo_apellido || "";
            document.getElementById("edad").value = pacienteData.edad || "";
            document.getElementById("escolaridad").value = pacienteData.escolaridad || "";
            document.getElementById("sexo").value = pacienteData.genero || "";
            document.getElementById("estadoCivil").value = pacienteData.estado_civil || "soltero";
            document.getElementById("ocupacion").value = pacienteData.ocupacion || "";

            // Mostrar u ocultar sección de mujeres
            actualizarSeccionMujeres();
        } catch (error) {
            mostrarMensaje("Error al cargar datos del paciente.", "error");
            console.error("❌ Error al cargar datos del paciente:", error);
        }
    }

    // ──────────────────────────────────────────
    //  Cargar historial clínico en el formulario (JSON excepto tabla Paciente)
    // ──────────────────────────────────────────
    // ──────────────────────────────────────────
    async function cargarHistorial() {
        try {
            const response = await fetch(`/historial/${idPaciente}`);
            if (!response.ok) {
                mostrarMensaje("No se encontró historial para este paciente.", "error");
                return;
            }
            const data = await response.json();
            const historial = data.datos_historial_clinico || {};

            // Restaurar todos los campos (radio, texto, textarea, select) excepto Datos del Paciente
            Object.keys(historial).forEach(key => {
                const valorGuardado = historial[key];
                const elemento = document.getElementById(key);

                if (elemento) {
                    // Elementos normales (texto, textarea, select)
                    elemento.value = valorGuardado;
                } else if (valorGuardado && (valorGuardado.includes('Si') || valorGuardado.includes('No') || valorGuardado.includes('inicial') || valorGuardado.includes('final'))) {
                    // Radios con patrón Sí/No o casos especiales (inicial/final)
                    const radio = document.getElementById(valorGuardado);
                    if (radio) radio.checked = true;
                }
            });


            // Actualiza la configuración de ca
            // mpos dependientes
            configurarCamposCondicionales();

        } catch (error) {
            mostrarMensaje("Error al cargar historial clínico.", "error");
            console.error("❌ Error al cargar historial clínico:", error);
        }
    }



    // ──────────────────────────────────────────
    //  Guardar datos del paciente en la tabla pacientes
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

            if (!res.ok) {
                mostrarMensaje("Error al guardar los datos del paciente.", "error");
                return;
            }
            mostrarMensaje("Datos del paciente guardados con éxito.");
        } catch (error) {
            mostrarMensaje("Error al guardar los datos del paciente.", "error");
            console.error("❌ Error al guardar los datos del paciente:", error);
        }
    }

    // ──────────────────────────────────────────
    //  Configuración de campos condicionales (Sí/No)
    function configurarCamposCondicionales() {
        // Para cada .inline-field, si escojo 'Si' => habilito. 'No' => deshabilito y value='No aplica'
        document.querySelectorAll(".inline-field").forEach(contenedor => {
            const radioSi = contenedor.querySelector("input[type='radio'][id$='Si']");
            const radioNo = contenedor.querySelector("input[type='radio'][id$='No']");
            const campoTexto = contenedor.querySelector("input[type='text']");

            if (!radioSi || !radioNo || !campoTexto) return;

            function actualizarCampoTexto() {
                if (radioSi.checked) {
                    campoTexto.disabled = false;
                } else if (radioNo.checked) {
                    campoTexto.disabled = true;
                    campoTexto.value = "No aplica";
                }
            }

            // Al cambiar la opción, actualizar
            radioSi.addEventListener("change", actualizarCampoTexto);
            radioNo.addEventListener("change", actualizarCampoTexto);
            // Inicial
            actualizarCampoTexto();
        });
    }

    // ──────────────────────────────────────────
    //  Guardar historial clínico en JSON (excluyendo tabla Paciente)
    async function guardarHistorial() {
        const datosHistorial = {};
        // Campos que NO se deben incluir en JSON
        const excluirCampos = [
            "nombre", "primer_apellido", "segundo_apellido", "sexo", 
            "edad", "estadoCivil", "ocupacion", "escolaridad"
        ];

        // Capturar todos los inputs (radio, text, textarea, select) EXCEPTO los del Paciente
        document.querySelectorAll("input, textarea, select").forEach(input => {
            // Si es un ID válido y no está en la lista de exclusión
            if (input.id && !excluirCampos.includes(input.id)) {
                // Radio y está checked
                if (input.type === "radio" && input.checked) {
                    // Guardamos name: ID => p.e. diabetes: 'diabetesSi'
                    datosHistorial[input.name] = input.id;
                }
                // Texto, textarea, select
                else if (input.type !== "radio") {
                    datosHistorial[input.id] = input.value;
                }
            }
        });

        // Crear payload
        const payloadHistorial = {
            id_paciente_hc_fk: parseInt(idPaciente),
            datos_historial_clinico: datosHistorial
        };

        try {
            const res = await fetch(/historial/, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadHistorial)
            });

            if (!res.ok) {
                mostrarMensaje("Error al guardar el historial clínico.", "error");
                return;
            }
            mostrarMensaje("Historial clínico guardado con éxito.");
        } catch (error) {
            mostrarMensaje("Error al guardar historial clínico.", "error");
            console.error("❌ Error al guardar historial clínico:", error);
        }
    }

    // ──────────────────────────────────────────
    //  Cálculo automático del IMC
    function calcularIMC() {
        const peso = parseFloat(document.getElementById("peso").value);
        const estatura = parseFloat(document.getElementById("estatura").value);
        if (peso > 0 && estatura > 0) {
            const imc = (peso / (Math.pow(estatura / 100, 2))).toFixed(1);
            document.getElementById("imc").value = imc;
        }
    }

    // ──────────────────────────────────────────
    //  Event listeners y flujos iniciales
    document.getElementById("guardarPaciente").addEventListener("click", e => {
        e.preventDefault();
        guardarDatosPaciente();
    });

    document.getElementById("guardarHistorial").addEventListener("click", e => {
        e.preventDefault();
        guardarHistorial();
    });

    document.getElementById("peso").addEventListener("input", calcularIMC);
    document.getElementById("estatura").addEventListener("input", calcularIMC);
    document.getElementById("sexo").addEventListener("change", actualizarSeccionMujeres);

    // Carga inicial
    await cargarDatosPaciente();   // datos de la tabla Paciente
    await cargarHistorial();       // datos del JSON historial
    configurarCamposCondicionales();
});

document.addEventListener("DOMContentLoaded", () => {
    const homeButton = document.querySelector(".home-button");
    if (homeButton) {
        homeButton.addEventListener("click", async (e) => {
            e.preventDefault(); // ✋ prevenir redirección inmediata

            const sesionId = localStorage.getItem("id_sesion");

            if (sesionId) {
                try {
                    await fetch(`/dispositivos/desactivar/${sesionId}`, {
                        method: "PUT"
                    });
                    console.log("🔌 Dispositivos desactivados correctamente.");
                } catch (error) {
                    console.error("❌ Error al desactivar dispositivos:", error);
                }
            }

            console.log("🏠 Limpiando localStorage al volver a principal...");
            localStorage.removeItem("id_sesion");
            localStorage.removeItem("nombre_sesion");
            localStorage.removeItem("sesion_dispositivo_ids");

            // ✅ Redirigir luego de limpiar todo
            window.location.href = "/principal";
        });
    }
});
