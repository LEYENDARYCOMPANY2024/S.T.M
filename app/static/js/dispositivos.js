document.addEventListener('DOMContentLoaded', async function () {
    const deviceList = document.getElementById('device-list');
    const pacienteId = 45; // Cambia esto con el ID real del paciente (puede venir de la sesión)

    async function fetchDevices() {
        const response = await fetch(`/dispositivos/${pacienteId}`);
        const devices = await response.json();

        deviceList.innerHTML = '';
        devices.forEach(device => addDeviceRow(device));
    }

    function addDeviceRow(device) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${device.nombre_dispositivo}</td>
            <td>${new Date(device.fecha_registro).toLocaleDateString()}</td>
            <td>${device.tipo_de_dispositivo}</td>
            <td>
                <label class="toggle">
                    <input type="checkbox" ${device.estado_dispositivo === 'activado' ? 'checked' : ''} data-id="${device.id_dispositivo}">
                    <span class="slider"></span>
                </label>
            </td>
        `;

        row.querySelector('input[type="checkbox"]').addEventListener('change', async function () {
            const deviceId = this.getAttribute('data-id');
            await fetch(`/dispositivos/${pacienteId}/${deviceId}/toggle`, { method: 'PUT' });
            fetchDevices();
        });

        deviceList.appendChild(row);
    }

    fetchDevices();
});
