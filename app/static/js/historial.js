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

    // ✅ Función para bloquear casillas si se selecciona "No"
    // ✅ Función para bloquear casillas si se selecciona "No"
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

    document.getElementById("sexo").addEventListener("change", actualizarSeccionMujeres);

    // ✅ Cargar datos al iniciar la página
    cargarDatosPaciente();
    cargarHistorial();
    configurarCamposCondicionales();

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
});
