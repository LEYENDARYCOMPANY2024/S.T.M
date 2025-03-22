const supabase = window.supabase.createClient(
    'https://hxjmzijhcmhfcrjcptge.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4am16aWpoY21oZmNyamNwdGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwODMxODgsImV4cCI6MjA1NTY1OTE4OH0.fZ1QaYkFTfJTdupOUkV7V9a7kIIVHCt_XusnNWxkyqw'
);

let chartData = {
    labels: [],
    derecha: [],
    izquierda: []
};

let chart = null;
let realtimePaused = false;
const MAX_DATA_POINTS = 30;

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

function limitData() {
    if (chartData.labels.length > MAX_DATA_POINTS) {
        chartData.labels.shift();
        chartData.derecha.shift();
        chartData.izquierda.shift();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const chartCanvas = document.getElementById("grafica_realtime");
    chart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Pierna Derecha',
                    borderColor: 'red',
                    data: chartData.derecha,
                    fill: false
                },
                {
                    label: 'Pierna Izquierda',
                    borderColor: 'blue',
                    data: chartData.izquierda,
                    fill: false
                }
            ]
        },
        options: {
            animation: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    document.getElementById("importInput").addEventListener("change", importarCSV);
});

function exportarGraficaCSV() {
    if (!chartData.labels.length) {
        mostrarMensaje("❌ No hay datos para exportar.", "error");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Hora Exacta,Pierna Derecha,Pierna Izquierda\n";
    chartData.labels.forEach((label, index) => {
        let derecha = chartData.derecha[index] || 0;
        let izquierda = chartData.izquierda[index] || 0;
        csvContent += `${label},${derecha},${izquierda}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "datos_grafica.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarMensaje("✅ CSV exportado con hora exacta.", "success");
}

function suscribirseAGraficasRealtime() {
    const ids = JSON.parse(localStorage.getItem("sesion_dispositivo_ids"));
    if (!ids || ids.length === 0) return;

    supabase
        .channel('graficas_realtime')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'graficas'
        }, payload => {
            if (realtimePaused) return;

            const data = payload.new;
            if (!ids.includes(data.id_sesion_dispositivo_fk)) return;

            const timestamp = new Date(data.fecha_hora).toLocaleTimeString(); // HH:MM:SS

            chartData.labels.push(timestamp);

            if (data.lado_pierna === 'derecha') {
                chartData.derecha.push(data.aceleracion_y);
                chartData.izquierda.push(0);
            } else {
                chartData.izquierda.push(data.aceleracion_y);
                chartData.derecha.push(0);
            }

            limitData();
            chart.update();
        })
        .subscribe();
}

function togglePause() {
    realtimePaused = !realtimePaused;
    document.getElementById("pauseButton").textContent = realtimePaused ? "Reanudar" : "Pausar";
    mostrarMensaje(realtimePaused ? "⏸️ Pausado" : "▶️ Reanudado");
}

function reiniciarGrafica() {
    chartData.labels = [];
    chartData.derecha = [];
    chartData.izquierda = [];
    chart.update();
    mostrarMensaje("🔄 Gráfica reiniciada");
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
            await fetch(`/dispositivos/lado_pierna/${dispositivo.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lado: select.value })
            });
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
