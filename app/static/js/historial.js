document.addEventListener("DOMContentLoaded", async function () {
  const idPaciente = localStorage.getItem("id_paciente");
  if (!idPaciente) {
      alert("No hay paciente seleccionado.");
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

            // 🔹 Asegurar que el estado civil se seleccione correctamente
            const estadoCivilSelect = document.getElementById("estadoCivil");
            if (pacienteData.estado_civil) {
                estadoCivilSelect.value = pacienteData.estado_civil;
            }

            document.getElementById("ocupacion").value = pacienteData.ocupacion || "";

        } else {
            console.warn("ℹ️ No se encontraron datos del paciente.");
        }
    } catch (error) {
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
              console.warn("ℹ️ No se encontró historial para este paciente.");
          }
      } catch (error) {
          console.error("❌ Error al cargar historial clínico:", error);
      }
  }

  // ──────────────────────────────────────────
  // 🔹 Función para guardar los datos del paciente en la tabla `pacientes`
  async function guardarDatosPaciente() {
    const payloadPaciente = {
        nombre: document.getElementById("nombre").value,
        primer_apellido: document.getElementById("primer_apellido").value,
        segundo_apellido: document.getElementById("segundo_apellido").value,
        edad: parseInt(document.getElementById("edad").value),
        genero: document.getElementById("sexo").value,
        estado_civil: document.getElementById("estadoCivil").value,  // 🔹 Enviar el valor exacto del select
        escolaridad: document.getElementById("escolaridad").value,
        ocupacion: document.getElementById("ocupacion").value
    };

    try {
        const res = await fetch(`/historial/paciente/${idPaciente}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payloadPaciente)
        });

        if (!res.ok) {
            let errorMessage = "Error desconocido";
            try {
                const errorData = await res.json();
                errorMessage = errorData.detail;
            } catch (e) {
                errorMessage = "Error en el servidor (No se pudo interpretar la respuesta)";
            }
            throw new Error(errorMessage);
        }

        alert("✅ Datos del paciente guardados con éxito.");

    } catch (error) {
        console.error("❌ Error al guardar los datos del paciente:", error);
        alert(`❌ ${error.message}`);
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
              alert("Historial clínico guardado con éxito.");
          } else {
              alert("Error al guardar el historial clínico.");
          }
      } catch (error) {
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
