document.addEventListener("DOMContentLoaded", async function () {
    const deviceList = document.getElementById("device-list");
    const pacienteId = localStorage.getItem("id_paciente");
    const sesionId = localStorage.getItem("id_sesion"); // Obtenemos la sesión (puede ser null)

    if (!pacienteId) {
        alert("No hay paciente seleccionado.");
        window.location.href = "/principal";
        return;
    }

    async function fetchDevices() {
        const pacienteId = localStorage.getItem("id_paciente");
    
        if (!pacienteId) {
            alert("No hay paciente seleccionado.");
            window.location.href = "/principal";
            return;
        }
    
        try {
            const response = await fetch(`/dispositivos/${pacienteId}`);
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

    function addDeviceRow(device) {
        const row = document.createElement("tr");

        // Si no hay sesión activa, deshabilitar el botón de activación
        const disabledAttr = sesionId ? "" : "disabled";

        row.innerHTML = `
            <td>${device.nombre_dispositivo}</td>
            <td>${new Date(device.fecha_registro).toLocaleDateString()}</td>
            <td>${device.tipo_de_dispositivo}</td>
            <td>
                <label class="toggle">
                    <input type="checkbox" ${device.estado_dispositivo === "activado" ? "checked" : ""} 
                        data-id="${device.id_dispositivo}" ${disabledAttr}>
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

            try {
                const response = await fetch(`/dispositivos/${pacienteId}/${sesionId}/${deviceId}/toggle`, { method: "PUT" });
                if (!response.ok) throw new Error("No se pudo cambiar el estado del dispositivo.");

                const result = await response.json();
                console.log(`Estado actualizado: ${result.estado}`);
                fetchDevices();  // Recargar lista después de cambiar estado
            } catch (error) {
                console.error("Error al cambiar estado del dispositivo:", error.message);
            }
        });

        deviceList.appendChild(row);
    }

    fetchDevices();
});
