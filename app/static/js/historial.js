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

    // ✅ Función para habilitar/deshabilitar la sección de mujeres
    function actualizarSeccionMujeres() {
        const genero = document.getElementById("sexo").value;
        const seccionMujeres = document.querySelector(".women-section");

        if (genero === "femenino") {
            seccionMujeres.style.display = "block";
        } else {
            seccionMujeres.style.display = "none";
        }
    }

    // ✅ Función para cargar los datos del paciente
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

    // ✅ Función para cargar el historial clínico
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


     // ✅ Función para guardar los datos del paciente en la tabla `pacientes`
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




    // ✅ Función para bloquear campos de texto si se selecciona "No"
    function configurarCamposCondicionales() {
        const condiciones = [
            "diabetes",
            "alergia",
            "hta",
            "cancer",
            "transfusiones",
            "reumaticas",
            "fracturas",
            "embarazo",
            "tabaquismo",
            "alcoholismo",
            "drogas",
            "actividadFisica",
            "automedica"
        ];

        condiciones.forEach(condicion => {
            const radioSi = document.getElementById(`${condicion}Si`);
            const radioNo = document.getElementById(`${condicion}No`);
            if (!radioSi || !radioNo) return;

            const contenedor = radioSi.closest(".inline-field");
            const campoTexto = contenedor ? contenedor.querySelector("input[type='text']") : null;
            if (!campoTexto) return;

            function actualizarCampoTexto() {
                if (radioSi.checked) {
                    campoTexto.disabled = false;
                    campoTexto.placeholder = "Especifique";
                } else if (radioNo.checked) {
                    campoTexto.disabled = true;
                    campoTexto.value = "";
                    campoTexto.placeholder = "No aplica";
                }
            }

            radioSi.addEventListener("change", actualizarCampoTexto);
            radioNo.addEventListener("change", actualizarCampoTexto);
            actualizarCampoTexto();
        });

        // 🔹 Agregar lógica para Espasmos o Contractura Muscular
        const espasmosSi = document.getElementById("espasmosSi");
        const espasmosNo = document.getElementById("espasmosNo");
        const sitioEspasmos = document.getElementById("sitioEspasmos");

        if (espasmosSi && espasmosNo && sitioEspasmos) {
            function actualizarEspasmos() {
                if (espasmosSi.checked) {
                    sitioEspasmos.disabled = false;
                    sitioEspasmos.placeholder = "Indique sitio y características";
                } else if (espasmosNo.checked) {
                    sitioEspasmos.disabled = true;
                    sitioEspasmos.value = "";
                    sitioEspasmos.placeholder = "No aplica";
                }
            }

            espasmosSi.addEventListener("change", actualizarEspasmos);
            espasmosNo.addEventListener("change", actualizarEspasmos);
            actualizarEspasmos();
        }
    }



    // ✅ Función para guardar el historial clínico
    async function guardarHistorial() {
        const datosHistorial = {};
        document.querySelectorAll("input, textarea, select").forEach(input => {
            if (input.id && input.type !== "radio") {
                datosHistorial[input.id] = input.value;
            } else if (input.type === "radio" && input.checked) {
                datosHistorial[input.name] = input.id;
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

    

    // ✅ Event listeners para guardar datos
    document.getElementById("guardarPaciente").addEventListener("click", function (event) {
        event.preventDefault();
        guardarDatosPaciente();
    });

    document.getElementById("guardarHistorial").addEventListener("click", function (event) {
        event.preventDefault();
        guardarHistorial();
    });

    // ✅ Cálculo automático del IMC
    document.getElementById("peso").addEventListener("input", calcularIMC);
    document.getElementById("estatura").addEventListener("input", calcularIMC);

    function calcularIMC() {
        const peso = parseFloat(document.getElementById("peso").value);
        const estatura = parseFloat(document.getElementById("estatura").value);
        
        if (peso > 0 && estatura > 0) {
            const estaturaMetros = estatura / 100;
            const imc = (peso / (estaturaMetros * estaturaMetros)).toFixed(1);
            document.getElementById("imc").value = imc;
        }
    }

    document.getElementById("sexo").addEventListener("change", actualizarSeccionMujeres);

    // ✅ Cargar datos al iniciar la página
    cargarDatosPaciente();
    cargarHistorial();
    configurarCamposCondicionales();
});
