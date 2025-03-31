// 📌 Función para mostrar mensajes de éxito o error con el diseño personalizado
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

document.addEventListener("DOMContentLoaded", async () => {
    let idSesion = localStorage.getItem("id_sesion");
    const nombreSesion = localStorage.getItem("nombre_sesion"); // ✅ Obtener el nombre de la sesión

    if (!idSesion) {
        mostrarMensaje("No hay sesión seleccionada.", "error");
        window.location.href = "/sesiones";
        return;
    }

    try {
        // 📌 Obtener detalles de la sesión desde la API
        const response = await fetch(`/detalle_sesiones/${idSesion}`);
        if (!response.ok) throw new Error("Error obteniendo la sesión");

        const sesion = await response.json();

        if (sesion.finalizada) {
            mostrarMensaje("🔒 Esta sesión ya fue finalizada. No se permiten cambios.", "error");
          
            // Desactivar todos los botones, inputs, selects
            document.querySelectorAll("button, input, select").forEach(el => el.disabled = true);
            document.querySelectorAll("textarea").forEach(el => el.readOnly = true);
          
            // También puedes ocultar los botones de exportar, importar, guardar o reiniciar gráfica
            const botonesOcultar = [
              "exportButton", "importButton", "reiniciarButton", "finalizarSesion"
            ];
            botonesOcultar.forEach(id => {
              const btn = document.getElementById(id);
              if (btn) btn.style.display = "none";
            });
          }          

        // ✅ Mostrar el nombre de la sesión en lugar del ID
        document.getElementById("session-title").textContent = nombreSesion || `Sesión ${idSesion}`;  
        document.getElementById("session-description").value = sesion.descripcion_sesion || "";
        document.getElementById("nota-evolutiva").value = sesion.nota_evolutiva || "";

        console.log("📌 Datos de la sesión recibidos:", sesion);

        // 📌 Mostrar la fecha y la hora formateadas
        const fechaISO = sesion.fecha_inicio;
        const fechaFormateada = new Date(fechaISO + "T00:00:00").toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const horaISO = sesion.hora_inicio;
        const horaSinZona = horaISO.split("T")[1].split("+")[0];
        const [hora, minutos] = horaSinZona.split(":");
        const horaNumerica = parseInt(hora, 10);
        const ampm = horaNumerica >= 12 ? "PM" : "AM";
        const hora12 = horaNumerica % 12 || 12;

        const horaFormateada = `${hora12}:${minutos} ${ampm}`;

        document.getElementById("session-date").textContent = `📅 ${fechaFormateada}`;
        document.getElementById("session-time").textContent = `⏰ ${horaFormateada}`;

        // 📌 Evento para actualizar la nota evolutiva
        document.getElementById("nota-evolutiva").addEventListener("change", async () => {
            try {
                const updateResponse = await fetch(`/detalle_sesiones/${idSesion}/nota`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nota_evolutiva: document.getElementById("nota-evolutiva").value })
                });

                if (!updateResponse.ok) throw new Error("Error al actualizar la nota");
                mostrarMensaje("Nota evolutiva actualizada correctamente", "success");

            } catch (error) {
                mostrarMensaje("Error al actualizar la nota evolutiva", "error");
                console.error(error);
            }
        });

        // 📌 *Evento para actualizar la descripción*
        document.getElementById("session-description").addEventListener("change", async () => {
            try {
                const updateResponse = await fetch(`/detalle_sesiones/${idSesion}/descripcion`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ descripcion_sesion: document.getElementById("session-description").value })
                });

                if (!updateResponse.ok) throw new Error("Error al actualizar la descripción");
                mostrarMensaje("Descripción actualizada correctamente", "success");

            } catch (error) {
                mostrarMensaje("Error al actualizar la descripción", "error");
                console.error(error);
            }
        });

        // 📌 Evento para salir del detalle de sesión y volver a la lista de sesiones
        const salirDetalleBtn = document.getElementById("salir-detalle");

        if (salirDetalleBtn) {
        salirDetalleBtn.addEventListener("click", () => {
            const overlay = document.createElement("div");
            overlay.className = "modal-overlay";

            const modal = document.createElement("div");
            modal.className = "modal-confirm";

            modal.innerHTML = `
            <h2>¿Salir del detalle de sesión?</h2>
            <p>⚠ Esto eliminará los datos en tiempo real e importados de esta sesión.<br>
            💾 Se recomienda <strong>guardar tu gráfica</strong> antes de salir.</p>
            <div class="modal-buttons">
                <button class="btn-secondary" id="cancelarSalir">Cancelar</button>
                <button class="btn-danger" id="confirmarSalir">Salir</button>
            </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            document.getElementById("cancelarSalir").onclick = () => {
            overlay.remove();
            };

            document.getElementById("confirmarSalir").onclick = async () => {
            const sesionId = localStorage.getItem("id_sesion");

            if (sesionId) {
                try {
                await fetch(`/dispositivos/desactivar/${sesionId}`, {
                    method: "PUT"
                });
                console.log("🔌 Dispositivos desactivados al salir de la sesión.");
                } catch (error) {
                console.error("❌ Error al desactivar dispositivos:", error);
                }
            }

            // 🧹 Eliminar datos de sesión y gráficas
            localStorage.removeItem("id_sesion");
            localStorage.removeItem("nombre_sesion");
            localStorage.removeItem("sesion_dispositivo_ids");
            localStorage.removeItem("graficas_ids");

            // 🧹 También los datos de Smoothie si existen
            localStorage.removeItem("smoothie_import_izq");
            localStorage.removeItem("smoothie_import_der");

            // 🧹 Y los datos de Chart.js
            localStorage.removeItem("chartjs_import_izq");
            localStorage.removeItem("chartjs_import_der");


            window.location.href = "/sesiones";
            };
        });
        }


    } catch (error) {
        console.error(error);
        mostrarMensaje("Error cargando la sesión", "error");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const irInicioBtn = document.querySelector(".home-button");

    if (irInicioBtn) {
      irInicioBtn.addEventListener("click", (e) => {
        e.preventDefault();

        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";

        const modal = document.createElement("div");
        modal.className = "modal-confirm";

        modal.innerHTML = `
          <h2>¿Ir al inicio?</h2>
          <p>⚠ Si vuelves al inicio, <strong>se eliminarán los datos de las gráficas importadas o en tiempo real</strong>.<br>
          💾 Te recomendamos <strong>guardar tu gráfica</strong> antes de continuar.</p>
          <div class="modal-buttons">
            <button class="btn-secondary" id="cancelarInicio">Cancelar</button>
            <button class="btn-danger" id="confirmarInicio">Ir al inicio</button>
          </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById("cancelarInicio").onclick = () => {
          overlay.remove();
        };

        document.getElementById("confirmarInicio").onclick = async () => {
          const sesionId = localStorage.getItem("id_sesion");

          if (sesionId) {
            try {
              await fetch(`/dispositivos/desactivar/${sesionId}`, { method: "PUT" });
              console.log("🔌 Dispositivos desactivados al ir al inicio.");
            } catch (error) {
              console.error("❌ Error al desactivar dispositivos:", error);
            }
          }

          // 🧹 Eliminar todo lo relacionado a gráficas
          localStorage.removeItem("id_sesion");
          localStorage.removeItem("nombre_sesion");
          localStorage.removeItem("sesion_dispositivo_ids");
          localStorage.removeItem("graficas_ids");

          // 🧹 Eliminar respaldo de datos importados o en tiempo real (Smoothie)
          localStorage.removeItem("smoothie_import_izq");
          localStorage.removeItem("smoothie_import_der");

          // 🧹 Y los datos de Chart.js
          localStorage.removeItem("chartjs_import_izq");
          localStorage.removeItem("chartjs_import_der");

          window.location.href = "/principal";
        };
      });
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const finalizarBtn = document.getElementById("finalizarSesion");
  
    if (finalizarBtn) {
      finalizarBtn.addEventListener("click", () => {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
  
        const modal = document.createElement("div");
        modal.className = "modal-confirm";
  
        modal.innerHTML = `
          <h2>¿Finalizar sesión?</h2>
          <p>⚠ Esto <strong>enviará los datos finales al paciente de la gráfica y tabla</strong>.<br>
          🔒 Después de esto, <strong>ya no podrás hacer modificaciones</strong> en esta sesión.<br>
          ¿Deseas continuar?</p>
          <div class="modal-buttons">
            <button class="btn-secondary" id="cancelarFinalizar">Cancelar</button>
            <button class="btn-danger" id="confirmarFinalizar">Finalizar</button>
          </div>
        `;
  
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
  
        document.getElementById("cancelarFinalizar").onclick = () => {
          overlay.remove();
        };
  
        document.getElementById("confirmarFinalizar").onclick = async () => {
          overlay.remove();
  
          const idSesion = localStorage.getItem("id_sesion");
          if (!idSesion) {
            mostrarMensaje("❌ No se encontró la sesión activa", "error");
            return;
          }
  
          let datosGrafica = null;
  
          if (window.tipoGraficaActiva === "chartjs") {
            datosGrafica = {
              izquierda: JSON.parse(localStorage.getItem("chartjs_import_izq") || "[]"),
              derecha: JSON.parse(localStorage.getItem("chartjs_import_der") || "[]")
            };
          } else if (window.tipoGraficaActiva === "smoothie") {
            datosGrafica = {
              izquierda: JSON.parse(localStorage.getItem("smoothie_import_izq") || "[]"),
              derecha: JSON.parse(localStorage.getItem("smoothie_import_der") || "[]")
            };
          }
  
          // 🔵 También puedes extraer datos de MediaPipe si ya los guardas
          let datosMediapipe = [];

            try {
            const stored = localStorage.getItem("tabla_mediapipe");
            const parsed = JSON.parse(stored);

            if (Array.isArray(parsed)) {
                datosMediapipe = parsed;
            } else {
                console.warn("⚠️ MediaPipe no es un array, usando [] por defecto");
            }
            } catch (e) {
            console.warn("⚠️ Error parseando tabla_mediapipe, usando [] por defecto");
            }

  
          try {
            const response = await fetch("/graficas_movil", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id_sesion_fk: parseInt(idSesion),
                datos_graficas: datosGrafica,
                datos_mediapipe: datosMediapipe
              })
            });
  
            if (!response.ok) throw new Error("❌ Error al guardar en el backend");
  
            mostrarMensaje("✅ Sesión finalizada y datos enviados");
  
            // 🛑 Opcional: desactiva todos los inputs, botones y controles
            document.querySelectorAll("button, input, select").forEach(el => el.disabled = true);
            document.querySelectorAll("textarea").forEach(el => el.readOnly = true);

            localStorage.removeItem("tabla_mediapipe");

  
          } catch (error) {
            console.error(error);
            mostrarMensaje("❌ Error al finalizar sesión", "error");
          }
        };
      });
    }
  });
  
  
