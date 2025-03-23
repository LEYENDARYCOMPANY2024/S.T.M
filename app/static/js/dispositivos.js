document.addEventListener("DOMContentLoaded", async function () {
    const deviceList = document.getElementById("device-list");
    const homeButton = document.querySelector(".home-button");
    const pacienteId = localStorage.getItem("id_paciente");
    const sesionId = localStorage.getItem("id_sesion");
    const terapeutaId = localStorage.getItem("id_terapeuta");

    if (!pacienteId) {
        alert("No hay paciente seleccionado.");
        window.location.href = "/principal";
        return;
    }

    // 🔄 Botón para regresar a principal y limpiar localStorage + desactivar dispositivos
    if (homeButton) {
        homeButton.addEventListener("click", async (e) => {
            e.preventDefault();

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

            window.location.href = "/principal";
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

    async function enviarIdPacienteAlESP(uuid, id_paciente) {
        try {
            const response = await fetch("/esp/configurar_paciente", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uuid, id_paciente })
            });

            const data = await response.json();
            if (response.ok) {
                console.log("📡 ID del paciente enviado al ESP:", data);
            } else {
                console.error("❌ Error al enviar ID del paciente al ESP:", data);
            }
        } catch (error) {
            console.error("❌ Error de red al enviar ID del paciente:", error);
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
                    let ids = JSON.parse(localStorage.getItem("sesion_dispositivo_ids")) || [];
                    if (!ids.includes(result.sesion_dispositivo_id)) {
                        ids.push(result.sesion_dispositivo_id);
                        localStorage.setItem("sesion_dispositivo_ids", JSON.stringify(ids));
                    }

                    // ✅ Enviar ID del paciente al ESP (si hay uuid)
                    if (uuid) {
                        await enviarIdPacienteAlESP(uuid, parseInt(pacienteId));
                    } else {
                        console.warn("⚠️ UUID no disponible para enviar al ESP");
                    }
                } else {
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
