const supabase = window.supabase.createClient(
    'https://hxjmzijhcmhfcrjcptge.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4am16aWpoY21oZmNyamNwdGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwODMxODgsImV4cCI6MjA1NTY1OTE4OH0.fZ1QaYkFTfJTdupOUkV7V9a7kIIVHCt_XusnNWxkyqw'
);
// Estructura con múltiples datasets (uno por tipo de dato por pierna)
let chartData = {
    labels: [],
    datasets: {
        izquierda: {
            ax: [], ay: [], az: [], rx: [], ry: [], rz: []
        },
        derecha: {
            ax: [], ay: [], az: [], rx: [], ry: [], rz: []
        }
    }
};

let chart = null;
let realtimePaused = false;
const MAX_DATA_POINTS = 30;

document.addEventListener("DOMContentLoaded", () => {
    const ctx = document.getElementById("grafica_realtime").getContext("2d");

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                // Izquierda
                { label: "Izq - Acel X", borderColor: "navy", data: chartData.datasets.izquierda.ax, fill: false },
                { label: "Izq - Acel Y", borderColor: "blue", data: chartData.datasets.izquierda.ay, fill: false },
                { label: "Izq - Acel Z", borderColor: "lightblue", data: chartData.datasets.izquierda.az, fill: false },
                { label: "Izq - Rot X", borderColor: "purple", data: chartData.datasets.izquierda.rx, fill: false },
                { label: "Izq - Rot Y", borderColor: "violet", data: chartData.datasets.izquierda.ry, fill: false },
                { label: "Izq - Rot Z", borderColor: "magenta", data: chartData.datasets.izquierda.rz, fill: false },

                // Derecha
                { label: "Der - Acel X", borderColor: "darkred", data: chartData.datasets.derecha.ax, fill: false },
                { label: "Der - Acel Y", borderColor: "red", data: chartData.datasets.derecha.ay, fill: false },
                { label: "Der - Acel Z", borderColor: "salmon", data: chartData.datasets.derecha.az, fill: false },
                { label: "Der - Rot X", borderColor: "orange", data: chartData.datasets.derecha.rx, fill: false },
                { label: "Der - Rot Y", borderColor: "gold", data: chartData.datasets.derecha.ry, fill: false },
                { label: "Der - Rot Z", borderColor: "yellow", data: chartData.datasets.derecha.rz, fill: false }
            ]
        },
        options: {
            animation: false,
            responsive: true,
            scales: {
                y: { beginAtZero: true },
                x: { display: true }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });

    document.getElementById("importInput").addEventListener("change", importarCSV);
});


function limitData() {
    if (chartData.labels.length > MAX_DATA_POINTS) {
        chartData.labels.shift();
        Object.values(chartData.datasets).forEach(dataset => {
            Object.keys(dataset).forEach(key => dataset[key].shift());
        });
    }
}

function suscribirseAGraficasRealtime() {
    const ids = JSON.parse(localStorage.getItem("sesion_dispositivo_ids"));
    if (!ids || ids.length === 0) return;

    supabase
        .channel('graficas_realtime')
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'graficas'
        }, payload => {
            if (realtimePaused) return;

            const data = payload.new;
            const idSesion = data.id_sesion_dispositivo_fk;
            const lado = data.lado_pierna;

            if (!idSesion || !lado || !ids.includes(idSesion)) return;

            const t = new Date(data.fecha_hora).toLocaleTimeString();
            chartData.labels.push(t);

            const grupo = chartData.datasets[lado];
            if (!grupo) return;

            grupo.ax.push(data.aceleracion_x ?? 0);
            grupo.ay.push(data.aceleracion_y ?? 0);
            grupo.az.push(data.aceleracion_z ?? 0);
            grupo.rx.push(data.rotacion_x ?? 0);
            grupo.ry.push(data.rotacion_y ?? 0);
            grupo.rz.push(data.rotacion_z ?? 0);

            limitData();
            chart.update();
        })
        .subscribe();
}

function reiniciarGrafica() {
    chartData.labels = [];
    Object.values(chartData.datasets).forEach(dataset => {
        Object.keys(dataset).forEach(key => dataset[key] = []);
    });
    chart.update();
    mostrarMensaje("🔄 Gráfica reiniciada");
}

function togglePause() {
    realtimePaused = !realtimePaused;
    document.getElementById("pauseButton").textContent = realtimePaused ? "Reanudar" : "Pausar";
    mostrarMensaje(realtimePaused ? "⏸️ Pausado" : "▶️ Reanudado");
}

function mostrarMensaje(mensaje, tipo = "success") {
    const alertBox = document.createElement("div");
    alertBox.classList.add("alert", tipo === "success" ? "success" : "error");
    alertBox.innerHTML = `<span class="alert-icon">${tipo === "success" ? "✅" : "❌"}</span> ${mensaje}`;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.classList.add("show"), 100);
    setTimeout(() => {
        alertBox.classList.remove("show");
        setTimeout(() => alertBox.remove(), 300);
    }, 3000);
}

async function importarCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const etiqueta = prompt("Etiqueta para los datos importados:", "importacion_manual");
    if (etiqueta) formData.append("etiqueta", etiqueta);

    try {
        const response = await fetch("/graficas/importar", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        mostrarMensaje(result.mensaje, "success");

    } catch (error) {
        mostrarMensaje("Error al importar CSV", "error");
        console.error("Error al importar CSV:", error);
    }
}

async function enviarDatosAlESP(uuid, id_paciente, id_sesion_dispositivo, lado_pierna) {
    try {
        const response = await fetch("/esp/configurar_paciente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uuid,
                id_paciente,
                id_sesion_dispositivo,
                lado_pierna
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("📡 Config enviado al ESP:", data);
        } else {
            console.error("❌ Error al enviar config al ESP:", data);
        }
    } catch (error) {
        console.error("❌ Error de red al enviar config al ESP:", error);
    }
}


async function cargarDispositivosActivos() {
    const response = await fetch("/dispositivos/activos");
    const dispositivos = await response.json();

    let contenedor = document.getElementById("dispositivos-activos");
    contenedor.innerHTML = "";

    if (dispositivos.length === 0) {
        contenedor.innerHTML = "<p style='color: white;'>⚠️ No hay dispositivos activos aún.</p>";
        return;
    }

    dispositivos.forEach(dispositivo => {
        const select = document.createElement("select");
        select.innerHTML = `
            <option value="">Selecciona pierna</option>
            <option value="izquierda" ${dispositivo.pierna === "izquierda" ? "selected" : ""}>Izquierda</option>
            <option value="derecha" ${dispositivo.pierna === "derecha" ? "selected" : ""}>Derecha</option>
        `;
        select.onchange = async () => {
            const nuevoLado = select.value;
        
            await fetch(`/dispositivos/lado_pierna/${dispositivo.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lado: nuevoLado })
            });
        
            // 🔄 Guardar el lado localmente
            localStorage.setItem(`lado_pierna_${dispositivo.id}`, nuevoLado);
        
            // 📡 Volver a enviar al ESP si ya está activo
            const ids = JSON.parse(localStorage.getItem("sesion_dispositivo_ids")) || [];
            if (ids.includes(dispositivo.id)) {
                const uuid = dispositivo.uuid;
                const id_paciente = localStorage.getItem("id_paciente");
                await enviarDatosAlESP(uuid, parseInt(id_paciente), dispositivo.id, nuevoLado);
            }
        
            mostrarMensaje("Lado actualizado correctamente", "success");
        };        

        let row = document.createElement("div");
        row.innerHTML = `<strong>${dispositivo.nombre}</strong>`;
        row.appendChild(select);
        contenedor.appendChild(row);
    });
}

suscribirseAGraficasRealtime();
cargarDispositivosActivos();
