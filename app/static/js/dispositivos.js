
import { verificarSesionYRedirigir } from "./verificar_sesion.js";

document.addEventListener("DOMContentLoaded", async function () {

    if (!verificarSesionYRedirigir()) return; // ⛔ Si no hay sesión, no continúa
    const deviceList = document.getElementById("device-list");
    const homeButton = document.querySelector(".home-button");
    const pacienteId = localStorage.getItem("id_paciente");
    const sesionId = localStorage.getItem("id_sesion");
    const terapeutaId = localStorage.getItem("id_terapeuta");

    // 📌 Función para mostrar mensajes de éxito o error
    function showMessage(text, type = "success") {
        // 🔧 Crear el contenedor si no existe
        let container = document.getElementById("message-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "message-container";
            document.body.appendChild(container);
        }
    
        // 🧊 Crear el mensaje
        const message = document.createElement("div");
        message.className = `message ${type}`;
    
        const icon = {
            success: "",
            error: "",
            warning: ""
        }[type] || "";
    
        message.innerHTML = `<span class="message-icon">${icon}</span> ${text}`;
    
        container.appendChild(message);
    
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
      
        if (homeButton) {
          homeButton.addEventListener("click", (e) => {
            e.preventDefault();
      
            const overlay = document.createElement("div");
            overlay.className = "modal-overlay";
      
            const modal = document.createElement("div");
            modal.className = "modal-confirm";
      
            modal.innerHTML = `
              <h2>¿Ir al inicio?</h2>
              <p>⚠ Al volver al inicio, <strong>se cerrará esta sección</strong> y se desactivarán los dispositivos activos.<br>
              ¿Deseas continuar?</p>
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
              overlay.remove();
      
              if (sesionId) {
                try {
                  await fetch(`/dispositivos/desactivar/${sesionId}`, { method: "PUT" });
                  console.log("🔌 Dispositivos desactivados correctamente.");
                } catch (error) {
                  console.error("❌ Error al desactivar dispositivos:", error);
                }
              }
      
              console.log("🏠 Limpiando localStorage al volver a principal...");
              localStorage.removeItem("id_sesion");
              localStorage.removeItem("nombre_sesion");
              localStorage.removeItem("sesion_dispositivo_ids");
      
              window.location.href = "/principal";
            };
          });
        }
      
      

    async function fetchDevices() {
        if (!pacienteId || !terapeutaId) {
            alert("No hay paciente o terapeuta seleccionado.");
            window.location.href = "/principal";
            return;
        }

        try {
            const response = await fetch(`/dispositivos/${pacienteId}/${terapeutaId}`);
            if (!response.ok) throw new Error(`Error ${response.status}: No se encontraron dispositivos.`);

            const devices = await response.json();

            if (!Array.isArray(devices)) throw new Error("Respuesta de la API no es una lista.");

            deviceList.innerHTML = "";
            devices.forEach(device => addDeviceRow(device));
        } catch (error) {
            console.error("Error al obtener dispositivos:", error.message);
            deviceList.innerHTML = '<tr><td colspan="4">No se encontraron dispositivos.</td></tr>';
        }
    }

    async function enviarDatosAlESP(uuid, id_paciente, id_sesion_dispositivo, lado_pierna) {
        try {
            const payload = { uuid, id_paciente, id_sesion_dispositivo };
            if (lado_pierna) payload.lado_pierna = lado_pierna;
    
            const response = await fetch("/esp/configurar_paciente", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
    
            const data = await response.json();
            if (response.ok) {
                console.log("📡 Datos enviados al ESP:", data);
            } else {
                console.error("❌ Error al enviar datos al ESP:", data);
            }
        } catch (error) {
            console.error("❌ Error de red al enviar datos al ESP:", error);
        }
    }
    
    

    function addDeviceRow(device) {
        const row = document.createElement("tr");
        const disabledAttr = sesionId ? "" : "disabled";

        row.innerHTML = `
            <td>${device.nombre_dispositivo}</td>
            <td>${new Date(device.fecha_registro).toLocaleDateString()}</td>
            <td>${device.tipo_de_dispositivo}</td>
            <td>
                <label class="toggle">
                    <input type="checkbox"
                    ${device.estado_dispositivo === "activado" ? "checked" : ""}
                    data-id="${device.id_dispositivo}"
                    data-uuid="${device.uuid || ""}" 
                    ${disabledAttr}>
                    <span class="slider"></span>
                </label>
            </td>
        `;

        row.querySelector("input[type='checkbox']").addEventListener("change", async function () {
            if (!sesionId) {
                alert("Debe iniciar una sesión para activar dispositivos.");
                this.checked = false;
                return;
            }

            const deviceId = this.getAttribute("data-id");
            const uuidAttr = this.getAttribute("data-uuid");

            try {
                const response = await fetch(`/dispositivos/${pacienteId}/${sesionId}/${deviceId}/toggle`, {
                    method: "PUT"
                });

                if (!response.ok) throw new Error("No se pudo cambiar el estado del dispositivo.");

                const result = await response.json();
                const uuid = result.uuid || uuidAttr;

                

                if (result.estado === "activado") {
                    // Guardar sesión_dispositivo_id
                    let ids = JSON.parse(localStorage.getItem("sesion_dispositivo_ids")) || [];
                    if (!ids.includes(result.sesion_dispositivo_id)) {
                        ids.push(result.sesion_dispositivo_id);
                        localStorage.setItem("sesion_dispositivo_ids", JSON.stringify(ids));
                    }
                
                    // También guardamos el lado si existe
                    const lado = localStorage.getItem(`lado_pierna_${result.sesion_dispositivo_id}`) || "";
                    if (uuid) {
                        await enviarDatosAlESP(uuid, parseInt(pacienteId), result.sesion_dispositivo_id, lado);
                    }
                }                
                 else {
                    let ids = JSON.parse(localStorage.getItem("sesion_dispositivo_ids")) || [];
                    ids = ids.filter(id => id !== result.sesion_dispositivo_id);
                    localStorage.setItem("sesion_dispositivo_ids", JSON.stringify(ids));
                }

                console.log(`Estado actualizado: ${result.estado}`);
                fetchDevices();

            } catch (error) {
                console.error("Error al cambiar estado del dispositivo:", error.message);
            }
        });

        deviceList.appendChild(row);
    }

    fetchDevices();
});
